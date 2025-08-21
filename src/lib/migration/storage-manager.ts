import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { StorageKeys } from '@/lib/mirror/storage';

interface VersionedData<T> {
  version: number;
  data: T;
  checksum: string;
  lastModified: number;
}

interface QueueItem {
  key: string;
  value: any;
  userId?: string;
  timestamp: number;
  retryCount: number;
}

export class SecureStorageManager {
  private static instance: SecureStorageManager;
  private writeQueue: Map<string, QueueItem> = new Map();
  private syncInProgress = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000;
  private readonly BATCH_SIZE = 10;
  
  private constructor() {
    // Start background sync
    if (typeof window !== 'undefined') {
      this.startBackgroundSync();
    }
  }

  static getInstance(): SecureStorageManager {
    if (!SecureStorageManager.instance) {
      SecureStorageManager.instance = new SecureStorageManager();
    }
    return SecureStorageManager.instance;
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Validate data structure and checksum
   */
  private validateData<T>(stored: string): T | null {
    try {
      const parsed = JSON.parse(stored) as VersionedData<T>;
      
      // Check version
      if (parsed.version !== 1) {
        console.warn('[StorageManager] Unknown data version:', parsed.version);
        return null;
      }
      
      // Verify checksum
      const expectedChecksum = this.generateChecksum(parsed.data);
      if (parsed.checksum !== expectedChecksum) {
        console.error('[StorageManager] Checksum mismatch, data may be corrupted');
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error('[StorageManager] Failed to validate data:', error);
      return null;
    }
  }

  /**
   * Read from localStorage with validation
   */
  private readFromLocalStorage<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(`eva_mirror_v1:${key}`);
      if (!stored) return null;
      
      // Try to read as versioned data first
      const validated = this.validateData<T>(stored);
      if (validated) return validated;
      
      // Fallback to legacy format
      try {
        return JSON.parse(stored) as T;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('[StorageManager] Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Write to localStorage with versioning
   */
  private writeToLocalStorage<T>(key: string, value: T): void {
    try {
      const versioned: VersionedData<T> = {
        version: 1,
        data: value,
        checksum: this.generateChecksum(value),
        lastModified: Date.now()
      };
      
      localStorage.setItem(`eva_mirror_v1:${key}`, JSON.stringify(versioned));
    } catch (error) {
      console.error('[StorageManager] Failed to write to localStorage:', error);
    }
  }

  /**
   * Queue write for background sync to Supabase
   */
  private queueWrite(key: string, value: any, userId?: string): void {
    const queueKey = `${userId || 'anonymous'}:${key}`;
    
    this.writeQueue.set(queueKey, {
      key,
      value,
      userId,
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  /**
   * Background sync process
   */
  private async startBackgroundSync(): Promise<void> {
    setInterval(() => {
      if (!this.syncInProgress && this.writeQueue.size > 0) {
        this.processQueue();
      }
    }, this.RETRY_DELAY);
  }

  /**
   * Process queued writes to Supabase
   */
  private async processQueue(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    console.log('[StorageManager] Processing queue, size:', this.writeQueue.size);
    
    const batch = Array.from(this.writeQueue.entries()).slice(0, this.BATCH_SIZE);
    
    for (const [queueKey, item] of batch) {
      try {
        // Skip if no userId (can't sync to Supabase without auth)
        if (!item.userId) {
          this.writeQueue.delete(queueKey);
          continue;
        }
        
        await this.syncToSupabase(item);
        this.writeQueue.delete(queueKey);
        
        // Log successful sync
        await this.logSync(item.userId, item.key, 'success');
      } catch (error) {
        console.error(`[StorageManager] Failed to sync ${item.key}:`, error);
        
        item.retryCount++;
        
        if (item.retryCount >= this.MAX_RETRIES) {
          console.error(`[StorageManager] Max retries reached for ${item.key}`);
          this.writeQueue.delete(queueKey);
          
          // Log failed sync
          await this.logSync(item.userId || '', item.key, 'failed', error);
        }
      }
    }
    
    this.syncInProgress = false;
  }

  /**
   * Sync data to Supabase (placeholder - will be implemented based on data type)
   */
  private async syncToSupabase(item: QueueItem): Promise<void> {
    // This will be implemented based on the specific data type
    // For now, just log
    console.log('[StorageManager] Would sync to Supabase:', {
      key: item.key,
      userId: item.userId,
      hasValue: !!item.value
    });
  }

  /**
   * Log sync operations for monitoring
   */
  private async logSync(
    userId: string, 
    key: string, 
    status: 'success' | 'failed', 
    error?: any
  ): Promise<void> {
    // Will be implemented to log to migration_audit_log
    console.log('[StorageManager] Sync log:', { userId, key, status, error });
  }

  /**
   * Public write method with dual storage
   */
  async write<T>(key: string, value: T, userId?: string): Promise<void> {
    // Always write to localStorage first
    this.writeToLocalStorage(key, value);
    
    // Queue for Supabase sync if we have a userId
    if (userId) {
      this.queueWrite(key, value, userId);
    }
  }

  /**
   * Public read method
   */
  async read<T>(key: string, fallback: T): Promise<T> {
    // For now, just read from localStorage
    // Phase 1 will add Supabase reads
    return this.readFromLocalStorage<T>(key) || fallback;
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): { size: number; items: QueueItem[] } {
    return {
      size: this.writeQueue.size,
      items: Array.from(this.writeQueue.values())
    };
  }

  /**
   * Force sync all queued items
   */
  async forceSync(): Promise<void> {
    if (!this.syncInProgress) {
      await this.processQueue();
    }
  }
}


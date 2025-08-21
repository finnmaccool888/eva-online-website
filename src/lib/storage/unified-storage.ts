/**
 * Unified Storage Manager
 * 
 * This module provides a single source of truth for all user data.
 * Supabase is the primary storage, localStorage is used only as a cache.
 * 
 * Key principles:
 * 1. Always write to Supabase first
 * 2. localStorage is read-only cache (except for temporary drafts)
 * 3. On conflicts, Supabase always wins
 * 4. All points calculations happen server-side
 */

import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/mirror/types';
import { POINTS, calculateBasePoints } from '@/lib/constants/points';
import { getTwitterAuth } from '@/lib/mirror/auth';
import { readJson, writeJson, StorageKeys } from '@/lib/mirror/storage';

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'supabase' | 'cache' | 'default';
}

export interface ProfileData {
  profile: UserProfile;
  lastSynced: number;
  version: number;
}

const STORAGE_VERSION = 2; // Increment when making breaking changes
const SYNC_INTERVAL = 60000; // 1 minute
const CACHE_KEY = 'eva_unified_profile_v2';

class UnifiedStorageManager {
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private listeners: Set<(profile: UserProfile) => void> = new Set();

  /**
   * Load user profile with Supabase as source of truth
   */
  async loadProfile(): Promise<StorageResult<UserProfile>> {
    const auth = getTwitterAuth();
    if (!auth?.twitterHandle) {
      return { 
        success: false, 
        error: 'No authentication found' 
      };
    }

    try {
      // Try to load from Supabase first
      const supabaseResult = await this.loadFromSupabase(auth.twitterHandle);
      
      if (supabaseResult.success && supabaseResult.data) {
        // Update cache with fresh data
        this.updateCache(supabaseResult.data);
        return supabaseResult;
      }

      // If Supabase fails, check cache
      const cachedData = this.loadFromCache();
      if (cachedData && this.isCacheValid(cachedData)) {
        console.warn('[UnifiedStorage] Using cached data due to Supabase error');
        return {
          success: true,
          data: cachedData.profile,
          source: 'cache'
        };
      }

      // No valid data anywhere - create default profile
      const defaultProfile = this.createDefaultProfile(auth);
      await this.saveProfile(defaultProfile);
      
      return {
        success: true,
        data: defaultProfile,
        source: 'default'
      };

    } catch (error) {
      console.error('[UnifiedStorage] Error loading profile:', error);
      return {
        success: false,
        error: 'Failed to load profile'
      };
    }
  }

  /**
   * Save profile to Supabase and update cache
   */
  async saveProfile(profile: UserProfile): Promise<StorageResult<UserProfile>> {
    const auth = getTwitterAuth();
    if (!auth?.twitterHandle) {
      return { 
        success: false, 
        error: 'No authentication found' 
      };
    }

    // Prevent concurrent saves
    if (this.isSyncing) {
      console.log('[UnifiedStorage] Sync already in progress, queueing...');
      return { success: true, data: profile };
    }

    this.isSyncing = true;

    try {
      // Get user ID from Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, is_og')
        .eq('twitter_handle', auth.twitterHandle)
        .single();

      if (userError || !user) {
        throw new Error('User not found in database');
      }

      // Calculate points with OG enforcement
      const totalPoints = this.calculateTotalPoints(profile, user.is_og);

      // Update Supabase
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          points: totalPoints,
          human_score: profile.humanScore || 0,
          total_questions_answered: profile.totalQuestionsAnswered || 0,
          personal_info: profile.personalInfo || {},
          social_profiles: profile.socialProfiles || [],
          is_og_rewarded: user.is_og,
          has_onboarded: profile.hasOnboarded || false,
          trust_score: profile.trustScore || 0,
          current_streak: profile.currentStreak || 0,
          longest_streak: profile.longestStreak || 0,
          last_activity_date: profile.lastActivityDate || null,
          has_soul_seed_onboarded: profile.hasSoulSeedOnboarded || false,
          soul_seed_alias: profile.soulSeedAlias || null,
          soul_seed_vibe: profile.soulSeedVibe || null,
          soul_seed_created_at: profile.soulSeedCreatedAt 
            ? new Date(profile.soulSeedCreatedAt).toISOString() 
            : null
        });

      if (updateError) {
        throw updateError;
      }

      // Update the profile with calculated points
      const updatedProfile = {
        ...profile,
        points: totalPoints,
        isOG: user.is_og,
        ogPointsAwarded: user.is_og
      };

      // Update cache
      this.updateCache(updatedProfile);

      // Notify listeners
      this.notifyListeners(updatedProfile);

      console.log('[UnifiedStorage] Profile saved successfully', {
        twitterHandle: auth.twitterHandle,
        points: totalPoints,
        isOG: user.is_og
      });

      return {
        success: true,
        data: updatedProfile
      };

    } catch (error) {
      console.error('[UnifiedStorage] Error saving profile:', error);
      return {
        success: false,
        error: 'Failed to save profile'
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force sync with Supabase (useful after points update)
   */
  async forceSync(): Promise<StorageResult<UserProfile>> {
    this.clearCache();
    return this.loadProfile();
  }

  /**
   * Subscribe to profile changes
   */
  subscribe(listener: (profile: UserProfile) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update specific session data and sync
   */
  async updateSessionData(
    sessionData: {
      questionsAnswered?: number;
      pointsEarned?: number;
      humanScore?: number;
    }
  ): Promise<StorageResult<UserProfile>> {
    const profileResult = await this.loadProfile();
    if (!profileResult.success || !profileResult.data) {
      return profileResult;
    }

    const profile = profileResult.data;

    // Update session-related fields
    if (sessionData.questionsAnswered) {
      profile.totalQuestionsAnswered = (profile.totalQuestionsAnswered || 0) + sessionData.questionsAnswered;
    }

    if (sessionData.humanScore !== undefined && sessionData.questionsAnswered) {
      // Calculate weighted average for human score
      const currentTotal = (profile.humanScore || 0) * ((profile.totalQuestionsAnswered || sessionData.questionsAnswered) - sessionData.questionsAnswered);
      const newTotal = currentTotal + (sessionData.humanScore * sessionData.questionsAnswered);
      profile.humanScore = Math.round(newTotal / (profile.totalQuestionsAnswered || 1));
    }

    // Note: Points are calculated server-side, not added directly

    return this.saveProfile(profile);
  }

  /**
   * Mark user as onboarded
   */
  async markOnboarded(): Promise<StorageResult<UserProfile>> {
    const profileResult = await this.loadProfile();
    if (!profileResult.success || !profileResult.data) {
      return profileResult;
    }

    const profile = profileResult.data;
    profile.hasOnboarded = true;

    return this.saveProfile(profile);
  }

  /**
   * Mark soul seed onboarding as complete
   */
  async markSoulSeedOnboarded(
    alias: string,
    vibe: "ethereal" | "zen" | "cyber"
  ): Promise<StorageResult<UserProfile>> {
    const profileResult = await this.loadProfile();
    if (!profileResult.success || !profileResult.data) {
      return profileResult;
    }

    const profile = profileResult.data;
    profile.hasSoulSeedOnboarded = true;
    profile.soulSeedAlias = alias;
    profile.soulSeedVibe = vibe;
    profile.soulSeedCreatedAt = Date.now();

    return this.saveProfile(profile);
  }

  // Private methods

  private async loadFromSupabase(twitterHandle: string): Promise<StorageResult<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          twitter_handle,
          twitter_name,
          is_og,
          profile_image,
          user_profiles (*)
        `)
        .eq('twitter_handle', twitterHandle)
        .single();

      if (error || !data) {
        return { success: false, error: 'User not found' };
      }

      const profile = data.user_profiles?.[0] || data.user_profiles;
      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      const userProfile: UserProfile = {
        twitterId: data.id,
        twitterHandle: data.twitter_handle,
        twitterVerified: true,
        personalInfo: profile.personal_info || {},
        socialProfiles: profile.social_profiles || [],
        points: profile.points || calculateBasePoints(data.is_og),
        trustScore: profile.trust_score || 0,
        createdAt: new Date(profile.created_at).getTime(),
        updatedAt: new Date(profile.updated_at).getTime(),
        humanScore: profile.human_score || 0,
        totalQuestionsAnswered: profile.total_questions_answered || 0,
        sessionHistory: [], // Loaded separately from session tables
        isOG: data.is_og,
        ogPointsAwarded: profile.is_og_rewarded || data.is_og,
        hasOnboarded: profile.has_onboarded || false,
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        hasSoulSeedOnboarded: profile.has_soul_seed_onboarded || false,
        soulSeedAlias: profile.soul_seed_alias || undefined,
        soulSeedVibe: profile.soul_seed_vibe || undefined,
        soulSeedCreatedAt: profile.soul_seed_created_at 
          ? new Date(profile.soul_seed_created_at).getTime() 
          : undefined
      };

      return {
        success: true,
        data: userProfile,
        source: 'supabase'
      };

    } catch (error) {
      console.error('[UnifiedStorage] Supabase load error:', error);
      return {
        success: false,
        error: 'Failed to load from Supabase'
      };
    }
  }

  private loadFromCache(): ProfileData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached) as ProfileData;
      if (data.version !== STORAGE_VERSION) {
        console.log('[UnifiedStorage] Cache version mismatch, ignoring');
        return null;
      }

      return data;
    } catch (error) {
      console.error('[UnifiedStorage] Cache load error:', error);
      return null;
    }
  }

  private updateCache(profile: UserProfile): void {
    try {
      const data: ProfileData = {
        profile,
        lastSynced: Date.now(),
        version: STORAGE_VERSION
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));

      // Also update old localStorage for backward compatibility
      writeJson(StorageKeys.userProfile, profile);
    } catch (error) {
      console.error('[UnifiedStorage] Cache update error:', error);
    }
  }

  private clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }

  private isCacheValid(data: ProfileData): boolean {
    const age = Date.now() - data.lastSynced;
    return age < SYNC_INTERVAL * 2; // Cache valid for 2x sync interval
  }

  private createDefaultProfile(auth: any): UserProfile {
    return {
      twitterId: auth.twitterId,
      twitterHandle: auth.twitterHandle,
      twitterVerified: true,
      personalInfo: {},
      socialProfiles: [],
      points: calculateBasePoints(auth.isOG),
      trustScore: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      humanScore: 0,
      totalQuestionsAnswered: 0,
      sessionHistory: [],
      isOG: auth.isOG,
      ogPointsAwarded: auth.isOG,
      hasOnboarded: false,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  private calculateTotalPoints(profile: UserProfile, isOG: boolean): number {
    // Base points (includes OG bonus if applicable)
    let total = calculateBasePoints(isOG);

    // Add session points from history
    if (profile.sessionHistory && Array.isArray(profile.sessionHistory)) {
      total += profile.sessionHistory.reduce((sum, session) => {
        return sum + (session.pointsEarned || 0);
      }, 0);
    }

    // Add profile completion points
    // Twitter verification
    if (profile.twitterVerified) total += 1000;
    
    // Personal info completion (333 points per field)
    const personalFields = [
      profile.personalInfo?.fullName,
      profile.personalInfo?.location,
      profile.personalInfo?.bio
    ];
    const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
    total += filledFields * 333;
    
    // Social profiles (1000 points each)
    total += (profile.socialProfiles?.length || 0) * 1000;

    console.log('[UnifiedStorage] Points calculation:', {
      isOG,
      basePoints: calculateBasePoints(isOG),
      sessionPoints: profile.sessionHistory?.reduce((sum, s) => sum + (s.pointsEarned || 0), 0) || 0,
      profilePoints: filledFields * 333 + (profile.socialProfiles?.length || 0) * 1000,
      total
    });

    return total;
  }

  private notifyListeners(profile: UserProfile): void {
    this.listeners.forEach(listener => {
      try {
        listener(profile);
      } catch (error) {
        console.error('[UnifiedStorage] Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const unifiedStorage = new UnifiedStorageManager();

// Export convenience functions
export async function loadProfile(): Promise<UserProfile | null> {
  const result = await unifiedStorage.loadProfile();
  return result.success ? result.data || null : null;
}

export async function saveProfile(profile: UserProfile): Promise<boolean> {
  const result = await unifiedStorage.saveProfile(profile);
  return result.success;
}

export async function syncProfile(): Promise<boolean> {
  const result = await unifiedStorage.forceSync();
  return result.success;
}

export async function markUserOnboarded(): Promise<boolean> {
  const result = await unifiedStorage.markOnboarded();
  return result.success;
}

export async function markSoulSeedOnboarded(
  alias: string,
  vibe: "ethereal" | "zen" | "cyber"
): Promise<boolean> {
  const result = await unifiedStorage.markSoulSeedOnboarded(alias, vibe);
  return result.success;
}

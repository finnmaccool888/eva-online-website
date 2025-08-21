import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Helper to remove any non-ASCII characters from strings
function sanitizeForHeaders(str: string): string {
  if (!str) return str;
  // Remove all non-ASCII characters and trim
  return str.replace(/[^\x00-\x7F]/g, '').trim();
}

// Try both with and without NEXT_PUBLIC_ prefix for compatibility
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Sanitize to ensure no non-ASCII characters
const supabaseUrl = sanitizeForHeaders(rawSupabaseUrl);
const supabaseAnonKey = sanitizeForHeaders(rawSupabaseAnonKey);

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

// Debug: Log if sanitization was needed
if (typeof window !== 'undefined') {
  const urlWasSanitized = rawSupabaseUrl !== supabaseUrl;
  const keyWasSanitized = rawSupabaseAnonKey !== supabaseAnonKey;
  
  if (urlWasSanitized || keyWasSanitized) {
    console.warn('[Supabase] Non-ASCII characters were removed from config:', {
      urlWasSanitized,
      keyWasSanitized,
      originalUrlLength: rawSupabaseUrl.length,
      sanitizedUrlLength: supabaseUrl.length,
      originalKeyLength: rawSupabaseAnonKey.length,
      sanitizedKeyLength: supabaseAnonKey.length
    });
  }
  
  // Still log config for debugging
  console.log('[Supabase] Config check:', {
    url: supabaseUrl.substring(0, 30) + '...',
    hasValidConfig: hasValidSupabaseConfig
  });
}

// Create client with explicit options to ensure clean headers
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      // Ensure no non-ASCII characters in headers
      'x-client-info': 'eva-online'
    }
  }
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  console.error('Supabase error:', error);
  return error?.message || 'An error occurred with the database';
}

// Export config status
export { hasValidSupabaseConfig }; 
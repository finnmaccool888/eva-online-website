import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Try both with and without NEXT_PUBLIC_ prefix for compatibility
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  console.error('Supabase error:', error);
  return error?.message || 'An error occurred with the database';
}

// Export config status
export { hasValidSupabaseConfig }; 
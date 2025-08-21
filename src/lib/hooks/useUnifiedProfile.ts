/**
 * Hook for accessing and updating user profile using the unified storage system
 */

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/lib/mirror/types';
import { unifiedStorage } from '@/lib/storage/unified-storage';
import { useTwitterAuth } from './useTwitterAuth';

export interface UseUnifiedProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isOG: boolean;
  points: number;
  hasOnboarded: boolean;
  hasSoulSeedOnboarded: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  markOnboarded: () => Promise<void>;
  markSoulSeedOnboarded: (alias: string, vibe: "ethereal" | "zen" | "cyber") => Promise<void>;
  updateSessionData: (data: {
    questionsAnswered?: number;
    pointsEarned?: number;
    humanScore?: number;
  }) => Promise<void>;
}

export function useUnifiedProfile(): UseUnifiedProfileResult {
  const { auth, loading: authLoading } = useTwitterAuth();
  const isAuthenticated = !!auth;
  const twitterHandle = auth?.twitterHandle || null;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load profile on mount and auth change
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !twitterHandle) {
      console.log('[useUnifiedProfile] Not authenticated, skipping load');
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('[useUnifiedProfile] Load timeout after 10 seconds');
      setError('Profile loading timed out. Please refresh the page.');
      setLoading(false);
    }, 10000); // 10 second timeout

    try {
      console.log('[useUnifiedProfile] Loading profile for:', twitterHandle);
      const result = await unifiedStorage.loadProfile();
      
      clearTimeout(timeoutId);
      
      if (result.success && result.data) {
        setProfile(result.data);
        console.log('[useUnifiedProfile] Profile loaded:', {
          source: result.source,
          points: result.data.points,
          isOG: result.data.isOG,
          hasOnboarded: result.data.hasOnboarded
        });
      } else {
        setError(result.error || 'Failed to load profile');
        console.error('[useUnifiedProfile] Load failed:', result.error);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[useUnifiedProfile] Load error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, twitterHandle]);

  // Initialize loading state based on auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isInitialized) {
      console.log('[useUnifiedProfile] Not authenticated on mount');
      setLoading(false);
      setIsInitialized(true);
    }
  }, [authLoading, isAuthenticated, isInitialized]);

  // Subscribe to profile changes
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    // Initial load
    loadProfile();

    // Subscribe to updates
    const unsubscribe = unifiedStorage.subscribe((updatedProfile) => {
      console.log('[useUnifiedProfile] Profile updated:', {
        points: updatedProfile.points,
        isOG: updatedProfile.isOG
      });
      setProfile(updatedProfile);
    });

    return unsubscribe;
  }, [isAuthenticated, authLoading, loadProfile]);

  // Refresh profile from Supabase
  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const result = await unifiedStorage.forceSync();
      if (!result.success) {
        setError(result.error || 'Failed to sync profile');
      }
    } catch (err) {
      console.error('[useUnifiedProfile] Sync error:', err);
      setError('Failed to sync profile');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!profile || !isAuthenticated) return false;

    try {
      const updatedProfile = { ...profile, ...updates };
      const result = await unifiedStorage.saveProfile(updatedProfile);
      
      if (result.success) {
        setProfile(result.data || updatedProfile);
        return true;
      } else {
        setError(result.error || 'Failed to update profile');
        return false;
      }
    } catch (err) {
      console.error('[useUnifiedProfile] Update error:', err);
      setError('Failed to update profile');
      return false;
    }
  }, [profile, isAuthenticated]);

  // Mark user as onboarded
  const markOnboarded = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await unifiedStorage.markOnboarded();
      if (!result.success) {
        setError(result.error || 'Failed to update onboarding status');
      }
    } catch (err) {
      console.error('[useUnifiedProfile] Onboarding error:', err);
      setError('Failed to update onboarding status');
    }
  }, [isAuthenticated]);

  // Update session data
  const updateSessionData = useCallback(async (data: {
    questionsAnswered?: number;
    pointsEarned?: number;
    humanScore?: number;
  }) => {
    if (!isAuthenticated) return;

    try {
      const result = await unifiedStorage.updateSessionData(data);
      if (!result.success) {
        setError(result.error || 'Failed to update session data');
      }
    } catch (err) {
      console.error('[useUnifiedProfile] Session update error:', err);
      setError('Failed to update session data');
    }
  }, [isAuthenticated]);

  // Mark soul seed as onboarded
  const markSoulSeedOnboarded = useCallback(async (alias: string, vibe: "ethereal" | "zen" | "cyber") => {
    if (!isAuthenticated) return;

    try {
      const result = await unifiedStorage.markSoulSeedOnboarded(alias, vibe);
      if (!result.success) {
        setError(result.error || 'Failed to update soul seed onboarding status');
      }
    } catch (err) {
      console.error('[useUnifiedProfile] Soul seed onboarding error:', err);
      setError('Failed to update soul seed onboarding status');
    }
  }, [isAuthenticated]);

  return {
    profile,
    loading,
    error,
    isOG: profile?.isOG || false,
    points: profile?.points || 0,
    hasOnboarded: profile?.hasOnboarded || false,
    hasSoulSeedOnboarded: profile?.hasSoulSeedOnboarded || false,
    refreshProfile,
    updateProfile,
    markOnboarded,
    markSoulSeedOnboarded,
    updateSessionData
  };
}

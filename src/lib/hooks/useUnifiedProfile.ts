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
  const { isAuthenticated, twitterHandle } = useTwitterAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile on mount and auth change
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !twitterHandle) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await unifiedStorage.loadProfile();
      
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
      }
    } catch (err) {
      console.error('[useUnifiedProfile] Load error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, twitterHandle]);

  // Subscribe to profile changes
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated, loadProfile]);

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

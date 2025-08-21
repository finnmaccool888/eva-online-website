"use client";

import { useEffect, useState } from "react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { readJson, StorageKeys } from "@/lib/mirror/storage";
import { UserProfile as LegacyProfile } from "@/lib/mirror/types";
import { supabase } from "@/lib/supabase/client";

interface MigrationResult {
  migrated: boolean;
  pointsUpdated: boolean;
  onboardingUpdated: boolean;
  sessionsImported: number;
  error?: string;
}

export default function LocalStorageMigrator() {
  const { profile, updateProfile, markOnboarded, markSoulSeedOnboarded } = useUnifiedProfile();
  const [migrationStatus, setMigrationStatus] = useState<MigrationResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    // Only run migration once per session
    if (profile && !sessionStorage.getItem('migration_attempted')) {
      checkAndMigrate();
    }
  }, [profile]);

  async function checkAndMigrate() {
    console.log('[Migration] Checking for local data to migrate...');
    
    try {
      setIsMigrating(true);
      sessionStorage.setItem('migration_attempted', 'true');
      
      const result: MigrationResult = {
        migrated: false,
        pointsUpdated: false,
        onboardingUpdated: false,
        sessionsImported: 0
      };

      // 1. Check for local profile data
      const localProfile = readJson<LegacyProfile>(StorageKeys.userProfile);
      if (!localProfile) {
        console.log('[Migration] No local profile found');
        return;
      }

      console.log('[Migration] Found local profile:', {
        handle: localProfile.twitterHandle,
        points: localProfile.points,
        sessions: localProfile.sessionHistory?.length || 0
      });

      // 2. Migrate onboarding status
      const localOnboarded = readJson<boolean>(StorageKeys.onboarded);
      if (localOnboarded && !profile?.hasOnboarded) {
        console.log('[Migration] Migrating onboarding status...');
        await markOnboarded();
        result.onboardingUpdated = true;
      }

      // 3. Migrate soul seed data
      const localSoulSeed = readJson<any>(StorageKeys.soulSeed);
      if (localSoulSeed?.alias && localSoulSeed?.vibe && !profile?.hasSoulSeedOnboarded) {
        console.log('[Migration] Migrating soul seed data...');
        await markSoulSeedOnboarded(localSoulSeed.alias, localSoulSeed.vibe);
        result.onboardingUpdated = true;
      }

      // 4. Import session history if needed
      if (localProfile.sessionHistory && localProfile.sessionHistory.length > 0) {
        console.log('[Migration] Checking session history...');
        
        // Get user ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('twitter_handle', profile?.twitterHandle)
          .single();

        if (user) {
          // Check existing sessions
          const { data: existingSessions } = await supabase
            .from('sessions')
            .select('id')
            .eq('user_id', user.id);

          const existingCount = existingSessions?.length || 0;
          const localCount = localProfile.sessionHistory.length;

          if (localCount > existingCount) {
            console.log(`[Migration] Local has ${localCount} sessions, DB has ${existingCount}`);
            
            // Import missing sessions
            for (const session of localProfile.sessionHistory) {
              // Check if this session already exists (by date)
              const sessionDate = new Date(session.date);
              const { data: existing } = await supabase
                .from('sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('session_date', sessionDate.toISOString().split('T')[0])
                .single();

              if (!existing) {
                // Import this session
                const { error } = await supabase
                  .from('sessions')
                  .insert({
                    user_id: user.id,
                    session_date: sessionDate.toISOString().split('T')[0],
                    is_complete: true,
                    questions_answered: session.questionsAnswered || 0,
                    human_score: session.humanScore || 0,
                    points_earned: session.pointsEarned || 0,
                    created_at: sessionDate.toISOString(),
                    completed_at: sessionDate.toISOString()
                  });

                if (!error) {
                  result.sessionsImported++;
                }
              }
            }
          }
        }
      }

      // 5. Trigger point recalculation on server
      if (profile?.twitterHandle) {
        console.log('[Migration] Triggering point recalculation...');
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('twitter_handle', profile.twitterHandle)
          .single();

        if (user) {
          const { data, error } = await supabase.rpc('recalculate_user_points', {
            p_user_id: user.id
          });

          if (!error) {
            result.pointsUpdated = true;
            console.log('[Migration] Points recalculated:', data);
          }
        }
      }

      result.migrated = true;
      setMigrationStatus(result);
      
      console.log('[Migration] Complete:', result);

      // Clear old localStorage data after successful migration
      if (result.migrated && (result.onboardingUpdated || result.sessionsImported > 0)) {
        console.log('[Migration] Clearing old localStorage data...');
        localStorage.removeItem(StorageKeys.userProfile);
        localStorage.removeItem(StorageKeys.onboarded);
        localStorage.removeItem(StorageKeys.soulSeed);
      }

    } catch (error) {
      console.error('[Migration] Error:', error);
      setMigrationStatus({
        migrated: false,
        pointsUpdated: false,
        onboardingUpdated: false,
        sessionsImported: 0,
        error: String(error)
      });
    } finally {
      setIsMigrating(false);
    }
  }

  // Don't render anything - this is a background process
  if (!isMigrating || !migrationStatus) return null;

  // Only show a small indicator if actively migrating
  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
        <span>Syncing your data...</span>
      </div>
    </div>
  );
}

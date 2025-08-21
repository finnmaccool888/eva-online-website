"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";

interface MigrationStats {
  totalUsers: number;
  usersProcessed: number;
  pointsRecalculated: number;
  onboardingUpdated: number;
  errors: string[];
}

export default function MigrateUsersPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [progress, setProgress] = useState(0);

  async function runMigration() {
    setIsRunning(true);
    setProgress(0);
    
    const migrationStats: MigrationStats = {
      totalUsers: 0,
      usersProcessed: 0,
      pointsRecalculated: 0,
      onboardingUpdated: 0,
      errors: []
    };

    try {
      // 1. Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, twitter_handle, is_og');

      if (usersError || !users) {
        throw new Error('Failed to fetch users');
      }

      migrationStats.totalUsers = users.length;
      console.log(`[Migration] Found ${users.length} users to process`);

      // 2. Process each user
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        try {
          // Recalculate points
          const { error: recalcError } = await supabase.rpc('recalculate_user_points', {
            p_user_id: user.id
          });

          if (!recalcError) {
            migrationStats.pointsRecalculated++;
          } else {
            migrationStats.errors.push(`Points recalc failed for ${user.twitter_handle}: ${recalcError.message}`);
          }

          // Check and update onboarding status
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('has_onboarded, has_soul_seed_onboarded')
            .eq('user_id', user.id)
            .single();

          if (profile && !profile.has_onboarded) {
            // Check if they have sessions
            const { data: sessions } = await supabase
              .from('sessions')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_complete', true)
              .limit(1);

            if (sessions && sessions.length > 0) {
              // Mark as onboarded
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                  has_onboarded: true,
                  has_soul_seed_onboarded: true
                })
                .eq('user_id', user.id);

              if (!updateError) {
                migrationStats.onboardingUpdated++;
              }
            }
          }

          migrationStats.usersProcessed++;
          setProgress(Math.round((i + 1) / users.length * 100));

        } catch (error: any) {
          console.error(`[Migration] Error processing user ${user.twitter_handle}:`, error);
          migrationStats.errors.push(`User ${user.twitter_handle}: ${error.message}`);
        }
      }

      // 3. Verify OG bonuses
      const { error: ogError } = await supabase.rpc('enforce_og_bonus', {
        p_user_id: null,
        p_is_og: null
      });

      if (ogError) {
        migrationStats.errors.push(`OG enforcement failed: ${ogError.message}`);
      }

      setStats(migrationStats);
      console.log('[Migration] Complete:', migrationStats);

    } catch (error: any) {
      console.error('[Migration] Fatal error:', error);
      setStats({
        ...migrationStats,
        errors: [`Fatal error: ${error.message}`]
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">User Migration Tool</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h2 className="font-semibold text-lg">What this tool does:</h2>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Recalculates points for all users using the new atomic functions</li>
                  <li>• Updates onboarding flags based on session history</li>
                  <li>• Ensures OG bonuses are correctly applied</li>
                  <li>• Fixes any point inconsistencies</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={runMigration}
                disabled={isRunning}
                className="w-full"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing... {progress}%
                  </>
                ) : (
                  'Run Migration for All Users'
                )}
              </Button>
            </div>

            {isRunning && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </Card>

        {stats && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {stats.errors.length === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <h2 className="font-semibold text-lg">Migration Results</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-semibold">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed:</span>
                    <span className="font-semibold">{stats.usersProcessed}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Fixed:</span>
                    <span className="font-semibold">{stats.pointsRecalculated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Onboarding Updated:</span>
                    <span className="font-semibold">{stats.onboardingUpdated}</span>
                  </div>
                </div>
              </div>

              {stats.errors.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-sm text-yellow-800 mb-2">
                    Errors ({stats.errors.length}):
                  </h3>
                  <ul className="space-y-1 text-xs text-yellow-700">
                    {stats.errors.slice(0, 10).map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                    {stats.errors.length > 10 && (
                      <li>... and {stats.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900">Alternative: SQL Migration</h3>
            <p className="text-sm text-blue-700">
              For faster bulk migration, you can run the SQL script directly in Supabase:
            </p>
            <code className="block p-3 bg-white rounded text-xs">
              supabase/migrate-existing-users.sql
            </code>
          </div>
        </Card>
      </div>
    </div>
  );
}

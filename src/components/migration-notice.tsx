"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, Sparkles, Database, RefreshCw } from "lucide-react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { supabase } from "@/lib/supabase/client";
import { isOG } from "@/lib/mirror/og-verification";

interface MigrationStatus {
  checking: boolean;
  needsMigration: boolean;
  hasLocalSessions: boolean;
  missingOGPoints: boolean;
  pointsInconsistent: boolean;
  migrating: boolean;
  complete: boolean;
  error?: string;
  result?: {
    ogPointsApplied: boolean;
    sessionsImported: number;
    pointsRecovered: number;
    message: string;
  };
}

export default function MigrationNotice() {
  const { profile, refreshProfile } = useUnifiedProfile();
  const [status, setStatus] = useState<MigrationStatus>({
    checking: true,
    needsMigration: false,
    hasLocalSessions: false,
    missingOGPoints: false,
    pointsInconsistent: false,
    migrating: false,
    complete: false
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      checkMigrationNeeded();
    }
  }, [profile]);

  async function checkMigrationNeeded() {
    try {
      // Check if already marked as seen
      if (profile?.migrationMessageSeen) {
        setStatus(prev => ({ ...prev, checking: false }));
        return;
      }

      // Get user from database
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('twitter_handle', profile.twitterHandle)
        .single();

      if (!user) {
        setStatus(prev => ({ ...prev, checking: false }));
        return;
      }

      // Check migration needs via RPC
      const { data: migrationCheck } = await supabase
        .rpc('check_user_needs_migration', { p_user_id: user.id });

      // Check for local sessions
      const localSessions = localStorage.getItem('eva_mirror_v1:sessionHistory');
      const hasLocal = !!(localSessions && JSON.parse(localSessions)?.length > 0);

      const needsMigration = migrationCheck?.needs_migration || hasLocal;

      setStatus({
        checking: false,
        needsMigration,
        hasLocalSessions: hasLocal,
        missingOGPoints: migrationCheck?.missing_og_points || false,
        pointsInconsistent: migrationCheck?.points_inconsistent || false,
        migrating: false,
        complete: false
      });

      if (needsMigration) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Migration check error:', error);
      setStatus(prev => ({ ...prev, checking: false }));
    }
  }

  async function performMigration() {
    if (!profile) return;

    setStatus(prev => ({ ...prev, migrating: true, error: undefined }));

    try {
      let totalPointsRecovered = 0;
      let sessionsImported = 0;
      let ogPointsApplied = false;
      const messages: string[] = [];

      // Get user from database
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('twitter_handle', profile.twitterHandle)
        .single();

      if (!user) throw new Error('User not found');

      // Step 1: Apply OG bonus if needed
      if (isOG(profile.twitterHandle)) {
        const { data: ogResult } = await supabase
          .rpc('apply_og_bonus_once', {
            p_user_id: user.id,
            p_twitter_handle: profile.twitterHandle
          });

        if (ogResult?.points_applied) {
          ogPointsApplied = true;
          totalPointsRecovered += 10000;
          messages.push('OG bonus of 10,000 points applied');
        } else if (ogResult?.message) {
          messages.push(ogResult.message);
        }
      }

      // Step 2: Import local sessions
      const localSessions = localStorage.getItem('eva_mirror_v1:sessionHistory');
      if (localSessions) {
        try {
          const sessions = JSON.parse(localSessions);
          
          for (const session of sessions) {
            if (session.pointsEarned > 0) {
              // Check if session already exists by timestamp
              const { data: existing } = await supabase
                .from('sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('created_at', new Date(session.timestamp).toISOString())
                .single();

              if (!existing) {
                const { error } = await supabase
                  .from('sessions')
                  .insert({
                    user_id: user.id,
                    questions_answered: session.questionsAnswered || 5,
                    human_score: session.humanScore || 0,
                    points_earned: session.pointsEarned,
                    is_complete: true,
                    created_at: new Date(session.timestamp).toISOString()
                  });

                if (!error) {
                  sessionsImported++;
                  totalPointsRecovered += session.pointsEarned;
                }
              }
            }
          }

          if (sessionsImported > 0) {
            messages.push(`Imported ${sessionsImported} local sessions`);
          }
        } catch (error) {
          console.error('Session import error:', error);
        }
      }

      // Step 3: Recalculate total points
      if (ogPointsApplied || sessionsImported > 0) {
        await supabase.rpc('recalculate_user_points', { p_user_id: user.id });
      }

      // Step 4: Mark migration as seen
      await supabase.rpc('mark_migration_seen', { p_user_id: user.id });

      // Step 5: Clear old localStorage data
      const keysToRemove = [
        'eva_mirror_v1:sessionHistory',
        'eva_mirror_v1:user_profile',
        'eva_mirror_v1:artifacts',
        'eva_mirror_v1:memories'
      ];
      
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });

      // Refresh profile
      await refreshProfile();

      setStatus({
        checking: false,
        needsMigration: false,
        hasLocalSessions: false,
        missingOGPoints: false,
        pointsInconsistent: false,
        migrating: false,
        complete: true,
        result: {
          ogPointsApplied,
          sessionsImported,
          pointsRecovered: totalPointsRecovered,
          message: messages.join('. ') || 'Migration complete'
        }
      });

    } catch (error) {
      console.error('Migration error:', error);
      setStatus(prev => ({
        ...prev,
        migrating: false,
        error: error.message || 'Migration failed'
      }));
    }
  }

  function handleClose() {
    setIsOpen(false);
    // Mark as seen even if they close without migrating
    if (profile && !status.complete) {
      supabase
        .from('users')
        .select('id')
        .eq('twitter_handle', profile.twitterHandle)
        .single()
        .then(({ data: user }) => {
          if (user) {
            supabase.rpc('mark_migration_seen', { p_user_id: user.id });
          }
        });
    }
  }

  if (!status.needsMigration || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Storage System Update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!status.complete && !status.migrating && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  We've upgraded our storage system to be more reliable. We need to migrate your data to ensure nothing is lost.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">What we'll do:</h4>
                
                {status.missingOGPoints && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-pink-600 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium">Apply OG Bonus</span>
                      <p className="text-muted-foreground">You're an OG member! We'll ensure your 10,000 bonus points are applied.</p>
                    </div>
                  </div>
                )}

                {status.hasLocalSessions && (
                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium">Import Local Sessions</span>
                      <p className="text-muted-foreground">We found sessions stored locally that need to be saved online.</p>
                    </div>
                  </div>
                )}

                {status.pointsInconsistent && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-medium">Fix Point Calculations</span>
                      <p className="text-muted-foreground">We'll recalculate your total points to ensure accuracy.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleClose} 
                  variant="outline" 
                  className="flex-1"
                >
                  Skip for Now
                </Button>
                <Button 
                  onClick={performMigration} 
                  className="flex-1"
                >
                  Migrate Now
                </Button>
              </div>
            </>
          )}

          {status.migrating && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground">
                Migrating your data to the new system...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a few moments
              </p>
            </div>
          )}

          {status.error && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Migration Failed</p>
                    <p className="text-xs text-red-700 mt-1">{status.error}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button onClick={performMigration} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {status.complete && status.result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Migration Complete!</p>
                    <p className="text-sm text-green-700 mt-1">{status.result.message}</p>
                  </div>
                </div>
              </div>

              {(status.result.ogPointsApplied || status.result.sessionsImported > 0) && (
                <div className="space-y-2">
                  {status.result.ogPointsApplied && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OG Bonus Applied</span>
                      <Badge variant="success">+10,000 pts</Badge>
                    </div>
                  )}
                  {status.result.sessionsImported > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sessions Imported</span>
                      <Badge variant="success">{status.result.sessionsImported}</Badge>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Points Recovered</span>
                      <span className="text-green-600">
                        +{status.result.pointsRecovered.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Continue to Eva
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

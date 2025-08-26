"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";
import { isOG } from "@/lib/mirror/og-verification";
import { supabase } from "@/lib/supabase/client";

interface RecoveryResult {
  ogStatusChecked: boolean;
  ogPointsApplied: boolean;
  sessionsRecovered: number;
  totalPointsRecovered: number;
  message?: string;
  error?: string;
}

export default function OGRecoveryDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { profile, refreshProfile } = useUnifiedProfile();
  const [isRecovering, setIsRecovering] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);

  async function handleRecovery() {
    if (!profile) return;
    
    setIsRecovering(true);
    setResult(null);

    try {
      const recoveryResult: RecoveryResult = {
        ogStatusChecked: false,
        ogPointsApplied: false,
        sessionsRecovered: 0,
        totalPointsRecovered: 0
      };

      // Step 1: Check OG status
      const userIsOG = isOG(profile.twitterHandle);
      recoveryResult.ogStatusChecked = true;

      // Step 2: Get user from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('twitter_handle', profile.twitterHandle)
        .single();

      if (userError || !user) {
        throw new Error('User not found in database. Please try logging out and back in.');
      }

      // Step 3: Apply OG points if needed using the new RPC function
      if (userIsOG) {
        const { data: ogResult, error: ogError } = await supabase
          .rpc('apply_og_bonus_once', {
            p_user_id: user.id,
            p_twitter_handle: profile.twitterHandle
          });

        if (ogError) {
          throw new Error(`Failed to check OG status: ${ogError.message}`);
        }

        if (ogResult) {
          recoveryResult.ogPointsApplied = ogResult.points_applied;
          recoveryResult.message = ogResult.message;
          if (ogResult.points_applied) {
            recoveryResult.totalPointsRecovered += 10000;
          }
        }
      } else {
        recoveryResult.message = "You are not on the OG list. OG status is reserved for early community members.";
      }

      // Step 4: Recover local sessions
      const localSessions = localStorage.getItem('eva_mirror_v1:sessionHistory');
      if (localSessions) {
        try {
          const sessions = JSON.parse(localSessions);
          
          // Import sessions to database
          for (const session of sessions) {
            if (session.pointsEarned > 0) {
              // Check if session already exists
              const { data: existingSession } = await supabase
                .from('sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('created_at', new Date(session.timestamp || session.date).toISOString())
                .single();

              if (!existingSession) {
                // Create session
                const { error: sessionError } = await supabase
                  .from('sessions')
                  .insert({
                    user_id: user.id,
                    questions_answered: session.questionsAnswered || 5,
                    human_score: session.humanScore || 0,
                    points_earned: session.pointsEarned,
                    is_complete: true,
                    created_at: new Date(session.timestamp || session.date).toISOString()
                  });

                if (!sessionError) {
                  recoveryResult.sessionsRecovered++;
                  recoveryResult.totalPointsRecovered += session.pointsEarned;
                }
              }
            }
          }

          // Clear local sessions after successful import
          if (recoveryResult.sessionsRecovered > 0) {
            localStorage.removeItem('eva_mirror_v1:sessionHistory');
          }
        } catch (error) {
          console.error('Session import error:', error);
        }
      }

      // Step 5: Recalculate total points if we made any changes
      if (recoveryResult.ogPointsApplied || recoveryResult.sessionsRecovered > 0) {
        const { error: recalcError } = await supabase
          .rpc('recalculate_user_points', { p_user_id: user.id });
        
        if (recalcError) {
          console.error('Points recalculation error:', recalcError);
        }
      }

      // Step 6: Refresh profile
      await refreshProfile();

      setResult(recoveryResult);
    } catch (error) {
      console.error('Recovery error:', error);
      setResult({
        ogStatusChecked: false,
        ogPointsApplied: false,
        sessionsRecovered: 0,
        totalPointsRecovered: 0,
        error: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsRecovering(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" />
            Points Recovery & OG Status Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!result && !isRecovering && (
            <>
              <p className="text-sm text-muted-foreground">
                This tool will check your account and recover any missing points.
              </p>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Check your OG status and apply 10,000 bonus points if eligible (one-time only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Scan for any local sessions and restore them to your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Ensure all points are properly calculated and stored online</span>
                </li>
              </ul>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> OG points can only be awarded once per Twitter account. 
                  OG status is determined by our official list of early community members.
                </p>
              </div>

              <Button onClick={handleRecovery} className="w-full">
                Start Recovery
              </Button>
            </>
          )}

          {isRecovering && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-600" />
              <p className="mt-2 text-sm text-muted-foreground">
                Checking your account and recovering points...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Recovery Failed</p>
                      <p className="text-xs text-red-700 mt-1">{result.error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OG Status Checked</span>
                      <Badge variant={result.ogStatusChecked ? "success" : "secondary"}>
                        {result.ogStatusChecked ? "✓" : "—"}
                      </Badge>
                    </div>
                    
                    {result.message && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">{result.message}</p>
                      </div>
                    )}
                    
                    {result.ogPointsApplied && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">OG Points Applied</span>
                        <Badge variant="success">+10,000</Badge>
                      </div>
                    )}

                    {result.sessionsRecovered > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sessions Recovered</span>
                        <Badge variant="success">{result.sessionsRecovered}</Badge>
                      </div>
                    )}

                    {result.totalPointsRecovered > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between font-medium">
                          <span>Total Points Recovered</span>
                          <span className="text-green-600">
                            +{result.totalPointsRecovered.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {result.totalPointsRecovered === 0 && !result.error && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-700">
                          No points to recover. Your account is up to date!
                        </p>
                      </div>
                    )}
                  </div>

                  <Button onClick={onClose} className="w-full" variant="outline">
                    Close
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

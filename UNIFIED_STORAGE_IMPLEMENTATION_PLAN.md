# Unified Online-Only Storage Implementation Plan

## Overview
This plan addresses your four key requirements:
1. Unified online-only storage tied to Twitter accounts
2. OG status verification popup with one-time points application
3. Online-only session storage moving forward
4. Clean reset mechanism for starting new sessions

## Current State Analysis

### Problems Identified
1. **Mixed V1/V2 Architecture**: Profile page uses old V1 dashboard component
2. **Dual Storage Systems**: Both localStorage and Supabase are used inconsistently
3. **OG Points Not Persistent**: Points disappear on refresh due to storage conflicts
4. **Session Storage Fragmented**: Sessions stored in multiple places

### Critical Issue
The profile page imports the wrong component:
```typescript
// Current (WRONG) - src/app/profile/page.tsx line 5
import ProfileDashboard from "@/components/profile/profile-dashboard";

// Should be:
import ProfileDashboard from "@/components/profile/profile-dashboard-v2";
```

## Implementation Plan

### Phase 1: Fix Component Architecture (Immediate)

#### 1.1 Update Component Imports
**File**: `src/app/profile/page.tsx`
```typescript
// Change line 5 from:
import ProfileDashboard from "@/components/profile/profile-dashboard";
// To:
import ProfileDashboard from "@/components/profile/profile-dashboard-v2";
```

#### 1.2 Verify All V2 Components Are Used
- ✅ Mirror page already uses `MirrorAppV2`
- ✅ Points display has V2 version
- ❌ Profile page needs update (above)

### Phase 2: Create OG Verification & Recovery System

#### 2.1 Create OG Status Recovery Component
**New File**: `src/components/og-recovery-dialog.tsx`

```typescript
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
      const { data: user } = await supabase
        .from('users')
        .select('*, user_profiles(*)')
        .eq('twitter_handle', profile.twitterHandle)
        .single();

      if (!user) {
        throw new Error('User not found in database');
      }

      // Step 3: Apply OG points if needed
      if (userIsOG && user.user_profiles) {
        const profile = Array.isArray(user.user_profiles) 
          ? user.user_profiles[0] 
          : user.user_profiles;

        // Check if OG points need to be applied
        const hasOGBonus = profile.og_bonus_points === 10000;
        
        if (!hasOGBonus) {
          // Apply OG bonus
          await supabase.rpc('enforce_og_bonus', {
            p_user_id: user.id,
            p_is_og: true
          });
          
          recoveryResult.ogPointsApplied = true;
          recoveryResult.totalPointsRecovered += 10000;
        }
      }

      // Step 4: Recover local sessions
      const localSessions = localStorage.getItem('eva_mirror_v1:sessionHistory');
      if (localSessions) {
        const sessions = JSON.parse(localSessions);
        
        // Import sessions to database
        for (const session of sessions) {
          if (session.pointsEarned > 0) {
            // Check if session already exists
            const exists = await supabase
              .from('sessions')
              .select('id')
              .eq('user_id', user.id)
              .eq('created_at', session.timestamp)
              .single();

            if (!exists.data) {
              // Create session
              await supabase.from('sessions').insert({
                user_id: user.id,
                questions_answered: session.questionsAnswered || 5,
                human_score: session.humanScore,
                points_earned: session.pointsEarned,
                is_complete: true,
                created_at: new Date(session.timestamp).toISOString()
              });

              recoveryResult.sessionsRecovered++;
              recoveryResult.totalPointsRecovered += session.pointsEarned;
            }
          }
        }
      }

      // Step 5: Recalculate total points
      await supabase.rpc('recalculate_user_points', {
        p_user_id: user.id
      });

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
        error: error.message
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
                This tool will:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Check your OG status and apply 10,000 bonus points if eligible</span>
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
                    
                    {result.ogPointsApplied && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">OG Points Applied</span>
                        <Badge variant="success">+10,000</Badge>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sessions Recovered</span>
                      <Badge variant={result.sessionsRecovered > 0 ? "success" : "secondary"}>
                        {result.sessionsRecovered}
                      </Badge>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between font-medium">
                        <span>Total Points Recovered</span>
                        <span className="text-green-600">
                          +{result.totalPointsRecovered.toLocaleString()}
                        </span>
                      </div>
                    </div>
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
```

#### 2.2 Add Recovery Button to Profile Dashboard V2
**Update**: `src/components/profile/profile-dashboard-v2.tsx`

Add after line 10 (imports):
```typescript
import OGRecoveryDialog from "@/components/og-recovery-dialog";
```

Add after line 34 (state variables):
```typescript
const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
```

Add before the closing div (around line 140):
```typescript
{/* Recovery Button */}
<div className="fixed bottom-4 right-4 z-50">
  <button
    onClick={() => setShowRecoveryDialog(true)}
    className="bg-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
  >
    <Sparkles className="h-4 w-4" />
    Check Points & OG Status
  </button>
</div>

{/* Recovery Dialog */}
<OGRecoveryDialog 
  isOpen={showRecoveryDialog}
  onClose={() => setShowRecoveryDialog(false)}
/>
```

### Phase 3: Ensure Online-Only Session Storage

#### 3.1 Update UnifiedStorage Session Save
The current `eva-transmission-v2.tsx` already saves sessions to Supabase. We need to ensure NO localStorage writes for session data.

**Verify**: `src/components/mirror/eva-transmission-v2.tsx` lines 321-368
- ✅ Already saves to Supabase
- ✅ Uses unified storage for profile updates

#### 3.2 Remove localStorage Session Writes
Search and remove any direct localStorage writes for sessions:
```bash
# Files to check and clean:
- src/lib/mirror/storage.ts
- src/components/mirror/eva-transmission.tsx (V1 - not used)
- Any other components writing session data
```

### Phase 4: Clean Reset Mechanism

#### 4.1 Create Enhanced Reset Component
**New File**: `src/components/session-reset-dialog.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useUnifiedProfile } from "@/lib/hooks/useUnifiedProfile";

export default function SessionResetDialog({ 
  isOpen, 
  onClose,
  onReset
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onReset: () => void;
}) {
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    setIsResetting(true);
    
    try {
      // Clear only non-essential localStorage
      localStorage.removeItem('eva_mirror_v1:currentSession');
      localStorage.removeItem('eva_mirror_v1:tempAnswers');
      localStorage.removeItem('ogPopupShown');
      
      // Keep auth and essential data
      // Twitter auth, profile cache, etc. remain untouched
      
      // Trigger callback
      onReset();
      
      // Close dialog
      onClose();
      
      // Reload to fresh state
      window.location.reload();
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Start Fresh Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will clear your current session and allow you to start a new conversation with Eva.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Your points and profile data are safe!</strong> Only the current session will be cleared.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReset} 
              className="flex-1"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                'Start Fresh'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### 4.2 Add Reset Option to Mirror Page
Update `src/components/mirror/mirror-app-v2.tsx` to include reset functionality.

### Phase 5: Database Schema Updates

#### 5.1 Ensure OG Tracking
**SQL Migration**: `supabase/ensure-og-tracking.sql`

```sql
-- Ensure OG points are tracked separately and can only be applied once
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS og_points_applied_at TIMESTAMPTZ;

-- Create index for quick OG lookups
CREATE INDEX IF NOT EXISTS idx_users_twitter_handle_og 
ON users(twitter_handle, is_og);

-- Function to check if OG points were already applied
CREATE OR REPLACE FUNCTION has_og_points_been_applied(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = p_user_id 
    AND og_bonus_points = 10000
    AND og_points_applied_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;
```

### Phase 6: Testing & Validation

#### 6.1 Test Scenarios
1. **New User Flow**:
   - Sign in with Twitter
   - Check if OG → Apply 10k points once
   - Complete session → Points saved online
   - Refresh → Points persist

2. **Existing User Recovery**:
   - Use recovery dialog
   - OG status verified
   - Local sessions imported
   - Points recalculated

3. **Reset Flow**:
   - Complete session
   - Use reset dialog
   - Start new session
   - Previous points intact

#### 6.2 Validation Queries
```sql
-- Check point consistency
SELECT 
  u.twitter_handle,
  up.points,
  up.calculated_total_points,
  up.og_bonus_points,
  up.og_points_applied_at
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE up.points != up.calculated_total_points;

-- Verify OG users have bonus
SELECT 
  u.twitter_handle,
  u.is_og,
  up.og_bonus_points
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_og = true AND up.og_bonus_points != 10000;
```

## Implementation Timeline

### Day 1: Critical Fixes (2-3 hours)
1. Fix profile page import (5 minutes)
2. Deploy and test V2 dashboard
3. Verify points display correctly

### Day 2: Recovery System (4-5 hours)
1. Create OG recovery dialog component
2. Integrate with profile dashboard
3. Test recovery flows

### Day 3: Storage Cleanup (3-4 hours)
1. Audit all localStorage usage
2. Remove session writes to localStorage
3. Ensure Supabase-only storage

### Day 4: Reset & Polish (2-3 hours)
1. Implement reset dialog
2. Test all user flows
3. Deploy to production

## Success Metrics

1. **Points Persistence**: 100% of users see correct points after refresh
2. **OG Status**: All OG users have 10k bonus points (applied only once)
3. **Session Storage**: All new sessions stored in Supabase only
4. **User Satisfaction**: No more reports of disappearing points

## Rollback Plan

If issues arise:
1. Revert profile page to V1 temporarily
2. Keep recovery dialog as optional tool
3. Monitor error logs and user reports
4. Fix issues before re-attempting

This plan provides a systematic approach to achieving all four of your requirements while minimizing risk and ensuring data integrity.

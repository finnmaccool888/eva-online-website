import { supabase } from './client';
import { isOG } from '@/lib/mirror/og-verification';
import { getUserSessions } from './session-services';

interface PointRecoveryLog {
  userId: string;
  twitterHandle: string;
  oldPoints: number;
  newPoints: number;
  ogStatus: {
    wasOG: boolean;
    isNowOG: boolean;
    ogPointsAdded: boolean;
  };
  sessionPoints: {
    oldTotal: number;
    recalculatedTotal: number;
    differences: QuestionPointDiff[];
  };
  timestamp: string;
}

interface QuestionPointDiff {
  sessionId: string;
  questionId: string;
  oldScore: number;
  newScore: number;
  difference: number;
  components: {
    baseScore: number;
    lengthBonus: number;
    detailBonus: number;
    personalBonus: number;
    engagementBonus: number;
  };
}

interface BatchRecoveryOptions {
  batchSize?: number;          // How many users to process at once (default: 50)
  maxPointChange?: number;     // Maximum allowed point change per user (default: 50000)
  dryRun?: boolean;           // Whether to actually apply changes (default: true)
  startAfterHandle?: string;  // Resume from after this handle
  onlyAffectedUsers?: boolean; // Only process users with point discrepancies (default: true)
  delayBetweenBatches?: number; // Milliseconds to wait between batches (default: 1000)
  maxBatchPointChange?: number; // Maximum total point change allowed per batch (default: 200000)
  alertThreshold?: number;     // Point change threshold for alerts (default: 30000)
  maxErrorRate?: number;       // Maximum allowed error rate before stopping (default: 0.1)
  backupPoints?: boolean;      // Whether to backup points before changes (default: true)
}

interface BatchRecoveryResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  totalPointsRecovered: number;
  errors: Array<{
    twitterHandle: string;
    error: string;
  }>;
  recoveryLogs: PointRecoveryLog[];
}

// Recovery logs table to track all point recoveries
const RECOVERY_LOG_TABLE = 'point_recovery_logs';

/**
 * Recover points for a single user with detailed logging
 */
export async function recoverUserPoints(twitterHandle: string, dryRun = false): Promise<PointRecoveryLog | null> {
  try {
    console.log(`[PointRecovery] Starting recovery for user: ${twitterHandle}`);
    
    // 1. Get user and current profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (userError || !user) {
      console.error(`[PointRecovery] User not found: ${twitterHandle}`);
      return null;
    }

    const profile = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;
    if (!profile) {
      console.error(`[PointRecovery] No profile found for user: ${twitterHandle}`);
      return null;
    }

    // 2. Verify OG status
    const wasOG = user.is_og;
    const isNowOG = isOG(twitterHandle);
    const ogPointsNeeded = isNowOG && !profile.is_og_rewarded;
    
    // 3. Get all user sessions
    const sessions = await getUserSessions(user.id, 1000); // Get up to 1000 sessions
    
    // 4. Recalculate points from individual questions
    let totalSessionPoints = 0;
    let questionDiffs: QuestionPointDiff[] = [];
    
    for (const session of sessions) {
      // Each session already has pointsEarned calculated correctly at session creation
      // This is more reliable than recalculating from individual components
      // because the scoring rules might have changed over time
      totalSessionPoints += session.pointsEarned;
      
      // Still check individual questions for debugging purposes
      if (session.questions && Array.isArray(session.questions)) {
        for (const question of session.questions) {
          const components = {
            baseScore: question.baseScore || 0,
            lengthBonus: question.lengthBonus || 0,
            detailBonus: question.detailBonus || 0,
            personalBonus: question.personalBonus || 0,
            engagementBonus: question.engagementBonus || 0
          };
          
          const recalculatedScore = 
            components.baseScore +
            components.lengthBonus +
            components.detailBonus +
            components.personalBonus +
            components.engagementBonus;
        
          if (recalculatedScore !== question.totalQuestionScore) {
            questionDiffs.push({
              sessionId: session.sessionId!,
              questionId: question.questionId,
              oldScore: question.totalQuestionScore,
              newScore: recalculatedScore,
              difference: recalculatedScore - question.totalQuestionScore,
              components
            });
          }
        }
      }
    }

    // 5. Calculate new total points
    const basePoints = 1000; // Everyone gets base points
    const ogBonus = isNowOG ? 10000 : 0;
    const newTotalPoints = basePoints + ogBonus + totalSessionPoints;

    // 6. Prepare recovery log
    const recoveryLog: PointRecoveryLog = {
      userId: user.id,
      twitterHandle,
      oldPoints: profile.points,
      newPoints: newTotalPoints,
      ogStatus: {
        wasOG,
        isNowOG,
        ogPointsAdded: ogPointsNeeded
      },
      sessionPoints: {
        oldTotal: profile.points - (wasOG ? 11000 : 1000), // Subtract base points to get session points
        recalculatedTotal: totalSessionPoints,
        differences: questionDiffs
      },
      timestamp: new Date().toISOString()
    };

    // 7. Apply updates if not dry run
    if (!dryRun && (newTotalPoints !== profile.points || isNowOG !== wasOG)) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          points: newTotalPoints,
          is_og_rewarded: isNowOG
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`[PointRecovery] Error updating profile:`, updateError);
        return null;
      }

      // Update user OG status if needed
      if (isNowOG !== wasOG) {
        await supabase
          .from('users')
          .update({ is_og: isNowOG })
          .eq('id', user.id);
      }

      // Log the recovery
      await supabase
        .from(RECOVERY_LOG_TABLE)
        .insert(recoveryLog);
    }

    console.log(`[PointRecovery] ${dryRun ? '(DRY RUN) ' : ''}Completed for ${twitterHandle}:`, {
      oldPoints: profile.points,
      newPoints: newTotalPoints,
      difference: newTotalPoints - profile.points,
      questionDiffs: questionDiffs.length
    });

    return recoveryLog;
  } catch (error) {
    console.error(`[PointRecovery] Error recovering points for ${twitterHandle}:`, error);
    return null;
  }
}

/**
 * Batch recover points for all users with safety measures
 */
export async function batchRecoverPoints(options: BatchRecoveryOptions = {}): Promise<BatchRecoveryResult> {
  const {
    batchSize = 50,
    maxPointChange = 50000,
    dryRun = true,
    startAfterHandle = '',
    onlyAffectedUsers = true,
    delayBetweenBatches = 1000,
    maxBatchPointChange = 200000,
    alertThreshold = 30000,
    maxErrorRate = 0.1,
    backupPoints = true
  } = options;

  let batchPointChangeTotal = 0;
  let errorCount = 0;

  console.log(`[BatchRecovery] Starting with options:`, {
    batchSize,
    maxPointChange,
    dryRun,
    startAfterHandle,
    onlyAffectedUsers
  });

  const result: BatchRecoveryResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    totalPointsRecovered: 0,
    errors: [],
    recoveryLogs: []
  };

  try {
    let hasMore = true;
    let lastHandle = startAfterHandle;

    while (hasMore) {
      // Get batch of users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('twitter_handle')
        .gt('twitter_handle', lastHandle)
        .order('twitter_handle')
        .limit(batchSize);

      if (userError) {
        console.error(`[BatchRecovery] Error fetching users:`, userError);
        break;
      }

      if (!users || users.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`[BatchRecovery] Processing batch of ${users.length} users`);

      // Process each user in the batch
      for (const user of users) {
        try {
          // First do a dry run to check if recovery is needed
          const dryRunLog = await recoverUserPoints(user.twitter_handle, true);
          
          if (!dryRunLog) {
            result.failed++;
            result.errors.push({
              twitterHandle: user.twitter_handle,
              error: 'Dry run failed to generate recovery log'
            });
            continue;
          }

          const pointDifference = Math.abs(dryRunLog.newPoints - dryRunLog.oldPoints);

          // Skip if no changes needed
          if (pointDifference === 0) {
            result.skipped++;
            continue;
          }

          // Check individual point change limit
          if (pointDifference > maxPointChange) {
            console.warn(`[BatchRecovery] Skipping ${user.twitter_handle} - point change too large: ${pointDifference}`);
            result.skipped++;
            result.errors.push({
              twitterHandle: user.twitter_handle,
              error: `Point change exceeds maximum (${pointDifference} > ${maxPointChange})`
            });
            continue;
          }

          // Check batch total point change limit
          if (batchPointChangeTotal + pointDifference > maxBatchPointChange) {
            console.warn(`[BatchRecovery] Batch point change limit reached (${batchPointChangeTotal + pointDifference} > ${maxBatchPointChange})`);
            hasMore = false;
            break;
          }

          // Alert on large changes
          if (pointDifference > alertThreshold) {
            console.warn(`[BatchRecovery] Large point change detected for ${user.twitter_handle}: ${pointDifference}`);
          }

          // Check error rate
          const currentErrorRate = errorCount / (result.processed + 1);
          if (currentErrorRate > maxErrorRate) {
            console.error(`[BatchRecovery] Error rate too high (${(currentErrorRate * 100).toFixed(1)}%), stopping`);
            hasMore = false;
            break;
          }

          // Backup points if needed
          if (!dryRun && backupPoints) {
            try {
              await supabase
                .from('point_recovery_backups')
                .insert({
                  user_id: dryRunLog.userId,
                  twitter_handle: user.twitter_handle,
                  points_snapshot: {
                    points: dryRunLog.oldPoints,
                    og_status: dryRunLog.ogStatus,
                    session_points: dryRunLog.sessionPoints
                  }
                });
            } catch (error) {
              console.error(`[BatchRecovery] Failed to backup points for ${user.twitter_handle}:`, error);
              result.errors.push({
                twitterHandle: user.twitter_handle,
                error: 'Failed to create backup'
              });
              continue;
            }
          }

          // If not dry run and changes are needed, apply them
          if (!dryRun) {
            const recoveryLog = await recoverUserPoints(user.twitter_handle, false);
            if (recoveryLog) {
              result.succeeded++;
              result.totalPointsRecovered += pointDifference;
              result.recoveryLogs.push(recoveryLog);
            } else {
              result.failed++;
              result.errors.push({
                twitterHandle: user.twitter_handle,
                error: 'Recovery failed'
              });
            }
          } else {
            // In dry run, count as succeeded if we would make changes
            result.succeeded++;
            result.recoveryLogs.push(dryRunLog);
          }
        } catch (error) {
          console.error(`[BatchRecovery] Error processing user ${user.twitter_handle}:`, error);
          result.failed++;
          result.errors.push({
            twitterHandle: user.twitter_handle,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        result.processed++;
      }

      // Update last handle for next batch
      lastHandle = users[users.length - 1].twitter_handle;

      // Add delay between batches
      if (hasMore && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }

      // Log progress
      console.log(`[BatchRecovery] Progress:`, {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
        totalPointsRecovered: result.totalPointsRecovered,
        lastHandle
      });
    }

    console.log(`[BatchRecovery] Complete!`, {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      skipped: result.skipped,
      totalPointsRecovered: result.totalPointsRecovered,
      errorCount: result.errors.length
    });

    return result;
  } catch (error) {
    console.error(`[BatchRecovery] Fatal error:`, error);
    throw error;
  }
}

// Fix points for users who should have OG bonus but don't
export async function fixOGPoints() {
  try {
    // Get all OG users
    const { data: ogUsers, error } = await supabase
      .from('users')
      .select(`
        id,
        twitter_handle,
        is_og,
        user_profiles (
          points,
          is_og_rewarded,
          session_history
        )
      `)
      .eq('is_og', true);

    if (error) {
      console.error('Error fetching OG users:', error);
      return;
    }

    // Fix points for each OG user
    for (const user of ogUsers || []) {
      const profile = Array.isArray(user.user_profiles) 
        ? user.user_profiles[0] 
        : user.user_profiles;

      if (!profile) {
        console.log(`No profile found for OG user ${user.twitter_handle}`);
        continue;
      }

      // Calculate expected points
      let expectedBasePoints = 10000; // OG bonus
      let sessionPoints = 0;

      if (profile.session_history && Array.isArray(profile.session_history)) {
        sessionPoints = profile.session_history.reduce((sum: number, session: any) => {
          return sum + (session.pointsEarned || 0);
        }, 0);
      }

      const expectedTotalPoints = expectedBasePoints + sessionPoints;

      // Check if points need fixing
      if (profile.points < expectedTotalPoints) {
        console.log(`Fixing points for ${user.twitter_handle}: ${profile.points} -> ${expectedTotalPoints}`);
        
        await supabase
          .from('user_profiles')
          .update({
            points: expectedTotalPoints,
            is_og_rewarded: true
          })
          .eq('user_id', user.id);
      }
    }

    console.log('OG points fix completed');
  } catch (error) {
    console.error('Error fixing OG points:', error);
  }
}
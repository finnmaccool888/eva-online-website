import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface RestoreResponse {
  success: boolean;
  restored?: {
    twitterHandle: string;
    oldPoints: number;
    restoredPoints: number;
    backupDate: string;
  };
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<RestoreResponse>> {
  try {
    const { twitterHandle, backupId } = await request.json();

    if (!twitterHandle && !backupId) {
      return NextResponse.json({
        success: false,
        error: 'Either twitterHandle or backupId is required'
      }, { status: 400 });
    }

    // Get the most recent backup if backupId not provided
    const { data: backup, error: backupError } = await supabase
      .from('point_recovery_backups')
      .select('*')
      .eq(backupId ? 'id' : 'twitter_handle', backupId || twitterHandle)
      .eq('is_restored', false)
      .order('backup_date', { ascending: false })
      .limit(1)
      .single();

    if (backupError || !backup) {
      return NextResponse.json({
        success: false,
        error: 'No valid backup found'
      }, { status: 404 });
    }

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('twitter_handle', backup.twitter_handle)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const profile = Array.isArray(user.user_profiles) ? user.user_profiles[0] : user.user_profiles;
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    // Start a transaction-like sequence
    const currentPoints = profile.points;
    const backupPoints = backup.points_snapshot.points;

    // 1. Update user profile with backup points
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        points: backupPoints,
        is_og_rewarded: backup.points_snapshot.og_status.isNowOG
      })
      .eq('user_id', backup.user_id);

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to restore points'
      }, { status: 500 });
    }

    // 2. Mark backup as restored
    await supabase
      .from('point_recovery_backups')
      .update({
        is_restored: true,
        restored_date: new Date().toISOString()
      })
      .eq('id', backup.id);

    // 3. Log the restore operation
    await supabase
      .from('point_recovery_logs')
      .insert({
        user_id: backup.user_id,
        twitter_handle: backup.twitter_handle,
        old_points: currentPoints,
        new_points: backupPoints,
        og_status: backup.points_snapshot.og_status,
        session_points: backup.points_snapshot.session_points,
        timestamp: new Date().toISOString(),
        operation: 'restore',
        backup_id: backup.id
      });

    // 4. Send notification to user
    await supabase
      .from('notifications')
      .insert({
        user_id: backup.user_id,
        type: 'points_restored',
        title: 'Points Restored',
        message: `Your points have been restored to ${backupPoints.toLocaleString()}. Please refresh your profile to see the update.`,
        data: {
          oldPoints: currentPoints,
          newPoints: backupPoints,
          difference: backupPoints - currentPoints
        },
        read: false,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      restored: {
        twitterHandle: backup.twitter_handle,
        oldPoints: currentPoints,
        restoredPoints: backupPoints,
        backupDate: backup.backup_date
      }
    });

  } catch (error) {
    console.error('[RestorePoints] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

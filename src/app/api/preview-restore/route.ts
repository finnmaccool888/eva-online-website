import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface PreviewResponse {
  success: boolean;
  preview?: {
    twitterHandle: string;
    currentPoints: number;
    backupPoints: number;
    pointDifference: number;
    backupDate: string;
    ogStatus: {
      current: {
        isOG: boolean;
        isRewarded: boolean;
      };
      backup: {
        wasOG: boolean;
        isNowOG: boolean;
      };
    };
    sessionPoints: {
      current: number;
      backup: {
        oldTotal: number;
        recalculatedTotal: number;
      };
    };
    warning?: string;
  };
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<PreviewResponse>> {
  try {
    const { twitterHandle, backupId } = await request.json();

    if (!twitterHandle && !backupId) {
      return NextResponse.json({
        success: false,
        error: 'Either twitterHandle or backupId is required'
      }, { status: 400 });
    }

    // Get the backup
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

    // Get current user state
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

    // Calculate differences
    const pointDifference = backup.points_snapshot.points - profile.points;
    
    // Generate warning if needed
    let warning: string | undefined;
    if (Math.abs(pointDifference) > 10000) {
      warning = `Large point change detected (${Math.abs(pointDifference)} points)`;
    }
    if (backup.points_snapshot.og_status.isNowOG !== user.is_og) {
      warning = (warning || '') + 
        `\nOG status will change from ${user.is_og ? 'OG' : 'non-OG'} to ${backup.points_snapshot.og_status.isNowOG ? 'OG' : 'non-OG'}`;
    }

    return NextResponse.json({
      success: true,
      preview: {
        twitterHandle: backup.twitter_handle,
        currentPoints: profile.points,
        backupPoints: backup.points_snapshot.points,
        pointDifference,
        backupDate: backup.backup_date,
        ogStatus: {
          current: {
            isOG: user.is_og,
            isRewarded: profile.is_og_rewarded
          },
          backup: backup.points_snapshot.og_status
        },
        sessionPoints: {
          current: profile.points - (user.is_og ? 11000 : 1000), // Subtract base points
          backup: backup.points_snapshot.session_points
        },
        warning: warning?.trim()
      }
    });

  } catch (error) {
    console.error('[PreviewRestore] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface BackupListResponse {
  success: boolean;
  backups?: Array<{
    id: string;
    twitterHandle: string;
    backupDate: string;
    pointsSnapshot: {
      points: number;
      ogStatus: {
        wasOG: boolean;
        isNowOG: boolean;
      };
      sessionPoints: {
        oldTotal: number;
        recalculatedTotal: number;
      };
    };
    isRestored: boolean;
    restoredDate?: string;
  }>;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<BackupListResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const twitterHandle = searchParams.get('twitter_handle');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeRestored = searchParams.get('include_restored') === 'true';

    if (!twitterHandle) {
      return NextResponse.json({
        success: false,
        error: 'Twitter handle is required'
      }, { status: 400 });
    }

    // Get backups for the user
    const query = supabase
      .from('point_recovery_backups')
      .select('*')
      .eq('twitter_handle', twitterHandle)
      .order('backup_date', { ascending: false })
      .limit(limit);

    if (!includeRestored) {
      query.eq('is_restored', false);
    }

    const { data: backups, error: backupError } = await query;

    if (backupError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch backups'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      backups: backups.map(backup => ({
        id: backup.id,
        twitterHandle: backup.twitter_handle,
        backupDate: backup.backup_date,
        pointsSnapshot: backup.points_snapshot,
        isRestored: backup.is_restored,
        restoredDate: backup.restored_date
      }))
    });

  } catch (error) {
    console.error('[ListBackups] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

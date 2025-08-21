import { NextResponse } from 'next/server';
import { recoverUserPoints } from '@/lib/supabase/fix-points';

export async function POST(request: Request) {
  try {
    const { twitterHandle, dryRun = true } = await request.json();

    if (!twitterHandle) {
      return NextResponse.json(
        { error: 'Twitter handle is required' },
        { status: 400 }
      );
    }

    const recoveryLog = await recoverUserPoints(twitterHandle, dryRun);

    if (!recoveryLog) {
      return NextResponse.json(
        { error: 'Recovery failed or user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recoveryLog
    });

  } catch (error) {
    console.error('[RecoverPoints] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

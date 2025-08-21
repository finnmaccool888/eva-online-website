import { NextResponse } from 'next/server';
import { batchRecoverPoints } from '@/lib/supabase/fix-points';

export async function POST(request: Request) {
  try {
    const options = await request.json();

    // Always start with a dry run unless explicitly set to false
    const dryRun = options.dryRun !== false;

    const result = await batchRecoverPoints({
      batchSize: options.batchSize,
      maxPointChange: options.maxPointChange,
      dryRun,
      startAfterHandle: options.startAfterHandle,
      onlyAffectedUsers: options.onlyAffectedUsers !== false,
      delayBetweenBatches: options.delayBetweenBatches
    });

    return NextResponse.json({
      success: true,
      dryRun,
      data: result
    });

  } catch (error) {
    console.error('[BatchRecoverPoints] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

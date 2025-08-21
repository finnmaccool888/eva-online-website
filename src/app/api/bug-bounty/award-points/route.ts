import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getTwitterAuth } from '@/lib/mirror/auth';

// Admin Twitter handles who can award points
const ADMIN_HANDLES = ['evaonlinexyz', 'admin1', 'admin2']; // Update with actual admin handles

export async function POST(request: NextRequest) {
  try {
    const { bugReportId, points, customPoints } = await request.json();
    
    // Get Twitter auth
    const twitterAuth = getTwitterAuth();
    
    // Check if user is authenticated
    if (!twitterAuth?.twitterHandle) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (!ADMIN_HANDLES.includes(twitterAuth.twitterHandle)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can award points.' },
        { status: 403 }
      );
    }
    
    // Get admin user ID
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('twitter_handle', twitterAuth.twitterHandle)
      .single();
      
    if (!adminUser || adminError) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }
    
    // Validate inputs
    if (!bugReportId) {
      return NextResponse.json(
        { error: 'Bug report ID is required' },
        { status: 400 }
      );
    }
    
    // Use custom points if provided, otherwise use default based on severity
    const pointsToAward = customPoints || points;
    
    if (!pointsToAward || pointsToAward < 0) {
      return NextResponse.json(
        { error: 'Valid points amount is required' },
        { status: 400 }
      );
    }
    
    // Call the PostgreSQL function to award points
    const { data, error } = await supabase.rpc('award_bug_bounty_points', {
      p_bug_report_id: bugReportId,
      p_points: pointsToAward,
      p_awarded_by: adminUser.id
    });
    
    if (error) {
      console.error('Error awarding points:', error);
      
      // Check for specific error messages
      if (error.message.includes('already been awarded')) {
        return NextResponse.json(
          { error: 'Points have already been awarded for this bug report' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to award points' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully awarded ${pointsToAward} points`,
      pointsAwarded: pointsToAward
    });
    
  } catch (error) {
    console.error('Error in award points endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if current user can award points
export async function GET() {
  try {
    const twitterAuth = getTwitterAuth();
    
    if (!twitterAuth?.twitterHandle) {
      return NextResponse.json({ canAwardPoints: false });
    }
    
    const canAwardPoints = ADMIN_HANDLES.includes(twitterAuth.twitterHandle);
    
    return NextResponse.json({ 
      canAwardPoints,
      handle: twitterAuth.twitterHandle 
    });
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ canAwardPoints: false });
  }
}

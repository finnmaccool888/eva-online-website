import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { calculateTotalPoints } from '@/lib/mirror/profile';

export async function GET(request: NextRequest) {
  try {
    // Get current user profile from headers if provided
    const profileHeader = request.headers.get('x-user-profile');
    let currentUserProfile = null;
    
    if (profileHeader) {
      try {
        currentUserProfile = JSON.parse(decodeURIComponent(profileHeader));
      } catch (e) {
        console.error('Failed to parse user profile from header:', e);
      }
    }

    // Fetch all users with their profiles from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        twitter_handle,
        twitter_name,
        is_og,
        user_profiles (
          points,
          human_score,
          total_questions_answered,
          session_history,
          is_og_rewarded
        )
      `)
      .order('user_profiles(points)', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Return empty leaderboard on error
      return NextResponse.json({ leaderboard: [] });
    }

    // Transform data into leaderboard format
    const leaderboard = users?.map((user, index) => {
      // Handle both single profile and array of profiles
      const profile = Array.isArray(user.user_profiles) 
        ? user.user_profiles[0] 
        : user.user_profiles;
      
      // Calculate total points including session history
      let totalPoints = profile?.points || 0;
      if (profile?.session_history && Array.isArray(profile.session_history)) {
        totalPoints += profile.session_history.reduce((sum: number, session: any) => {
          return sum + (session.pointsEarned || 0);
        }, 0);
      }

      return {
        rank: index + 1,
        twitterHandle: user.twitter_handle,
        twitterName: user.twitter_name || user.twitter_handle,
        profileImage: `https://unavatar.io/twitter/${user.twitter_handle}`,
        points: totalPoints,
        humanScore: profile?.human_score || 0,
        isOG: user.is_og || false
      };
    }) || [];

    // Sort by points (in case the order from DB is not perfect)
    leaderboard.sort((a, b) => b.points - a.points);

    // Update ranks after sorting
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}

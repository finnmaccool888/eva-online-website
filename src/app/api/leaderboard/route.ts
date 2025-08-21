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

    // Fetch all users with their profiles and session points from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        twitter_handle,
        twitter_name,
        is_og,
        user_profiles!inner (
          points,
          human_score,
          total_questions_answered,
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

    // Get all user IDs to fetch their session points
    const userIds = users?.map(user => user.id) || [];
    
    // Fetch session points for all users in one query
    const { data: sessionPoints } = await supabase
      .from('sessions')
      .select('user_id, points_earned')
      .in('user_id', userIds)
      .eq('is_complete', true);
    
    // Create a map of user_id to total session points
    const sessionPointsMap: Record<string, number> = {};
    sessionPoints?.forEach(session => {
      if (!sessionPointsMap[session.user_id]) {
        sessionPointsMap[session.user_id] = 0;
      }
      sessionPointsMap[session.user_id] += session.points_earned || 0;
    });

    // Transform data into leaderboard format
    const leaderboard = users?.map((user, index) => {
      // Handle both single profile and array of profiles
      const profile = Array.isArray(user.user_profiles) 
        ? (user.user_profiles.length > 0 ? user.user_profiles[0] : null)
        : user.user_profiles;
      
      // Calculate total points: base points + session points
      const basePoints = profile?.points || 0;
      const sessionTotal = sessionPointsMap[user.id] || 0;
      const totalPoints = basePoints + sessionTotal;

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

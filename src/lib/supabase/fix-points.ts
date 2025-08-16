import { supabase } from './client';

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

// Function to sync a specific user's points from localStorage to Supabase
export async function syncUserPoints(twitterHandle: string) {
  try {
    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_og')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (userError || !user) {
      console.error('User not found:', twitterHandle);
      return;
    }

    // Get profile from localStorage
    const localStorageData = localStorage.getItem('eva_mirror_v1:userProfile');
    if (!localStorageData) {
      console.error('No localStorage profile found');
      return;
    }

    const localProfile = JSON.parse(localStorageData);
    
    // Calculate total points from localStorage
    let totalPoints = localProfile.points || 0;
    if (localProfile.sessionHistory && Array.isArray(localProfile.sessionHistory)) {
      // Points field already includes session points in localStorage
      // So we use it as is
    }

    // Update Supabase with correct points
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        points: totalPoints,
        human_score: localProfile.humanScore || 0,
        total_questions_answered: localProfile.totalQuestionsAnswered || 0,
        session_history: localProfile.sessionHistory || [],
        is_og_rewarded: user.is_og || localProfile.ogPointsAwarded || false
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    } else {
      console.log(`Successfully synced points for ${twitterHandle}: ${totalPoints} points`);
    }
  } catch (error) {
    console.error('Error syncing points:', error);
  }
}

import { supabase } from './client';
import { isOG } from '@/lib/mirror/og-verification';
import { POINTS, calculateBasePoints, calculateMinimumPoints } from '@/lib/constants/points';

/**
 * Enforces OG points for a user. This is the single source of truth for OG point enforcement.
 * Should be called whenever:
 * 1. A user logs in
 * 2. A profile is loaded
 * 3. Points are synced
 * 4. Any operation that might affect points
 */
export async function enforceOGPoints(twitterHandle: string): Promise<{
  success: boolean;
  isOG: boolean;
  pointsFixed: boolean;
  message: string;
}> {
  try {
    // Check if user is OG according to our source of truth
    const userIsOG = isOG(twitterHandle);
    
    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (userError || !user) {
      return {
        success: false,
        isOG: userIsOG,
        pointsFixed: false,
        message: 'User not found in database'
      };
    }

    const profile = Array.isArray(user.user_profiles) 
      ? (user.user_profiles.length > 0 ? user.user_profiles[0] : null)
      : user.user_profiles;

    let pointsFixed = false;
    let updates: any = {};

    // First, ensure user table has correct OG status
    if (userIsOG && !user.is_og) {
      await supabase
        .from('users')
        .update({ is_og: true })
        .eq('id', user.id);
      pointsFixed = true;
    }

    // If user is OG, ensure they have at least the OG bonus points
    if (userIsOG) {
      if (!profile) {
        // Create profile with OG points
        await supabase.from('user_profiles').insert({
          user_id: user.id,
          points: calculateBasePoints(true), // true for OG user
          is_og_rewarded: true,
        });
        pointsFixed = true;
      } else {
        // Calculate session points
        let sessionPoints = 0;
        if (profile.session_history && Array.isArray(profile.session_history)) {
          sessionPoints = profile.session_history.reduce((sum: number, session: any) => {
            return sum + (session.pointsEarned || 0);
          }, 0);
        }

        // Check if user has the minimum expected points (base + OG bonus + sessions)
        const minimumExpectedPoints = calculateBasePoints(true) + sessionPoints;
        
        if (profile.points < minimumExpectedPoints || !profile.is_og_rewarded) {
          updates.points = minimumExpectedPoints;
          updates.is_og_rewarded = true;
          pointsFixed = true;
        }
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('user_profiles')
          .update(updates)
          .eq('user_id', user.id);
      }
    }

    return {
      success: true,
      isOG: userIsOG,
      pointsFixed,
      message: pointsFixed 
        ? `OG points enforced for ${twitterHandle}` 
        : `OG status verified for ${twitterHandle}`
    };

  } catch (error) {
    console.error('[OG Enforcement] Error:', error);
    return {
      success: false,
      isOG: false,
      pointsFixed: false,
      message: `Error enforcing OG points: ${error}`
    };
  }
}

/**
 * Batch enforce OG points for all users in the database
 */
export async function enforceOGPointsForAllUsers(): Promise<{
  success: boolean;
  usersFixed: number;
  message: string;
}> {
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('twitter_handle');

    if (error || !users) {
      throw new Error('Failed to fetch users');
    }

    let usersFixed = 0;
    
    // Process each user
    for (const user of users) {
      const result = await enforceOGPoints(user.twitter_handle);
      if (result.pointsFixed) {
        usersFixed++;
      }
    }

    return {
      success: true,
      usersFixed,
      message: `Processed ${users.length} users, fixed ${usersFixed} OG point issues`
    };

  } catch (error) {
    console.error('[OG Enforcement] Batch error:', error);
    return {
      success: false,
      usersFixed: 0,
      message: `Error in batch enforcement: ${error}`
    };
  }
}

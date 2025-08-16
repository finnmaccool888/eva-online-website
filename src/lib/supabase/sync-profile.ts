import { supabase } from './client';
import { loadProfile, calculateTotalPoints } from '@/lib/mirror/profile';
import { getTwitterAuth } from '@/lib/mirror/auth';
import { enforceOGPoints } from './og-enforcement';

/**
 * Comprehensive profile sync that ensures Supabase matches localStorage exactly
 */
export async function syncCompleteProfile() {
  try {
    const auth = getTwitterAuth();
    if (!auth?.twitterHandle) {
      console.error('[SyncProfile] No auth found');
      return { success: false, error: 'No authentication' };
    }

    // First, enforce OG points if applicable
    const ogEnforcement = await enforceOGPoints(auth.twitterHandle);
    console.log('[SyncProfile] OG enforcement result:', ogEnforcement);

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_og')
      .eq('twitter_handle', auth.twitterHandle)
      .single();

    if (userError || !user) {
      console.error('[SyncProfile] User not found:', auth.twitterHandle);
      return { success: false, error: 'User not found' };
    }

    // Load profile from localStorage
    const localProfile = loadProfile();
    
    // Calculate the correct total points
    const calculatedTotalPoints = calculateTotalPoints(localProfile);
    
    // Get current Supabase profile
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('[SyncProfile] Sync details:', {
      localStorage: {
        basePoints: localProfile.points,
        sessionCount: localProfile.sessionHistory?.length || 0,
        calculatedTotal: calculatedTotalPoints,
        humanScore: localProfile.humanScore,
        questionsAnswered: localProfile.totalQuestionsAnswered
      },
      supabase: {
        currentPoints: currentProfile?.points || 0,
        humanScore: currentProfile?.human_score || 0,
        questionsAnswered: currentProfile?.total_questions_answered || 0
      }
    });

    // Update Supabase with complete profile data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        points: calculatedTotalPoints, // Use calculated total, not base points
        human_score: localProfile.humanScore || 0,
        total_questions_answered: localProfile.totalQuestionsAnswered || 0,
        session_history: localProfile.sessionHistory || [],
        personal_info: localProfile.personalInfo || {},
        social_profiles: localProfile.socialProfiles || [],
        is_og_rewarded: localProfile.ogPointsAwarded || user.is_og || false,
        trust_score: localProfile.trustScore || 0
      });

    if (updateError) {
      console.error('[SyncProfile] Error updating profile:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`[SyncProfile] Successfully synced profile for ${auth.twitterHandle}`);
    return { 
      success: true, 
      syncedData: {
        totalPoints: calculatedTotalPoints,
        sessionCount: localProfile.sessionHistory?.length || 0,
        humanScore: localProfile.humanScore || 0
      }
    };
  } catch (error) {
    console.error('[SyncProfile] Unexpected error:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Fix profile.points to only contain base points (remove session points)
 */
export async function fixLocalProfilePoints() {
  const localProfile = loadProfile();
  
  // Calculate what profile.points should be (base + OG only)
  let basePoints = 0;
  
  // Twitter verification
  if (localProfile.twitterVerified) basePoints += 1000;
  
  // Personal info completion
  const personalFields = [
    localProfile.personalInfo?.fullName, 
    localProfile.personalInfo?.location, 
    localProfile.personalInfo?.bio
  ];
  const filledFields = personalFields.filter(f => f && f.trim().length > 0).length;
  basePoints += filledFields * 333;
  
  // Social profiles
  basePoints += (localProfile.socialProfiles?.length || 0) * 1000;
  
  // Add OG bonus if applicable
  if (localProfile.isOG || localProfile.ogPointsAwarded) {
    basePoints += 10000;
  }
  
  console.log('[FixProfile] Current points:', localProfile.points, 'Should be:', basePoints);
  
  // Update profile with corrected base points
  localProfile.points = basePoints;
  
  // Save corrected profile
  const { writeJson } = await import('@/lib/mirror/storage');
  writeJson('eva_mirror_v1:user_profile', localProfile);
  
  return {
    oldPoints: localProfile.points,
    newPoints: basePoints,
    totalPoints: calculateTotalPoints(localProfile)
  };
}

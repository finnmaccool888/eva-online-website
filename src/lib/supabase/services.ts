import { supabase, handleSupabaseError } from './client';
import type { UserProfile, SoulSeed, AnalyzedMemory } from '@/lib/mirror/types';
import { enforceOGPoints } from './og-enforcement';
import { POINTS, calculateBasePoints } from '@/lib/constants/points';

// User operations
export async function createOrUpdateUser(twitterHandle: string, twitterName?: string, isOG: boolean = false) {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (existingUser) {
      // Always enforce OG points for existing users
      const enforcement = await enforceOGPoints(twitterHandle);
      
      // If points were fixed, reload the user to get updated points
      if (enforcement.pointsFixed) {
        const { data: updatedUser } = await supabase
          .from('users')
          .select('*, user_profiles(*)')
          .eq('twitter_handle', twitterHandle)
          .single();
          
        return {
          user: updatedUser,
          isNew: false,
          ogPointsAwarded: true
        };
      }
      
      return { 
        user: existingUser, 
        isNew: false, 
        ogPointsAwarded: enforcement.pointsFixed 
      };
    }

    // Create new user - check OG status from source of truth
    const { isOG: actuallyIsOG } = await enforceOGPoints(twitterHandle);
    
    // Ensure twitter name is properly encoded for database storage
    const cleanTwitterName = twitterName ? 
      twitterName.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim() || twitterHandle : 
      twitterHandle;
    
    console.log('[CreateUser] Creating user:', { 
      twitterHandle, 
      originalName: twitterName, 
      cleanName: cleanTwitterName,
      isOG: actuallyIsOG 
    });
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        twitter_handle: twitterHandle,
        twitter_name: cleanTwitterName,
        is_og: actuallyIsOG, // Use verified OG status
      })
      .select()
      .single();

    if (error) {
      console.error('[CreateUser] Database error:', {
        error,
        twitterHandle,
        cleanTwitterName,
        errorMessage: error.message,
        errorCode: error.code
      });
      throw error;
    }

    // Create profile with correct points
    await supabase.from('user_profiles').insert({
      user_id: newUser.id,
      points: calculateBasePoints(actuallyIsOG), // Properly calculate base + OG points
      is_og_rewarded: actuallyIsOG,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return { user: newUser, isNew: true, ogPointsAwarded: actuallyIsOG };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

// Soul Seed operations
export async function saveSoulSeedToSupabase(userId: string, soulSeed: SoulSeed) {
  try {
    const { data: existing } = await supabase
      .from('soul_seeds')
      .select('id')
      .eq('user_id', userId)
      .single();

    const soulSeedData = {
      user_id: userId,
      alias: soulSeed.alias,
      vibe: soulSeed.vibe,
      level: soulSeed.level,
      streak_count: soulSeed.streakCount,
      last_fed_at: soulSeed.lastFedAt ? new Date(soulSeed.lastFedAt).toISOString() : null,
      offensive_count: soulSeed.offensiveCount || 0,
      trust_penalty: soulSeed.trustPenalty || 0,
    };

    let soulSeedId: string;

    if (existing) {
      const { error } = await supabase
        .from('soul_seeds')
        .update(soulSeedData)
        .eq('id', existing.id);
      
      if (error) throw error;
      soulSeedId = existing.id;
    } else {
      const { data, error } = await supabase
        .from('soul_seeds')
        .insert(soulSeedData)
        .select()
        .single();
      
      if (error) throw error;
      soulSeedId = data.id;
    }

    // Save earned traits
    if (soulSeed.earnedTraits) {
      for (const trait of soulSeed.earnedTraits) {
        await supabase.from('earned_traits').upsert({
          soul_seed_id: soulSeedId,
          trait_id: trait.traitId,
          earned_at: new Date(trait.earnedAt).toISOString(),
          trigger_answer: trait.triggerAnswer,
          question_id: trait.questionId,
          strength: trait.strength,
        });
      }
    }

    // Save artifacts
    if (soulSeed.artifacts) {
      for (const artifact of soulSeed.artifacts) {
        await supabase.from('artifacts').insert({
          soul_seed_id: soulSeedId,
          artifact_id: artifact.id,
          rarity: artifact.rarity,
        });
      }
    }

    return soulSeedId;
  } catch (error) {
    console.error('Error saving soul seed:', error);
    throw error;
  }
}

// Memory operations
export async function saveMemory(
  soulSeedId: string,
  questionId: string,
  questionText: string,
  questionCategory: string,
  userResponse: string,
  analysis?: AnalyzedMemory
) {
  try {
    const { error } = await supabase.from('memories').insert({
      soul_seed_id: soulSeedId,
      question_id: questionId,
      question_text: questionText,
      question_category: questionCategory,
      user_response: userResponse,
      analysis: analysis || null,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving memory:', error);
    throw error;
  }
}

// Profile operations
export async function updateUserProfile(userId: string, profile: UserProfile) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        personal_info: profile.personalInfo,
        social_profiles: profile.socialProfiles,
        points: profile.points,
        trust_score: profile.trustScore,
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Analytics operations
export async function trackEvent(userId: string | null, eventName: string, properties?: any) {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: eventName,
      properties: properties || {},
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error tracking event:', error);
    // Don't throw - analytics shouldn't break the app
  }
}

// Load user data
export async function loadUserData(twitterHandle: string) {
  try {
    // First enforce OG points to ensure they're correct
    const enforcement = await enforceOGPoints(twitterHandle);
    console.log(`[LoadUserData] OG enforcement for ${twitterHandle}:`, enforcement);

    // Get user with complete profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (userError || !user) {
      console.error(`[LoadUserData] User not found: ${twitterHandle}`);
      return null;
    }

    // Get profile - should already be included in user.user_profiles
    const profile = Array.isArray(user.user_profiles) 
      ? user.user_profiles[0] 
      : user.user_profiles;

    // Get soul seed
    const { data: soulSeed } = await supabase
      .from('soul_seeds')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let fullSoulSeed = null;
    if (soulSeed) {
      // Get earned traits
      const { data: traits } = await supabase
        .from('earned_traits')
        .select('*')
        .eq('soul_seed_id', soulSeed.id);

      // Get memories
      const { data: memories } = await supabase
        .from('memories')
        .select('*')
        .eq('soul_seed_id', soulSeed.id)
        .order('created_at', { ascending: false });

      fullSoulSeed = {
        ...soulSeed,
        earnedTraits: traits || [],
        memories: memories || [],
      };
    }

    return {
      user,
      profile,
      soulSeed: fullSoulSeed,
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
} 

// Deprecated: Use createSession from session-services.ts instead
// This function only saves minimal data and loses important session details

// Update user human score
export async function updateUserHumanScore(
  userId: string,
  newScore: number,
  questionsAnswered: number
) {
  try {
    // Get current profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('human_score, total_questions_answered, points')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    // Calculate new average
    const currentTotal = (profile.human_score || 0) * (profile.total_questions_answered || 0);
    const newTotal = currentTotal + (newScore * questionsAnswered);
    const totalQuestions = (profile.total_questions_answered || 0) + questionsAnswered;
    const avgScore = Math.round(newTotal / totalQuestions);

    // Update profile
    await supabase
      .from('user_profiles')
      .update({
        human_score: avgScore,
        total_questions_answered: totalQuestions
      })
      .eq('user_id', userId);

  } catch (error) {
    console.error('Error updating human score:', error);
  }
}

// Update user points after session completion
export async function updateUserPoints(
  userId: string,
  pointsToAdd: number
) {
  try {
    // Get current profile and user
    const { data: user } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('[UpdatePoints] User not found:', userId);
      return;
    }

    const profile = Array.isArray(user.user_profiles) 
      ? user.user_profiles[0] 
      : user.user_profiles;

    if (!profile) {
      console.error('[UpdatePoints] Profile not found for user:', userId);
      return;
    }

    // Calculate new points ensuring we maintain base + OG bonus
    const basePoints = calculateBasePoints(user.is_og);
    const currentSessionPoints = (profile.points || 0) - basePoints;
    const newSessionPoints = Math.max(0, currentSessionPoints + pointsToAdd);
    const newTotalPoints = basePoints + newSessionPoints;

    console.log('[UpdatePoints] Calculation:', {
      userId,
      isOG: user.is_og,
      basePoints,
      currentSessionPoints,
      pointsToAdd,
      newSessionPoints,
      newTotalPoints
    });

    // Update points
    await supabase
      .from('user_profiles')
      .update({
        points: newTotalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

  } catch (error) {
    console.error('Error updating points:', error);
  }
} 
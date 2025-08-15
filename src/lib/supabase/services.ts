import { supabase, handleSupabaseError } from './client';
import type { UserProfile, SoulSeed, AnalyzedMemory } from '@/lib/mirror/types';

// User operations
export async function createOrUpdateUser(twitterHandle: string, twitterName?: string, isOG: boolean = false) {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*, user_profiles(*)')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (existingUser) {
      // Update is_og status if not already set
      if (isOG && !existingUser.is_og) {
        await supabase
          .from('users')
          .update({ is_og: true })
          .eq('id', existingUser.id);
          
        // Award OG points if profile exists
        if (existingUser.user_profiles) {
          const currentPoints = existingUser.user_profiles.points || 0;
          await supabase
            .from('user_profiles')
            .update({ 
              points: currentPoints + 10000,
              is_og_rewarded: true 
            })
            .eq('user_id', existingUser.id);
        }
      }
      return { user: existingUser, isNew: false, ogPointsAwarded: isOG && !existingUser.is_og };
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        twitter_handle: twitterHandle,
        twitter_name: twitterName,
        is_og: isOG,
      })
      .select()
      .single();

    if (error) throw error;

    // Create profile with OG points if applicable
    await supabase.from('user_profiles').insert({
      user_id: newUser.id,
      points: isOG ? 10000 : 0,
      is_og_rewarded: isOG,
    });

    return { user: newUser, isNew: true, ogPointsAwarded: isOG };
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
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('twitter_handle', twitterHandle)
      .single();

    if (userError || !user) return null;

    // Get profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

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

// Save session history
export async function saveSessionHistory(
  userId: string,
  questionsAnswered: number,
  humanScore: number,
  pointsEarned: number
) {
  try {
    const { error } = await supabase
      .from('session_history')
      .insert({
        user_id: userId,
        questions_answered: questionsAnswered,
        human_score: humanScore,
        points_earned: pointsEarned
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving session history:', error);
  }
}

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
      .select('human_score, total_questions_answered')
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
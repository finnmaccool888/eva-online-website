import { supabase } from './client';
import { MirrorQuestion, EvaReaction } from '../mirror/questions';

export interface SessionData {
  sessionId?: string;
  userId: string;
  sessionDate: Date;
  isComplete: boolean;
  questionsAnswered: number;
  humanScore: number | null;
  pointsEarned: number;
  streakDay: number;
  sessionDurationSeconds: number | null;
  questions: SessionQuestionData[];
  analytics: SessionAnalytics;
}

export interface SessionQuestionData {
  questionOrder: number;
  questionId: string;
  questionText: string;
  userAnswer: string;
  answerSubmittedAt: Date;
  answerEditedAt?: Date;
  characterCount: number;
  wordCount: number;
  evaResponseText?: string;
  evaResponseMood?: string;
  evaResponseReceivedAt?: Date;
  baseScore: number;
  lengthBonus: number;
  detailBonus: number;
  personalBonus: number;
  engagementBonus: number;
  totalQuestionScore: number;
}

export interface SessionAnalytics {
  chipOnlyAnswers: number;
  thoughtfulAnswers: number;
  averageAnswerLength: number;
  detailLevel: 'minimal' | 'basic' | 'detailed' | 'comprehensive';
  feedbackPoints: string[];
}

/**
 * Create a new session in Supabase
 */
export async function createSession(sessionData: Omit<SessionData, 'sessionId'>): Promise<string | null> {
  try {
    console.log('[Supabase] Creating new session for user:', sessionData.userId);

    // 1. Create session record
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: sessionData.userId,
        session_date: sessionData.sessionDate.toISOString().split('T')[0],
        is_complete: sessionData.isComplete,
        questions_answered: sessionData.questionsAnswered,
        human_score: sessionData.humanScore,
        points_earned: sessionData.pointsEarned,
        streak_day: sessionData.streakDay,
        session_duration_seconds: sessionData.sessionDurationSeconds,
        completed_at: sessionData.isComplete ? new Date().toISOString() : null
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('[Supabase] Error creating session:', sessionError);
      return null;
    }

    const sessionId = sessionRecord.id;
    console.log('[Supabase] Created session with ID:', sessionId);

    // 2. Create session questions
    if (sessionData.questions.length > 0) {
      const questionInserts = sessionData.questions.map(q => ({
        session_id: sessionId,
        question_order: q.questionOrder,
        question_id: q.questionId,
        question_text: q.questionText,
        user_answer: q.userAnswer,
        answer_submitted_at: q.answerSubmittedAt.toISOString(),
        answer_edited_at: q.answerEditedAt?.toISOString() || null,
        character_count: q.characterCount,
        word_count: q.wordCount,
        eva_response_text: q.evaResponseText || null,
        eva_response_mood: q.evaResponseMood || null,
        eva_response_received_at: q.evaResponseReceivedAt?.toISOString() || null,
        base_score: q.baseScore,
        length_bonus: q.lengthBonus,
        detail_bonus: q.detailBonus,
        personal_bonus: q.personalBonus,
        engagement_bonus: q.engagementBonus,
        total_question_score: q.totalQuestionScore
      }));

      const { error: questionsError } = await supabase
        .from('session_questions')
        .insert(questionInserts);

      if (questionsError) {
        console.error('[Supabase] Error creating session questions:', questionsError);
      } else {
        console.log('[Supabase] Created', questionInserts.length, 'session questions');
      }
    }

    // 3. Create session analytics
    const { error: analyticsError } = await supabase
      .from('session_analytics')
      .insert({
        session_id: sessionId,
        chip_only_answers: sessionData.analytics.chipOnlyAnswers,
        thoughtful_answers: sessionData.analytics.thoughtfulAnswers,
        average_answer_length: sessionData.analytics.averageAnswerLength,
        detail_level: sessionData.analytics.detailLevel,
        feedback_points: sessionData.analytics.feedbackPoints
      });

    if (analyticsError) {
      console.error('[Supabase] Error creating session analytics:', analyticsError);
    } else {
      console.log('[Supabase] Created session analytics');
    }

    return sessionId;
  } catch (error) {
    console.error('[Supabase] Unexpected error creating session:', error);
    return null;
  }
}

/**
 * Update session question with Eva's response
 */
export async function updateQuestionWithEvaResponse(
  sessionId: string,
  questionOrder: number,
  evaResponse: EvaReaction
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('session_questions')
      .update({
        eva_response_text: evaResponse.response,
        eva_response_mood: evaResponse.mood,
        eva_response_received_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('question_order', questionOrder);

    if (error) {
      console.error('[Supabase] Error updating question with Eva response:', error);
      return false;
    }

    console.log('[Supabase] Updated question', questionOrder, 'with Eva response');
    return true;
  } catch (error) {
    console.error('[Supabase] Unexpected error updating Eva response:', error);
    return false;
  }
}

/**
 * Update session question answer (for editing)
 */
export async function updateQuestionAnswer(
  sessionId: string,
  questionOrder: number,
  newAnswer: string
): Promise<boolean> {
  try {
    const characterCount = newAnswer.trim().length;
    const wordCount = newAnswer.trim().split(/\s+/).length;

    const { error } = await supabase
      .from('session_questions')
      .update({
        user_answer: newAnswer,
        answer_edited_at: new Date().toISOString(),
        character_count: characterCount,
        word_count: wordCount
      })
      .eq('session_id', sessionId)
      .eq('question_order', questionOrder);

    if (error) {
      console.error('[Supabase] Error updating question answer:', error);
      return false;
    }

    console.log('[Supabase] Updated answer for question', questionOrder);
    return true;
  } catch (error) {
    console.error('[Supabase] Unexpected error updating question answer:', error);
    return false;
  }
}

/**
 * Get user's session history from Supabase
 */
export async function getUserSessions(userId: string, limit: number = 10): Promise<SessionData[]> {
  try {
    const { data, error } = await supabase
      .from('session_details_view')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Supabase] Error fetching user sessions:', error);
      return [];
    }

    return data.map(session => ({
      sessionId: session.session_id,
      userId: session.user_id,
      sessionDate: new Date(session.session_date),
      isComplete: session.is_complete,
      questionsAnswered: session.questions_answered,
      humanScore: session.human_score,
      pointsEarned: session.points_earned,
      streakDay: session.streak_day,
      sessionDurationSeconds: session.session_duration_seconds,
      questions: session.questions_and_answers || [],
      analytics: {
        chipOnlyAnswers: session.chip_only_answers || 0,
        thoughtfulAnswers: session.thoughtful_answers || 0,
        averageAnswerLength: session.average_answer_length || 0,
        detailLevel: session.detail_level || 'minimal',
        feedbackPoints: session.feedback_points || []
      }
    }));
  } catch (error) {
    console.error('[Supabase] Unexpected error fetching user sessions:', error);
    return [];
  }
}

/**
 * Get specific session details
 */
export async function getSessionDetails(sessionId: string): Promise<SessionData | null> {
  try {
    const { data, error } = await supabase
      .from('session_details_view')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('[Supabase] Error fetching session details:', error);
      return null;
    }

    return {
      sessionId: data.session_id,
      userId: data.user_id,
      sessionDate: new Date(data.session_date),
      isComplete: data.is_complete,
      questionsAnswered: data.questions_answered,
      humanScore: data.human_score,
      pointsEarned: data.points_earned,
      streakDay: data.streak_day,
      sessionDurationSeconds: data.session_duration_seconds,
      questions: data.questions_and_answers || [],
      analytics: {
        chipOnlyAnswers: data.chip_only_answers || 0,
        thoughtfulAnswers: data.thoughtful_answers || 0,
        averageAnswerLength: data.average_answer_length || 0,
        detailLevel: data.detail_level || 'minimal',
        feedbackPoints: data.feedback_points || []
      }
    };
  } catch (error) {
    console.error('[Supabase] Unexpected error fetching session details:', error);
    return null;
  }
}

/**
 * Update user's streak information
 */
export async function updateUserStreak(userId: string, currentStreak: number, longestStreak: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[Supabase] Error updating user streak:', error);
      return false;
    }

    console.log('[Supabase] Updated user streak - current:', currentStreak, 'longest:', longestStreak);
    return true;
  } catch (error) {
    console.error('[Supabase] Unexpected error updating user streak:', error);
    return false;
  }
} 
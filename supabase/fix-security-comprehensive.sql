-- Comprehensive Security Fix for Eva Online
-- This migration:
-- 1. Creates missing tables if they don't exist
-- 2. Enables RLS on all tables
-- 3. Creates proper security policies
-- 4. Fixes SECURITY DEFINER views

-- ============================================
-- PART 1: Create missing tables if they don't exist
-- ============================================

-- Create sessions table (based on usage in session-services.ts)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  vibe TEXT,
  traits_data JSONB DEFAULT '{}',
  analytics JSONB DEFAULT '{}',
  eva_feedback TEXT,
  questions_answered INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  human_score INTEGER,
  points_earned INTEGER,
  is_complete BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_questions table (based on usage in session-services.ts)
CREATE TABLE IF NOT EXISTS public.session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT,
  answer_submitted_at TIMESTAMPTZ,
  answer_edited_at TIMESTAMPTZ,
  character_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  eva_response_text TEXT,
  eva_response_mood TEXT,
  eva_response_received_at TIMESTAMPTZ,
  base_score INTEGER DEFAULT 0,
  length_bonus INTEGER DEFAULT 0,
  detail_bonus INTEGER DEFAULT 0,
  personal_bonus INTEGER DEFAULT 0,
  engagement_bonus INTEGER DEFAULT 0,
  total_question_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session_analytics table (based on usage in session-services.ts)
CREATE TABLE IF NOT EXISTS public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  chip_only_answers INTEGER DEFAULT 0,
  thoughtful_answers INTEGER DEFAULT 0,
  average_answer_length NUMERIC DEFAULT 0,
  detail_level TEXT,
  feedback_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id ON public.session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_session_id ON public.session_analytics(session_id);

-- ============================================
-- PART 2: Enable Row Level Security on all tables
-- ============================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own session questions" ON public.session_questions;
DROP POLICY IF EXISTS "Users can insert own session questions" ON public.session_questions;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.session_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.session_analytics;
DROP POLICY IF EXISTS "Users can view own history" ON public.session_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.session_history;

-- Sessions table policies
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Session questions table policies
CREATE POLICY "Users can view own session questions" ON public.session_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_questions.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session questions" ON public.session_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_questions.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session questions" ON public.session_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_questions.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Session analytics table policies
CREATE POLICY "Users can view own analytics" ON public.session_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_analytics.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own analytics" ON public.session_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = session_analytics.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Session history table policies
CREATE POLICY "Users can view own history" ON public.session_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.session_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 4: Fix SECURITY DEFINER Views
-- ============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.session_details_view;
DROP VIEW IF EXISTS public.leaderboard_view;

-- Recreate session_details_view WITHOUT SECURITY DEFINER
CREATE VIEW public.session_details_view AS
SELECT 
  s.id,
  s.user_id,
  s.session_type,
  s.vibe,
  s.traits_data,
  s.analytics,
  s.eva_feedback,
  s.questions_answered,
  s.total_points,
  s.human_score,
  s.points_earned,
  s.is_complete,
  s.started_at,
  s.completed_at,
  s.created_at,
  s.updated_at,
  sq.question_order,
  sq.question_id,
  sq.question_text,
  sq.user_answer,
  sq.answer_submitted_at,
  sq.character_count,
  sq.word_count,
  sq.eva_response_text,
  sq.eva_response_mood,
  sq.total_question_score
FROM public.sessions s
LEFT JOIN public.session_questions sq ON s.id = sq.session_id
WHERE s.user_id = auth.uid(); -- Only show current user's data

-- Recreate leaderboard_view WITHOUT SECURITY DEFINER
CREATE VIEW public.leaderboard_view AS
SELECT 
  up.id,
  u.twitter_handle,
  u.twitter_name,
  u.profile_image,
  up.points,
  up.human_score,
  up.total_questions_answered,
  up.current_streak,
  up.longest_streak,
  up.is_og,
  up.is_og_rewarded,
  ROW_NUMBER() OVER (ORDER BY up.points DESC, up.human_score DESC) as rank
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE up.points > 0
ORDER BY up.points DESC, up.human_score DESC;

-- ============================================
-- PART 5: Additional safety measures
-- ============================================

-- Ensure user_profiles has RLS enabled with proper policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Recreate policies
CREATE POLICY "Anyone can view profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 6: Grant necessary permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on views to authenticated users
GRANT SELECT ON public.session_details_view TO authenticated;
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT SELECT ON public.leaderboard_view TO anon;

-- Note: After running this migration, verify that:
-- 1. Users can only see their own sessions
-- 2. The leaderboard still works properly
-- 3. Profile updates still work
-- 4. All security warnings are resolved

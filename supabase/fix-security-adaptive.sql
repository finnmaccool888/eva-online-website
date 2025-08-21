-- Adaptive Security Fix for Eva Online
-- This version checks what exists before making changes

-- ============================================
-- PART 1: Enable RLS on existing tables only
-- ============================================

-- Enable RLS only if tables exist
DO $$ 
BEGIN
    -- Check and enable RLS for sessions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
        ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on sessions table';
    ELSE
        RAISE NOTICE 'sessions table does not exist';
    END IF;

    -- Check and enable RLS for session_questions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_questions') THEN
        ALTER TABLE public.session_questions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on session_questions table';
    ELSE
        RAISE NOTICE 'session_questions table does not exist';
    END IF;

    -- Check and enable RLS for session_analytics
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_analytics') THEN
        ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on session_analytics table';
    ELSE
        RAISE NOTICE 'session_analytics table does not exist';
    END IF;

    -- Check and enable RLS for session_history
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_history') THEN
        ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on session_history table';
    ELSE
        RAISE NOTICE 'session_history table does not exist';
    END IF;
END $$;

-- ============================================
-- PART 2: Create RLS Policies for existing tables
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view own session questions" ON public.session_questions;
DROP POLICY IF EXISTS "Users can insert own session questions" ON public.session_questions;
DROP POLICY IF EXISTS "Users can update own session questions" ON public.session_questions;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.session_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.session_analytics;
DROP POLICY IF EXISTS "Users can view own history" ON public.session_history;
DROP POLICY IF EXISTS "Users can insert own history" ON public.session_history;

-- Create policies only for existing tables
DO $$ 
BEGIN
    -- Sessions table policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessions') THEN
        CREATE POLICY "Users can view own sessions" ON public.sessions
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own sessions" ON public.sessions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own sessions" ON public.sessions
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created policies for sessions table';
    END IF;

    -- Session questions table policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_questions') THEN
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
        RAISE NOTICE 'Created policies for session_questions table';
    END IF;

    -- Session analytics table policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_analytics') THEN
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
        RAISE NOTICE 'Created policies for session_analytics table';
    END IF;

    -- Session history table policies
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_history') THEN
        CREATE POLICY "Users can view own history" ON public.session_history
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own history" ON public.session_history
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created policies for session_history table';
    END IF;
END $$;

-- ============================================
-- PART 3: Fix SECURITY DEFINER Views
-- ============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.session_details_view;
DROP VIEW IF EXISTS public.leaderboard_view;

-- Recreate leaderboard_view WITHOUT SECURITY DEFINER (this should work as-is)
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

-- Note: We're NOT creating session_details_view because we don't know the exact structure
-- You can create it manually later once we know the exact columns

-- ============================================
-- PART 4: Grant necessary permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on views to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT SELECT ON public.leaderboard_view TO anon;

-- ============================================
-- SUMMARY
-- ============================================
-- This script:
-- 1. Enables RLS on existing tables only
-- 2. Creates policies for data access control
-- 3. Fixes the leaderboard_view 
-- 4. Skips session_details_view (needs manual creation based on actual schema)

-- After running this, the main security issues should be resolved

-- Complete Profile Schema Updates
-- Add all missing profile fields to support full profile dashboard functionality

-- Add missing profile fields to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS human_score INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS session_history JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_og BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_og_rewarded BOOLEAN DEFAULT FALSE;

-- Add streak tracking to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE DEFAULT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Update users table to have profile_image and is_og
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_og BOOLEAN DEFAULT FALSE;

-- Update session_history table for better tracking
ALTER TABLE session_history ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE session_history ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_human_score ON user_profiles(human_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_questions ON user_profiles(total_questions_answered DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_current_streak ON user_profiles(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_longest_streak ON user_profiles(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_points ON user_profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_og ON user_profiles(is_og);
CREATE INDEX IF NOT EXISTS idx_session_history_date ON session_history(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_session_history_complete ON session_history(is_complete);
CREATE INDEX IF NOT EXISTS idx_users_is_og ON users(is_og);

-- Create improved leaderboard view
CREATE OR REPLACE VIEW leaderboard_view AS
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
ORDER BY up.points DESC, up.human_score DESC;

-- Function to update user profile points and stats
CREATE OR REPLACE FUNCTION update_user_profile_stats(
    p_user_id UUID,
    p_human_score INTEGER,
    p_questions_answered INTEGER,
    p_points_earned INTEGER,
    p_session_data JSONB DEFAULT '{}'
) RETURNS VOID AS $$
DECLARE
    current_profile RECORD;
    new_total_questions INTEGER;
    new_avg_human_score INTEGER;
    new_total_points INTEGER;
    new_session_history JSONB;
BEGIN
    -- Get current profile stats
    SELECT * INTO current_profile FROM user_profiles WHERE user_id = p_user_id;
    
    IF current_profile IS NULL THEN
        -- Create new profile if doesn't exist
        INSERT INTO user_profiles (
            user_id, 
            human_score, 
            total_questions_answered, 
            points,
            session_history
        ) VALUES (
            p_user_id, 
            p_human_score, 
            p_questions_answered, 
            p_points_earned,
            JSONB_BUILD_ARRAY(p_session_data)
        );
    ELSE
        -- Calculate new averages and totals
        new_total_questions := current_profile.total_questions_answered + p_questions_answered;
        new_avg_human_score := ROUND((current_profile.human_score * current_profile.total_questions_answered + p_human_score * p_questions_answered) / new_total_questions::FLOAT);
        new_total_points := current_profile.points + p_points_earned;
        
        -- Update session history
        new_session_history := current_profile.session_history || JSONB_BUILD_ARRAY(p_session_data);
        
        -- Update profile
        UPDATE user_profiles SET
            human_score = new_avg_human_score,
            total_questions_answered = new_total_questions,
            points = new_total_points,
            session_history = new_session_history,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Sample usage (commented out):
-- SELECT update_user_profile_stats(
--     'user-uuid-here'::UUID,
--     85, -- human_score
--     5,  -- questions_answered  
--     2350, -- points_earned
--     '{"date": "2025-01-18", "questionsAnswered": 5, "humanScore": 85, "pointsEarned": 2350}'::JSONB
-- ); 
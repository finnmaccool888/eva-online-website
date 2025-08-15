-- Add OG support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_og BOOLEAN DEFAULT FALSE;

-- Add OG rewarded flag to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_og_rewarded BOOLEAN DEFAULT FALSE;

-- Add human score fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS human_score INTEGER DEFAULT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_questions_answered INTEGER DEFAULT 0;

-- Create session history table
CREATE TABLE IF NOT EXISTS session_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  questions_answered INTEGER NOT NULL,
  human_score INTEGER NOT NULL,
  points_earned INTEGER NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_og ON users(is_og);

-- Update existing OG users if needed (replace with actual OG usernames)
-- This is just an example, you would run a script to update based on the OG list
-- UPDATE users SET is_og = true WHERE twitter_handle IN ('starlordyftw', 'other_og_users...'); 
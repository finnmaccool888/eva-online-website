-- Add soul seed onboarding status to user_profiles
-- This tracks whether the user has completed the soul seed creation (alias, vibe, initial questions)

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_soul_seed_onboarded BOOLEAN DEFAULT false;

-- Add soul seed data columns to store the user's choices
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS soul_seed_alias TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS soul_seed_vibe TEXT DEFAULT NULL CHECK (soul_seed_vibe IN ('ethereal', 'zen', 'cyber', NULL)),
ADD COLUMN IF NOT EXISTS soul_seed_created_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for querying onboarding status
CREATE INDEX IF NOT EXISTS user_profiles_has_soul_seed_onboarded_idx 
ON user_profiles(has_soul_seed_onboarded);

-- Update existing users who have soul seed data in localStorage
-- This will need to be handled by the application during migration

COMMENT ON COLUMN user_profiles.has_soul_seed_onboarded IS 'Whether the user has completed soul seed creation (alias, vibe selection)';
COMMENT ON COLUMN user_profiles.soul_seed_alias IS 'The alias/name chosen for their digital soul';
COMMENT ON COLUMN user_profiles.soul_seed_vibe IS 'The conversation style chosen (ethereal, zen, or cyber)';
COMMENT ON COLUMN user_profiles.soul_seed_created_at IS 'When the soul seed was created';

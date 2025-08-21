-- Add onboarding status to user_profiles
ALTER TABLE user_profiles
ADD COLUMN has_onboarded BOOLEAN DEFAULT false;

-- Add index for querying
CREATE INDEX IF NOT EXISTS user_profiles_has_onboarded_idx ON user_profiles(has_onboarded);


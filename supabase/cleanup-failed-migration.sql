-- Cleanup Script for Failed Points Migration
-- Run this if you need to remove partially applied migration

-- Drop the constraint if it exists
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS check_points_consistency;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_points_consistency ON user_profiles;
DROP FUNCTION IF EXISTS maintain_points_consistency();

-- Drop the generated column first (required before dropping columns it depends on)
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS calculated_total_points;

-- Drop the component columns
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS base_points,
DROP COLUMN IF EXISTS og_bonus_points,
DROP COLUMN IF EXISTS profile_completion_points,
DROP COLUMN IF EXISTS session_points;

-- Drop the functions
DROP FUNCTION IF EXISTS update_profile_completion_points(UUID, BOOLEAN, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS add_session_points(UUID, INTEGER);
DROP FUNCTION IF EXISTS enforce_og_bonus(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS recalculate_user_points(UUID);

-- Drop the view
DROP VIEW IF EXISTS user_points_breakdown;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_profiles_point_components;
DROP INDEX IF EXISTS idx_sessions_user_points;

-- Verify cleanup
SELECT 
    'Cleanup Complete' as status,
    COUNT(*) as remaining_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points');

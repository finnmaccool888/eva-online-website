-- Add OG tracking to ensure bonus is only applied once per user
-- This migration adds tracking for when OG points were applied

-- Add column to track when OG points were applied
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS og_points_applied_at TIMESTAMPTZ;

-- Add column to track if user has seen migration message
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS migration_message_seen BOOLEAN DEFAULT FALSE;

-- Create index for quick OG lookups
CREATE INDEX IF NOT EXISTS idx_users_twitter_handle_og 
ON users(twitter_handle, is_og);

-- Create index for OG points tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_og_tracking
ON user_profiles(user_id, og_bonus_points, og_points_applied_at);

-- Function to safely apply OG bonus (only once)
CREATE OR REPLACE FUNCTION apply_og_bonus_once(
  p_user_id UUID,
  p_twitter_handle TEXT
) RETURNS TABLE(
  success BOOLEAN,
  points_applied BOOLEAN,
  message TEXT,
  total_points INTEGER
) AS $$
DECLARE
  v_is_og BOOLEAN;
  v_current_profile RECORD;
  v_points_to_add INTEGER := 0;
BEGIN
  -- Get user's OG status
  SELECT is_og INTO v_is_og
  FROM users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN as success,
      FALSE::BOOLEAN as points_applied,
      'User not found'::TEXT as message,
      0::INTEGER as total_points;
    RETURN;
  END IF;
  
  -- Get current profile
  SELECT * INTO v_current_profile
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Check if user is OG and hasn't received bonus yet
  IF v_is_og AND (v_current_profile.og_points_applied_at IS NULL OR v_current_profile.og_bonus_points != 10000) THEN
    -- Apply OG bonus
    UPDATE user_profiles
    SET 
      og_bonus_points = 10000,
      og_points_applied_at = NOW(),
      points = base_points + 10000 + profile_completion_points + session_points,
      is_og_rewarded = TRUE,
      updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING points INTO v_points_to_add;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN as success,
      TRUE::BOOLEAN as points_applied,
      'OG bonus of 10,000 points applied successfully'::TEXT as message,
      v_points_to_add::INTEGER as total_points;
  ELSIF v_is_og AND v_current_profile.og_points_applied_at IS NOT NULL THEN
    -- Already has OG bonus
    RETURN QUERY SELECT 
      TRUE::BOOLEAN as success,
      FALSE::BOOLEAN as points_applied,
      'OG bonus already applied on ' || to_char(v_current_profile.og_points_applied_at, 'Mon DD, YYYY')::TEXT as message,
      v_current_profile.points::INTEGER as total_points;
  ELSE
    -- Not an OG user
    RETURN QUERY SELECT 
      TRUE::BOOLEAN as success,
      FALSE::BOOLEAN as points_applied,
      'User is not an OG member'::TEXT as message,
      v_current_profile.points::INTEGER as total_points;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user needs migration
CREATE OR REPLACE FUNCTION check_user_needs_migration(p_user_id UUID)
RETURNS TABLE(
  needs_migration BOOLEAN,
  has_local_sessions BOOLEAN,
  missing_og_points BOOLEAN,
  points_inconsistent BOOLEAN
) AS $$
DECLARE
  v_user RECORD;
  v_profile RECORD;
BEGIN
  -- Get user and profile
  SELECT u.*, up.*
  INTO v_user
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  WHERE u.id = p_user_id;
  
  -- Check various migration needs
  RETURN QUERY SELECT
    -- Needs migration if any of the following are true
    (NOT COALESCE(v_user.migration_message_seen, FALSE) AND (
      -- Missing OG points
      (v_user.is_og AND COALESCE(v_user.og_bonus_points, 0) != 10000) OR
      -- Points don't match calculated total
      (v_user.points != (COALESCE(v_user.base_points, 1000) + 
                         COALESCE(v_user.og_bonus_points, 0) + 
                         COALESCE(v_user.profile_completion_points, 0) + 
                         COALESCE(v_user.session_points, 0)))
    ))::BOOLEAN as needs_migration,
    FALSE::BOOLEAN as has_local_sessions, -- Will be checked client-side
    (v_user.is_og AND COALESCE(v_user.og_bonus_points, 0) != 10000)::BOOLEAN as missing_og_points,
    (v_user.points != (COALESCE(v_user.base_points, 1000) + 
                       COALESCE(v_user.og_bonus_points, 0) + 
                       COALESCE(v_user.profile_completion_points, 0) + 
                       COALESCE(v_user.session_points, 0)))::BOOLEAN as points_inconsistent;
END;
$$ LANGUAGE plpgsql;

-- Mark migration message as seen
CREATE OR REPLACE FUNCTION mark_migration_seen(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET migration_message_seen = TRUE
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new functions
GRANT EXECUTE ON FUNCTION apply_og_bonus_once TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_needs_migration TO authenticated;
GRANT EXECUTE ON FUNCTION mark_migration_seen TO authenticated;

-- Fix Points Consistency - Problem 3 (Version 2)
-- This migration ensures points are calculated consistently and stored atomically
-- Fixed to handle existing data before adding constraints

-- ============================================
-- PART 1: Add columns to track point components
-- ============================================

-- Add columns to user_profiles to track point components separately
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS base_points INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS og_bonus_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_completion_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS calculated_total_points INTEGER GENERATED ALWAYS AS (
  base_points + og_bonus_points + profile_completion_points + session_points
) STORED;

-- NOTE: We'll add the constraint AFTER migrating data

-- ============================================
-- PART 2: Create atomic functions for point updates
-- ============================================

-- Function to update profile completion points atomically
CREATE OR REPLACE FUNCTION update_profile_completion_points(
  p_user_id UUID,
  p_has_twitter BOOLEAN,
  p_personal_fields_count INTEGER,
  p_social_profiles_count INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_new_points INTEGER;
BEGIN
  -- Calculate profile completion points
  v_new_points := 0;
  
  -- Twitter verification: 1000 points
  IF p_has_twitter THEN
    v_new_points := v_new_points + 1000;
  END IF;
  
  -- Personal info: 333 points per field (up to 3 fields)
  v_new_points := v_new_points + (LEAST(p_personal_fields_count, 3) * 333);
  
  -- Social profiles: 1000 points each
  v_new_points := v_new_points + (p_social_profiles_count * 1000);
  
  -- Update atomically
  UPDATE user_profiles
  SET 
    profile_completion_points = v_new_points,
    points = base_points + og_bonus_points + v_new_points + session_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN v_new_points;
END;
$$ LANGUAGE plpgsql;

-- Function to add session points atomically
CREATE OR REPLACE FUNCTION add_session_points(
  p_user_id UUID,
  p_points_to_add INTEGER
) RETURNS TABLE(
  old_total INTEGER,
  new_total INTEGER,
  session_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE user_profiles
  SET 
    session_points = session_points + p_points_to_add,
    points = base_points + og_bonus_points + profile_completion_points + (session_points + p_points_to_add),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING 
    points - p_points_to_add as old_total,
    points as new_total,
    session_points;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce OG bonus atomically
CREATE OR REPLACE FUNCTION enforce_og_bonus(
  p_user_id UUID,
  p_is_og BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_og_bonus INTEGER;
  v_expected_bonus INTEGER;
BEGIN
  -- Get current OG bonus
  SELECT og_bonus_points INTO v_current_og_bonus
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Calculate expected bonus
  v_expected_bonus := CASE WHEN p_is_og THEN 10000 ELSE 0 END;
  
  -- Update if different
  IF v_current_og_bonus IS DISTINCT FROM v_expected_bonus THEN
    UPDATE user_profiles
    SET 
      og_bonus_points = v_expected_bonus,
      points = base_points + v_expected_bonus + profile_completion_points + session_points,
      is_og_rewarded = p_is_og,
      updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Create function to recalculate all user points
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_user_points(p_user_id UUID)
RETURNS TABLE(
  base_points INTEGER,
  og_bonus INTEGER,
  profile_points INTEGER,
  session_points INTEGER,
  total_points INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_profile RECORD;
  v_session_total INTEGER;
  v_personal_fields INTEGER;
  v_og_bonus INTEGER;
  v_profile_completion INTEGER;
BEGIN
  -- Get user and profile data
  SELECT u.*, up.*
  INTO v_user
  FROM users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  WHERE u.id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Calculate OG bonus
  v_og_bonus := CASE WHEN v_user.is_og THEN 10000 ELSE 0 END;
  
  -- Count personal info fields
  v_personal_fields := 0;
  IF v_user.personal_info->>'fullName' IS NOT NULL AND v_user.personal_info->>'fullName' != '' THEN
    v_personal_fields := v_personal_fields + 1;
  END IF;
  IF v_user.personal_info->>'location' IS NOT NULL AND v_user.personal_info->>'location' != '' THEN
    v_personal_fields := v_personal_fields + 1;
  END IF;
  IF v_user.personal_info->>'bio' IS NOT NULL AND v_user.personal_info->>'bio' != '' THEN
    v_personal_fields := v_personal_fields + 1;
  END IF;
  
  -- Calculate profile completion points
  v_profile_completion := 1000; -- Twitter verification
  v_profile_completion := v_profile_completion + (v_personal_fields * 333);
  v_profile_completion := v_profile_completion + (
    COALESCE(jsonb_array_length(v_user.social_profiles), 0) * 1000
  );
  
  -- Calculate total session points from sessions table
  SELECT COALESCE(SUM(points_earned), 0)
  INTO v_session_total
  FROM sessions
  WHERE user_id = p_user_id
  AND is_complete = true;
  
  -- Update user profile with calculated values
  UPDATE user_profiles
  SET
    base_points = 1000,
    og_bonus_points = v_og_bonus,
    profile_completion_points = v_profile_completion,
    session_points = v_session_total,
    points = 1000 + v_og_bonus + v_profile_completion + v_session_total,
    is_og_rewarded = v_user.is_og,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Return the calculated values
  RETURN QUERY
  SELECT 
    1000::INTEGER as base_points,
    v_og_bonus,
    v_profile_completion as profile_points,
    v_session_total as session_points,
    (1000 + v_og_bonus + v_profile_completion + v_session_total) as total_points;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Migrate existing data
-- ============================================

-- First, ensure user_profiles exists for all users
INSERT INTO user_profiles (user_id, points, base_points, og_bonus_points)
SELECT 
  u.id,
  CASE WHEN u.is_og THEN 11000 ELSE 1000 END,
  1000,
  CASE WHEN u.is_og THEN 10000 ELSE 0 END
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE up.user_id IS NULL;

-- Update existing profiles to have correct component values
UPDATE user_profiles up
SET
  base_points = 1000,
  og_bonus_points = CASE WHEN u.is_og THEN 10000 ELSE 0 END,
  session_points = COALESCE(
    (SELECT SUM(points_earned) FROM sessions WHERE user_id = up.user_id AND is_complete = true),
    0
  )
FROM users u
WHERE up.user_id = u.id;

-- Calculate profile completion points for existing users
DO $$
DECLARE
  r RECORD;
  v_personal_fields INTEGER;
  v_profile_points INTEGER;
BEGIN
  FOR r IN 
    SELECT up.user_id, up.personal_info, up.social_profiles
    FROM user_profiles up
  LOOP
    v_personal_fields := 0;
    v_profile_points := 1000; -- Twitter verification
    
    -- Count personal fields
    IF r.personal_info->>'fullName' IS NOT NULL AND r.personal_info->>'fullName' != '' THEN
      v_personal_fields := v_personal_fields + 1;
    END IF;
    IF r.personal_info->>'location' IS NOT NULL AND r.personal_info->>'location' != '' THEN
      v_personal_fields := v_personal_fields + 1;
    END IF;
    IF r.personal_info->>'bio' IS NOT NULL AND r.personal_info->>'bio' != '' THEN
      v_personal_fields := v_personal_fields + 1;
    END IF;
    
    -- Add personal field points
    v_profile_points := v_profile_points + (v_personal_fields * 333);
    
    -- Add social profile points
    v_profile_points := v_profile_points + (
      COALESCE(jsonb_array_length(r.social_profiles), 0) * 1000
    );
    
    -- Update profile
    UPDATE user_profiles
    SET profile_completion_points = v_profile_points
    WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- Update all total points to match components
UPDATE user_profiles
SET points = base_points + og_bonus_points + profile_completion_points + session_points;

-- ============================================
-- PART 5: NOW add the constraint after data is consistent
-- ============================================

-- Add constraint to ensure calculated total matches points column
DO $$
BEGIN
  -- First check if all rows will satisfy the constraint
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE points != (base_points + og_bonus_points + profile_completion_points + session_points)
  ) THEN
    RAISE NOTICE 'Found inconsistent rows, fixing them first...';
    -- Fix any remaining inconsistencies
    UPDATE user_profiles
    SET points = base_points + og_bonus_points + profile_completion_points + session_points
    WHERE points != (base_points + og_bonus_points + profile_completion_points + session_points);
  END IF;
  
  -- Now add the constraint
  ALTER TABLE user_profiles
  ADD CONSTRAINT check_points_consistency 
  CHECK (points = calculated_total_points OR calculated_total_points IS NULL);
  
  RAISE NOTICE 'Constraint added successfully';
END $$;

-- ============================================
-- PART 6: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_point_components 
ON user_profiles(base_points, og_bonus_points, profile_completion_points, session_points);

CREATE INDEX IF NOT EXISTS idx_sessions_user_points 
ON sessions(user_id, points_earned) 
WHERE is_complete = true;

-- ============================================
-- PART 7: Add trigger to maintain consistency
-- ============================================

CREATE OR REPLACE FUNCTION maintain_points_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure total points always equals sum of components
  NEW.points := NEW.base_points + NEW.og_bonus_points + NEW.profile_completion_points + NEW.session_points;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_points_consistency ON user_profiles;
CREATE TRIGGER ensure_points_consistency
BEFORE INSERT OR UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION maintain_points_consistency();

-- ============================================
-- PART 8: Create view for point breakdown
-- ============================================

CREATE OR REPLACE VIEW user_points_breakdown AS
SELECT 
  u.id as user_id,
  u.twitter_handle,
  u.is_og,
  up.base_points,
  up.og_bonus_points,
  up.profile_completion_points,
  up.session_points,
  up.points as total_points,
  up.calculated_total_points,
  (up.points = up.calculated_total_points) as is_consistent
FROM users u
JOIN user_profiles up ON u.id = up.user_id
ORDER BY up.points DESC;

-- Grant permissions
GRANT SELECT ON user_points_breakdown TO authenticated;
GRANT SELECT ON user_points_breakdown TO anon;

-- ============================================
-- FINAL VERIFICATION
-- ============================================

-- Show summary of migration
DO $$
DECLARE
  v_total_users INTEGER;
  v_consistent_users INTEGER;
  v_og_users INTEGER;
  v_avg_points NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM user_profiles;
  SELECT COUNT(*) INTO v_consistent_users FROM user_points_breakdown WHERE is_consistent = true;
  SELECT COUNT(*) INTO v_og_users FROM user_points_breakdown WHERE is_og = true;
  SELECT AVG(total_points) INTO v_avg_points FROM user_points_breakdown;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Total users: %', v_total_users;
  RAISE NOTICE 'Consistent users: %/%', v_consistent_users, v_total_users;
  RAISE NOTICE 'OG users: %', v_og_users;
  RAISE NOTICE 'Average points: %', ROUND(v_avg_points);
  RAISE NOTICE '========================';
END $$;

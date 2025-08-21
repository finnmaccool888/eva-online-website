-- Complete Points Migration (Skip Already Applied Parts)
-- This script finishes the migration if it was partially applied

-- ============================================
-- PART 1: Check what needs to be done
-- ============================================

DO $$
DECLARE
    v_columns_exist BOOLEAN;
    v_constraint_exists BOOLEAN;
    v_functions_exist BOOLEAN;
    v_trigger_exists BOOLEAN;
    v_view_exists BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT COUNT(*) = 5 INTO v_columns_exist
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points');
    
    -- Check if constraint exists
    SELECT EXISTS(
        SELECT 1 FROM pg_constraint WHERE conname = 'check_points_consistency'
    ) INTO v_constraint_exists;
    
    -- Check if all functions exist
    SELECT COUNT(*) >= 4 INTO v_functions_exist
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('add_session_points', 'update_profile_completion_points', 'enforce_og_bonus', 'recalculate_user_points');
    
    -- Check if trigger exists
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_points_consistency'
    ) INTO v_trigger_exists;
    
    -- Check if view exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'user_points_breakdown'
    ) INTO v_view_exists;
    
    RAISE NOTICE 'Migration Status:';
    RAISE NOTICE '  Columns exist: %', v_columns_exist;
    RAISE NOTICE '  Constraint exists: %', v_constraint_exists;
    RAISE NOTICE '  Functions exist: %', v_functions_exist;
    RAISE NOTICE '  Trigger exists: %', v_trigger_exists;
    RAISE NOTICE '  View exists: %', v_view_exists;
    
    -- If everything exists, just run data migration
    IF v_columns_exist AND v_constraint_exists AND v_functions_exist THEN
        RAISE NOTICE 'Schema migration already complete, updating data only...';
    END IF;
END $$;

-- ============================================
-- PART 2: Migrate existing data (always safe to run)
-- ============================================

-- Ensure user_profiles exists for all users
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
  base_points = COALESCE(base_points, 1000),
  og_bonus_points = COALESCE(og_bonus_points, CASE WHEN u.is_og THEN 10000 ELSE 0 END),
  session_points = COALESCE(session_points, 
    (SELECT COALESCE(SUM(points_earned), 0) FROM sessions WHERE user_id = up.user_id AND is_complete = true)
  )
FROM users u
WHERE up.user_id = u.id
AND (base_points IS NULL OR og_bonus_points IS NULL OR session_points IS NULL);

-- Calculate profile completion points for users who don't have them
DO $$
DECLARE
  r RECORD;
  v_personal_fields INTEGER;
  v_profile_points INTEGER;
BEGIN
  FOR r IN 
    SELECT up.user_id, up.personal_info, up.social_profiles
    FROM user_profiles up
    WHERE up.profile_completion_points IS NULL
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
SET points = COALESCE(base_points, 1000) + 
             COALESCE(og_bonus_points, 0) + 
             COALESCE(profile_completion_points, 1000) + 
             COALESCE(session_points, 0)
WHERE base_points IS NOT NULL;

-- ============================================
-- PART 3: Create missing indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_point_components 
ON user_profiles(base_points, og_bonus_points, profile_completion_points, session_points);

CREATE INDEX IF NOT EXISTS idx_sessions_user_points 
ON sessions(user_id, points_earned) 
WHERE is_complete = true;

-- ============================================
-- PART 4: Create trigger if missing
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ensure_points_consistency') THEN
        -- Create trigger function
        CREATE OR REPLACE FUNCTION maintain_points_consistency()
        RETURNS TRIGGER AS $func$
        BEGIN
          -- Ensure total points always equals sum of components
          NEW.points := COALESCE(NEW.base_points, 1000) + 
                       COALESCE(NEW.og_bonus_points, 0) + 
                       COALESCE(NEW.profile_completion_points, 1000) + 
                       COALESCE(NEW.session_points, 0);
          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        -- Create trigger
        CREATE TRIGGER ensure_points_consistency
        BEFORE INSERT OR UPDATE ON user_profiles
        FOR EACH ROW
        EXECUTE FUNCTION maintain_points_consistency();
        
        RAISE NOTICE 'Created missing trigger';
    END IF;
END $$;

-- ============================================
-- PART 5: Create view if missing
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
-- FINAL: Show migration results
-- ============================================

SELECT 
    'Migration Complete' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN base_points IS NOT NULL THEN 1 END) as migrated_users,
    COUNT(CASE 
        WHEN base_points IS NOT NULL 
        AND points = (base_points + og_bonus_points + profile_completion_points + session_points) 
        THEN 1 
    END) as consistent_users
FROM user_profiles;

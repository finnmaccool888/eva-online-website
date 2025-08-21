-- Migration Script for Existing Users
-- This ensures all users get the benefits of the new system

-- ============================================
-- PART 1: Recalculate all user points
-- ============================================

-- First, show current state
SELECT 
    'Pre-Migration Status' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN up.points != (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) THEN 1 END) as inconsistent_users,
    SUM(up.points) as total_points_before
FROM user_profiles up;

-- Recalculate points for ALL users
DO $$
DECLARE
    user_rec RECORD;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting migration for all users...';
    
    FOR user_rec IN 
        SELECT u.id, u.twitter_handle, u.is_og
        FROM users u
        JOIN user_profiles up ON u.id = up.user_id
    LOOP
        -- Recalculate this user's points
        PERFORM recalculate_user_points(user_rec.id);
        fixed_count := fixed_count + 1;
        
        IF fixed_count % 10 = 0 THEN
            RAISE NOTICE 'Processed % users...', fixed_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration complete! Processed % users', fixed_count;
END $$;

-- ============================================
-- PART 2: Set onboarding flags for existing users
-- ============================================

-- Mark users as onboarded if they have completed sessions or profile data
UPDATE user_profiles up
SET 
    has_onboarded = true,
    updated_at = NOW()
WHERE up.has_onboarded IS FALSE
AND (
    -- Has completed at least one session
    EXISTS (
        SELECT 1 FROM sessions s 
        WHERE s.user_id = up.user_id 
        AND s.is_complete = true
    )
    OR 
    -- Has filled out personal info
    (up.personal_info->>'fullName' IS NOT NULL AND up.personal_info->>'fullName' != '')
);

-- Set soul seed onboarding for users who have completed sessions
UPDATE user_profiles up
SET 
    has_soul_seed_onboarded = true,
    soul_seed_alias = COALESCE(up.soul_seed_alias, 'Seeker'),
    soul_seed_vibe = COALESCE(up.soul_seed_vibe, 'ethereal'),
    soul_seed_created_at = COALESCE(
        up.soul_seed_created_at, 
        (SELECT MIN(s.created_at) FROM sessions s WHERE s.user_id = up.user_id)
    ),
    updated_at = NOW()
WHERE up.has_soul_seed_onboarded IS FALSE
AND EXISTS (
    SELECT 1 FROM sessions s 
    WHERE s.user_id = up.user_id 
    AND s.is_complete = true
);

-- ============================================
-- PART 3: Verify OG bonuses are correct
-- ============================================

-- Ensure all OG users have the correct bonus
UPDATE user_profiles up
SET 
    og_bonus_points = 10000,
    is_og_rewarded = true,
    points = base_points + 10000 + profile_completion_points + session_points,
    updated_at = NOW()
FROM users u
WHERE up.user_id = u.id
AND u.is_og = true
AND (up.og_bonus_points != 10000 OR up.is_og_rewarded = false);

-- Remove OG bonus from non-OG users
UPDATE user_profiles up
SET 
    og_bonus_points = 0,
    is_og_rewarded = false,
    points = base_points + 0 + profile_completion_points + session_points,
    updated_at = NOW()
FROM users u
WHERE up.user_id = u.id
AND u.is_og = false
AND up.og_bonus_points > 0;

-- ============================================
-- PART 4: Show migration results
-- ============================================

-- Show post-migration status
SELECT 
    'Post-Migration Status' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN up.points != (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) THEN 1 END) as inconsistent_users,
    SUM(up.points) as total_points_after
FROM user_profiles up;

-- Show onboarding status
SELECT 
    'Onboarding Status' as report,
    COUNT(*) as total_users,
    COUNT(CASE WHEN has_onboarded THEN 1 END) as profile_onboarded,
    COUNT(CASE WHEN has_soul_seed_onboarded THEN 1 END) as soul_seed_onboarded,
    COUNT(CASE WHEN has_onboarded AND has_soul_seed_onboarded THEN 1 END) as fully_onboarded
FROM user_profiles;

-- Show point distribution
SELECT 
    'Point Distribution' as report,
    COUNT(*) as user_count,
    MIN(points) as min_points,
    MAX(points) as max_points,
    AVG(points)::INTEGER as avg_points,
    COUNT(CASE WHEN u.is_og THEN 1 END) as og_users,
    COUNT(CASE WHEN u.is_og AND up.og_bonus_points = 10000 THEN 1 END) as og_with_bonus
FROM user_profiles up
JOIN users u ON up.user_id = u.id;

-- List any remaining inconsistent users
SELECT 
    u.twitter_handle,
    up.points as current_total,
    up.base_points,
    up.og_bonus_points,
    up.profile_completion_points,
    up.session_points,
    (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) as calculated_total,
    up.points - (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) as difference
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE up.points != (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points)
LIMIT 10;

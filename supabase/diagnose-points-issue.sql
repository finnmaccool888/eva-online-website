-- Diagnostic Script to Identify Points Inconsistencies
-- Run this BEFORE the migration to understand the current state

-- Check if the new columns already exist (from failed migration attempt)
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points')
ORDER BY column_name;

-- If columns exist, check for inconsistencies
DO $$
DECLARE
    user_rec RECORD;
    summary_rec RECORD;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'base_points'
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '=== Points Inconsistency Report ===';
        
        -- Show users where points don't match calculated total
        FOR user_rec IN 
            SELECT 
                u.twitter_handle,
                up.points as current_points,
                up.base_points,
                up.og_bonus_points,
                up.profile_completion_points,
                up.session_points,
                (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) as calculated_total,
                up.points - (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) as difference
            FROM user_profiles up
            JOIN users u ON up.user_id = u.id
            WHERE up.points != (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points)
            LIMIT 10
        LOOP
            RAISE NOTICE 'User: %, Current: %, Calculated: %, Diff: %', 
                user_rec.twitter_handle, user_rec.current_points, user_rec.calculated_total, user_rec.difference;
            RAISE NOTICE '  Components: base=%, og=%, profile=%, session=%',
                user_rec.base_points, user_rec.og_bonus_points, user_rec.profile_completion_points, user_rec.session_points;
        END LOOP;
        
        -- Show summary
        SELECT 
            COUNT(*) as total_inconsistent,
            SUM(ABS(points - (base_points + og_bonus_points + profile_completion_points + session_points))) as total_diff
        INTO summary_rec
        FROM user_profiles
        WHERE points != (base_points + og_bonus_points + profile_completion_points + session_points);
        
        RAISE NOTICE '';
        RAISE NOTICE 'Total inconsistent users: %', summary_rec.total_inconsistent;
        RAISE NOTICE 'Total points difference: %', summary_rec.total_diff;
    ELSE
        RAISE NOTICE 'Point component columns do not exist yet - safe to run migration';
    END IF;
END $$;

-- Check current points distribution
SELECT 
    'Current Points Distribution' as report,
    COUNT(*) as user_count,
    MIN(points) as min_points,
    MAX(points) as max_points,
    AVG(points)::INTEGER as avg_points,
    COUNT(CASE WHEN u.is_og THEN 1 END) as og_users,
    COUNT(CASE WHEN up.points >= 11000 AND u.is_og THEN 1 END) as og_with_correct_points,
    COUNT(CASE WHEN up.points < 11000 AND u.is_og THEN 1 END) as og_with_wrong_points
FROM user_profiles up
JOIN users u ON up.user_id = u.id;

-- Check if sessions table exists and has data
SELECT 
    'Sessions Table Status' as report,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as users_with_sessions,
    SUM(points_earned) as total_session_points,
    AVG(points_earned)::INTEGER as avg_points_per_session
FROM sessions
WHERE is_complete = true;

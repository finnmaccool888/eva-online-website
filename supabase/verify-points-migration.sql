-- Verify Points Migration Success

-- 1. Check if new columns exist
SELECT 
    'Columns Created' as check_type,
    COUNT(*) as columns_found,
    STRING_AGG(column_name, ', ') as column_names
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points');

-- 2. Check point consistency
SELECT 
    'Point Consistency' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_consistent THEN 1 END) as consistent_users,
    COUNT(CASE WHEN NOT is_consistent THEN 1 END) as inconsistent_users
FROM user_points_breakdown;

-- 3. Show point breakdown for all users
SELECT 
    twitter_handle,
    is_og,
    base_points,
    og_bonus_points,
    profile_completion_points,
    session_points,
    total_points,
    is_consistent
FROM user_points_breakdown
ORDER BY total_points DESC;

-- 4. Verify OG users have correct bonus
SELECT 
    'OG Bonus Check' as check_type,
    COUNT(*) as og_users,
    COUNT(CASE WHEN og_bonus_points = 10000 THEN 1 END) as correct_bonus,
    COUNT(CASE WHEN og_bonus_points != 10000 THEN 1 END) as incorrect_bonus
FROM user_points_breakdown
WHERE is_og = true;

-- 5. Check if functions were created
SELECT 
    'Functions Created' as check_type,
    COUNT(*) as function_count,
    STRING_AGG(routine_name, ', ') as function_names
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_session_points', 'update_profile_completion_points', 'enforce_og_bonus', 'recalculate_user_points');

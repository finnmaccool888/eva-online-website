-- Final Verification After Migration

-- 1. Show detailed user breakdown
SELECT 
    'User Point Details' as report;
    
SELECT 
    u.twitter_handle,
    u.is_og,
    up.base_points,
    up.og_bonus_points,
    up.profile_completion_points,
    up.session_points,
    up.points as total_points,
    (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) as calculated_total,
    up.points = (up.base_points + up.og_bonus_points + up.profile_completion_points + up.session_points) as is_consistent
FROM users u
JOIN user_profiles up ON u.id = up.user_id
ORDER BY up.points DESC;

-- 2. Check OG users specifically
SELECT 
    'OG Users Status' as report;
    
SELECT 
    u.twitter_handle,
    u.is_og,
    up.og_bonus_points,
    up.points as total_points,
    up.points >= 11000 as has_minimum_og_points
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_og = true;

-- 3. Summary statistics
SELECT 
    'Summary Statistics' as report;

SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN u.is_og THEN 1 ELSE 0 END) as og_users,
    MIN(up.points) as min_points,
    MAX(up.points) as max_points,
    AVG(up.points)::INTEGER as avg_points,
    SUM(up.points) as total_points_in_system
FROM users u
JOIN user_profiles up ON u.id = up.user_id;

-- 4. Check onboarding status
SELECT 
    'Onboarding Status' as report;

SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN has_onboarded THEN 1 ELSE 0 END) as profile_onboarded,
    SUM(CASE WHEN has_soul_seed_onboarded THEN 1 ELSE 0 END) as soul_seed_onboarded
FROM user_profiles;

-- 5. Session data check
SELECT 
    'Session Summary' as report;

SELECT 
    COUNT(DISTINCT user_id) as users_with_sessions,
    COUNT(*) as total_sessions,
    SUM(points_earned) as total_session_points,
    AVG(points_earned)::INTEGER as avg_points_per_session
FROM sessions
WHERE is_complete = true;

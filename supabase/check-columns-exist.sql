-- Simple check to see if the point component columns exist
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points', 'points')
ORDER BY column_name;

-- Also check the current points values for a few users
SELECT 
    u.twitter_handle,
    up.points,
    u.is_og,
    up.is_og_rewarded,
    up.created_at
FROM user_profiles up
JOIN users u ON up.user_id = u.id
ORDER BY up.created_at DESC
LIMIT 5;

-- Check if there are any OG users
SELECT 
    COUNT(*) as total_og_users,
    COUNT(CASE WHEN up.points >= 11000 THEN 1 END) as og_with_correct_points,
    COUNT(CASE WHEN up.points < 11000 THEN 1 END) as og_missing_points
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_og = true;

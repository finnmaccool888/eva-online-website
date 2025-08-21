-- Check 3: Show User Point Breakdown
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

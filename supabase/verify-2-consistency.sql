-- Check 2: Verify Point Consistency
SELECT 
    'Point Consistency' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_consistent THEN 1 END) as consistent_users,
    COUNT(CASE WHEN NOT is_consistent THEN 1 END) as inconsistent_users
FROM user_points_breakdown;

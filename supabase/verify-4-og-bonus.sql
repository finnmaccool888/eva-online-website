-- Check 4: Verify OG Users Have Correct Bonus
SELECT 
    'OG Bonus Check' as check_type,
    COUNT(*) as og_users,
    COUNT(CASE WHEN og_bonus_points = 10000 THEN 1 END) as correct_bonus,
    COUNT(CASE WHEN og_bonus_points != 10000 THEN 1 END) as incorrect_bonus
FROM user_points_breakdown
WHERE is_og = true;

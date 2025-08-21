-- Check 1: Verify Columns Were Created
SELECT 
    'Columns Created' as check_type,
    COUNT(*) as columns_found,
    STRING_AGG(column_name, ', ') as column_names
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points');

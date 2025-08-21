-- Check Current Points Migration Status

-- 1. Check which columns exist
SELECT 
    'Column Status' as check_type,
    string_agg(column_name, ', ') as existing_columns
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points', 'calculated_total_points');

-- 2. Check if constraint exists
SELECT 
    'Constraint Status' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'check_points_consistency';

-- 3. Check if functions exist
SELECT 
    'Function Status' as check_type,
    string_agg(routine_name, ', ') as existing_functions
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('add_session_points', 'update_profile_completion_points', 'enforce_og_bonus', 'recalculate_user_points', 'maintain_points_consistency');

-- 4. Check if trigger exists
SELECT 
    'Trigger Status' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'ensure_points_consistency';

-- 5. Check if view exists
SELECT 
    'View Status' as check_type,
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'user_points_breakdown';

-- 6. Check data consistency
SELECT 
    'Data Consistency' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN base_points IS NOT NULL THEN 1 END) as users_with_components,
    COUNT(CASE 
        WHEN base_points IS NOT NULL 
        AND points = (base_points + og_bonus_points + profile_completion_points + session_points) 
        THEN 1 
    END) as consistent_users
FROM user_profiles;

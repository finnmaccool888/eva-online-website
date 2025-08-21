-- Check if onboarding columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN (
    'has_onboarded',
    'has_soul_seed_onboarded',
    'soul_seed_alias',
    'soul_seed_vibe',
    'soul_seed_created_at'
)
ORDER BY column_name;

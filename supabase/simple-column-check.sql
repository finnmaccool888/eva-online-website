-- Simple check: Do the point component columns exist?
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'base_points'
        ) THEN 'YES - Cleanup needed first'
        ELSE 'NO - Safe to run migration'
    END as "Do point component columns exist?";

-- First, let's check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- If is_og column is missing, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_og'
    ) THEN
        ALTER TABLE users ADD COLUMN is_og BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_og column to users table';
    ELSE
        RAISE NOTICE 'is_og column already exists in users table';
    END IF;
END $$;

-- Check user_profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';

-- Add missing columns to user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'is_og_rewarded'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN is_og_rewarded BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_og_rewarded column to user_profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'human_score'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN human_score INTEGER DEFAULT NULL;
        RAISE NOTICE 'Added human_score column to user_profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'total_questions_answered'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN total_questions_answered INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_questions_answered column to user_profiles table';
    END IF;
END $$;

-- Show final state of both tables
SELECT 'users table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 'user_profiles table columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position; 
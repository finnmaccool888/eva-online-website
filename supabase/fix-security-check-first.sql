-- First, let's check what tables and columns actually exist
-- Run this query first to see the structure

-- Check if sessions table exists and its columns
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
AND c.table_name = 'sessions'
ORDER BY c.ordinal_position;

-- Check if session_questions table exists and its columns
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
AND c.table_name = 'session_questions'
ORDER BY c.ordinal_position;

-- Check if session_analytics table exists and its columns
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
AND c.table_name = 'session_analytics'
ORDER BY c.ordinal_position;

-- Check if session_history table exists and its columns
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
AND c.table_name = 'session_history'
ORDER BY c.ordinal_position;

-- Check if these views exist
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('session_details_view', 'leaderboard_view');

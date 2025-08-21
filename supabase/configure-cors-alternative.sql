-- Alternative CORS Configuration for Bug Bounty Storage
-- Since storage.cors table doesn't exist, we'll configure via bucket policies

-- First, let's check what storage tables exist
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'storage' 
ORDER BY tablename;

-- Check if there are any CORS-related configurations
SELECT * FROM storage.buckets WHERE name = 'bug-report-attachments';

-- Update bucket to be public for easier access (if needed)
-- Note: Our RLS policies will still control access
UPDATE storage.buckets 
SET public = true 
WHERE name = 'bug-report-attachments';

-- Verify the bucket configuration
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'bug-report-attachments';

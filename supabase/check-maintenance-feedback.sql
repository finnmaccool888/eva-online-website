-- Check if maintenance_feedback table exists and what's in it
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'maintenance_feedback'
ORDER BY ordinal_position;

-- Check if indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename = 'maintenance_feedback';

-- Check if policies exist
SELECT 
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'maintenance_feedback';

-- Check if table has any data
SELECT COUNT(*) as total_submissions FROM maintenance_feedback;

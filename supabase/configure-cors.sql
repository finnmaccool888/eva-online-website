-- Configure CORS for Bug Bounty File Uploads
-- Run this in Supabase SQL Editor

-- Add CORS for your production domain (replace with your actual domain)
INSERT INTO storage.cors (bucket_id, origin, methods, headers, max_age)
VALUES (
  'bug-report-attachments',
  'https://evaonline.xyz',  -- REPLACE WITH YOUR ACTUAL DOMAIN
  ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ARRAY['*'],
  3600
) ON CONFLICT (bucket_id, origin) DO UPDATE SET
  methods = EXCLUDED.methods,
  headers = EXCLUDED.headers,
  max_age = EXCLUDED.max_age;

-- Add CORS for www version (replace with your actual domain)
INSERT INTO storage.cors (bucket_id, origin, methods, headers, max_age)
VALUES (
  'bug-report-attachments',
  'https://www.evaonline.xyz',  -- REPLACE WITH YOUR ACTUAL DOMAIN
  ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ARRAY['*'],
  3600
) ON CONFLICT (bucket_id, origin) DO UPDATE SET
  methods = EXCLUDED.methods,
  headers = EXCLUDED.headers,
  max_age = EXCLUDED.max_age;

-- Add CORS for localhost (development)
INSERT INTO storage.cors (bucket_id, origin, methods, headers, max_age)
VALUES (
  'bug-report-attachments',
  'http://localhost:3000',
  ARRAY['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ARRAY['*'],
  3600
) ON CONFLICT (bucket_id, origin) DO UPDATE SET
  methods = EXCLUDED.methods,
  headers = EXCLUDED.headers,
  max_age = EXCLUDED.max_age;

-- Verify CORS configuration
SELECT * FROM storage.cors WHERE bucket_id = 'bug-report-attachments';

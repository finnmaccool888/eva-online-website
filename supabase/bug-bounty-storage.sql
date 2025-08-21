-- Bug Bounty Storage Setup
-- This creates a storage bucket for bug report attachments

-- Create the storage bucket for bug report attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bug-report-attachments',
  'bug-report-attachments',
  false, -- Private bucket, only accessible via authenticated requests
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for bug report attachments
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload bug report attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'bug-report-attachments' AND
  auth.uid() IS NOT NULL
);

-- Allow users to view their own attachments
CREATE POLICY "Users can view own bug report attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'bug-report-attachments' AND
  auth.uid() IS NOT NULL AND
  -- Check if the user owns the bug report associated with this attachment
  EXISTS (
    SELECT 1 FROM bug_report_attachments bra
    JOIN bug_reports br ON bra.bug_report_id = br.id
    WHERE bra.storage_path = storage.objects.name
    AND br.user_id::text = auth.uid()::text
  )
);

-- Allow users to delete their own attachments (before submission)
CREATE POLICY "Users can delete own bug report attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'bug-report-attachments' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM bug_report_attachments bra
    JOIN bug_reports br ON bra.bug_report_id = br.id
    WHERE bra.storage_path = storage.objects.name
    AND br.user_id::text = auth.uid()::text
    AND br.status = 'pending' -- Only allow deletion if report is still pending
  )
);

-- Note: After running this SQL, you'll need to configure CORS for your bucket
-- This can be done through the Supabase dashboard under Storage > Policies
-- Or via the Supabase CLI/API

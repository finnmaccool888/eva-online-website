-- Update Admin Handles for Bug Bounty System
-- Run this in Supabase SQL Editor to update RLS policies with correct admin handles

-- Update the RLS policy for viewing bug reports
DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    -- Allow authenticated users with admin role to see all
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::uuid 
      AND twitter_handle IN ('evaonlinexyz', 'starlordyftw', '0n1force')
    )
  );

-- Update the attachment viewing policy
DROP POLICY IF EXISTS "Users can view attachments of their bug reports" ON bug_report_attachments;
CREATE POLICY "Users can view attachments of their bug reports" ON bug_report_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bug_reports 
      WHERE id = bug_report_id 
      AND (
        user_id::text = auth.uid()::text OR
        -- Allow admins to see all
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid()::uuid 
          AND twitter_handle IN ('evaonlinexyz', 'starlordyftw', '0n1force')
        )
      )
    )
  );

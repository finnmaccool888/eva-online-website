-- Bug Bounty Database Schema
-- This creates tables for bug report submissions and file attachments

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Submitter information
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  twitter_handle TEXT,
  email TEXT,
  
  -- Bug report details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  category TEXT CHECK (category IN ('security', 'functionality', 'ui', 'performance', 'other')) DEFAULT 'functionality',
  
  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'fixed')) DEFAULT 'pending',
  reward_amount INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  
  -- Additional fields
  browser_info TEXT,
  url_where_found TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT
);

-- Bug report attachments table
CREATE TABLE IF NOT EXISTS bug_report_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bug_report_id UUID REFERENCES bug_reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_report_attachments_report_id ON bug_report_attachments(bug_report_id);

-- Enable Row Level Security
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to create bug reports
CREATE POLICY "Anyone can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own bug reports
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    -- Allow authenticated users with admin role to see all (you can customize this)
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::uuid 
      AND twitter_handle IN ('admin1', 'admin2') -- Replace with actual admin handles
    )
  );

-- Allow users to update their own bug reports (only certain fields)
CREATE POLICY "Users can update own bug reports" ON bug_reports
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (
    -- Only allow updating these fields
    title IS NOT NULL AND
    description IS NOT NULL
  );

-- Attachment policies
CREATE POLICY "Users can add attachments to their bug reports" ON bug_report_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bug_reports 
      WHERE id = bug_report_id 
      AND user_id::text = auth.uid()::text
    )
  );

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
          AND twitter_handle IN ('admin1', 'admin2') -- Replace with actual admin handles
        )
      )
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_bug_reports_updated_at BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

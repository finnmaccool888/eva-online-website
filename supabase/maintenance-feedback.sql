-- Create table for storing maintenance feedback
CREATE TABLE IF NOT EXISTS maintenance_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_handle TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT twitter_handle_format CHECK (twitter_handle ~* '^@?[A-Za-z0-9_]+$')
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_maintenance_feedback_created_at ON maintenance_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_feedback_email ON maintenance_feedback(email);

-- Enable RLS
ALTER TABLE maintenance_feedback ENABLE ROW LEVEL SECURITY;

-- Only allow inserts (no reads/updates/deletes from client)
CREATE POLICY IF NOT EXISTS "Anyone can submit feedback" ON maintenance_feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON maintenance_feedback TO anon, authenticated;

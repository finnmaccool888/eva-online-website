-- Create point recovery logs table
CREATE TABLE IF NOT EXISTS point_recovery_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  twitter_handle TEXT NOT NULL,
  old_points INTEGER NOT NULL,
  new_points INTEGER NOT NULL,
  og_status JSONB NOT NULL,
  session_points JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS point_recovery_logs_user_id_idx ON point_recovery_logs(user_id);
CREATE INDEX IF NOT EXISTS point_recovery_logs_twitter_handle_idx ON point_recovery_logs(twitter_handle);
CREATE INDEX IF NOT EXISTS point_recovery_logs_timestamp_idx ON point_recovery_logs(timestamp);

-- Add RLS policies
ALTER TABLE point_recovery_logs ENABLE ROW LEVEL SECURITY;

-- Only allow insert/select, no updates/deletes
CREATE POLICY "Allow insert for authenticated users" ON point_recovery_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow select for authenticated users" ON point_recovery_logs
  FOR SELECT TO authenticated
  USING (true);

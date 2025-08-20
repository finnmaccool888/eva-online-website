-- Create point recovery backup table
CREATE TABLE IF NOT EXISTS point_recovery_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  twitter_handle TEXT NOT NULL,
  points_snapshot JSONB NOT NULL,
  backup_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  restored_date TIMESTAMPTZ,
  is_restored BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for querying
CREATE INDEX IF NOT EXISTS point_recovery_backups_user_id_idx ON point_recovery_backups(user_id);
CREATE INDEX IF NOT EXISTS point_recovery_backups_twitter_handle_idx ON point_recovery_backups(twitter_handle);
CREATE INDEX IF NOT EXISTS point_recovery_backups_backup_date_idx ON point_recovery_backups(backup_date);

-- Add RLS policies
ALTER TABLE point_recovery_backups ENABLE ROW LEVEL SECURITY;

-- Only allow insert/select, no updates/deletes except for restore
CREATE POLICY "Allow insert for authenticated users" ON point_recovery_backups
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow select for authenticated users" ON point_recovery_backups
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow update for restore only" ON point_recovery_backups
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    -- Only allow updating restored_date and is_restored
    (OLD.id = NEW.id) AND
    (OLD.user_id = NEW.user_id) AND
    (OLD.twitter_handle = NEW.twitter_handle) AND
    (OLD.points_snapshot = NEW.points_snapshot) AND
    (OLD.backup_date = NEW.backup_date)
  );

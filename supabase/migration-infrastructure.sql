-- Phase 0: Migration Infrastructure with Security
-- Run AFTER fix-rls-security.sql

-- 1. Create migration backup table with security
CREATE TABLE IF NOT EXISTS public.migration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  backup_data JSONB NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('pre-migration', 'checkpoint', 'rollback')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE public.migration_backups ENABLE ROW LEVEL SECURITY;

-- Policies: Only service role can access (no direct user access)
CREATE POLICY "Service role only" ON public.migration_backups
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Create migration status tracking
CREATE TABLE IF NOT EXISTS public.migration_status (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'not_started',
  last_check TIMESTAMPTZ DEFAULT NOW(),
  issues_found INTEGER DEFAULT 0,
  data_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.migration_status ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON public.migration_status
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Create audit log for migration activities
CREATE TABLE IF NOT EXISTS public.migration_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.migration_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can write, users can read their own
CREATE POLICY "Users can view own logs" ON public.migration_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert" ON public.migration_audit_log
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 4. Create data consistency tracking table
CREATE TABLE IF NOT EXISTS public.data_consistency_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  check_type TEXT NOT NULL,
  local_data_hash TEXT,
  remote_data_hash TEXT,
  is_consistent BOOLEAN NOT NULL,
  discrepancies JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data_consistency_checks ENABLE ROW LEVEL SECURITY;

-- Service role only
CREATE POLICY "Service role only" ON public.data_consistency_checks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Create indexes for performance
CREATE INDEX idx_migration_backups_user_created 
  ON public.migration_backups(user_id, created_at DESC);

CREATE INDEX idx_migration_status_phase 
  ON public.migration_status(phase);

CREATE INDEX idx_migration_audit_user_created 
  ON public.migration_audit_log(user_id, created_at DESC);

CREATE INDEX idx_consistency_checks_user_consistent 
  ON public.data_consistency_checks(user_id, is_consistent, checked_at DESC);

-- 6. Create function to automatically delete old backups
CREATE OR REPLACE FUNCTION delete_expired_backups() RETURNS void AS $$
BEGIN
  DELETE FROM public.migration_backups 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add updated_at trigger for migration_status
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_migration_status_updated_at
  BEFORE UPDATE ON public.migration_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();





# Security Fix Migration Guide

This guide explains how to apply the security fixes to resolve the database linter errors.

## Overview

The security issues identified are:
1. **SECURITY DEFINER Views** - Two views (`session_details_view` and `leaderboard_view`) that bypass user permissions
2. **Missing Row Level Security (RLS)** - Four tables (`sessions`, `session_questions`, `session_analytics`, `session_history`) without proper access controls

## Migration Steps

### Step 1: Backup Your Database

Before applying any changes, create a backup:

```bash
# Using Supabase CLI
supabase db dump -f backup-before-security-fix.sql

# Or through Supabase Dashboard
# Go to Settings > Database > Backups
```

### Step 2: Apply the Security Fix

Run the comprehensive security fix SQL file:

```bash
# Using Supabase CLI (recommended)
supabase db push --file supabase/fix-security-comprehensive.sql

# Or through Supabase SQL Editor
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy the contents of fix-security-comprehensive.sql
# 3. Run the query
```

### Step 3: Verify the Changes

After applying the migration, verify that:

1. **Check RLS is enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'session_questions', 'session_analytics', 'session_history');
```

2. **Check views are no longer SECURITY DEFINER:**
```sql
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('session_details_view', 'leaderboard_view');
```

3. **Test functionality:**
   - Users can only see their own sessions
   - Leaderboard is still visible to all users
   - Profile updates work correctly
   - New sessions can be created

### Step 4: Run the Database Linter Again

After applying the fixes, run the database linter again to confirm all issues are resolved:

1. Go to Supabase Dashboard
2. Navigate to Database > Linter
3. Run the linter
4. All security errors should be resolved

## What This Migration Does

### 1. Creates Missing Tables
The migration creates the `sessions`, `session_questions`, and `session_analytics` tables if they don't exist, based on how they're used in your codebase.

### 2. Enables Row Level Security
RLS is enabled on all affected tables to ensure users can only access their own data.

### 3. Creates Security Policies
Proper policies are created for each table:
- Users can view/insert/update their own sessions
- Users can view/insert their own session questions and analytics
- Users can view/insert their own session history

### 4. Fixes Views
The problematic views are recreated without `SECURITY DEFINER`:
- `session_details_view` - Now filters to show only the current user's data
- `leaderboard_view` - Remains public but no longer uses elevated permissions

## Rollback Plan

If you need to rollback:

1. Restore from your backup:
```bash
supabase db reset
psql -h [your-db-host] -U postgres -d postgres < backup-before-security-fix.sql
```

2. Or manually revert changes:
```sql
-- Disable RLS (NOT RECOMMENDED for production)
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_history DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
-- ... (drop all other policies)
```

## Post-Migration Checklist

- [ ] Database backup created
- [ ] Migration applied successfully
- [ ] RLS enabled on all tables
- [ ] Views recreated without SECURITY DEFINER
- [ ] User authentication still works
- [ ] Leaderboard displays correctly
- [ ] Users can create new sessions
- [ ] Users can only see their own data
- [ ] Database linter shows no security errors

## Troubleshooting

### Issue: Users can't see their sessions
- Check that `auth.uid()` is returning the correct user ID
- Verify the user_id column in sessions matches the auth.users.id

### Issue: Leaderboard is empty
- Ensure the user_profiles table has data
- Check that points > 0 for users to appear

### Issue: Cannot create new sessions
- Verify the authenticated user has proper permissions
- Check that all foreign key relationships are valid

## Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Ensure your auth configuration is correct
3. Verify all table relationships are properly set up

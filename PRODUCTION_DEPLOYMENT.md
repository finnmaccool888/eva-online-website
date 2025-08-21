# Production Deployment Guide for Security Fixes

## ⚠️ IMPORTANT: Production Database Changes

This deployment includes critical security fixes that modify your production database. Follow these steps carefully.

## Prerequisites

1. Ensure you have:
   - Access to your production Supabase project
   - Supabase CLI configured for production
   - Database connection string (if needed)

## Step 1: Create Production Backup

**CRITICAL: Always backup before database changes!**

### Option A: Using Supabase Dashboard
1. Go to your production Supabase project
2. Navigate to Settings → Database → Backups
3. Click "Create backup"
4. Wait for backup to complete

### Option B: Using Supabase CLI
```bash
# Make sure you're linked to production project
supabase link --project-ref your-production-project-ref

# Create backup
supabase db dump -f production-backup-$(date +%Y%m%d-%H%M%S).sql
```

## Step 2: Apply the Security Migration

### Option A: Using Supabase SQL Editor (Recommended for visibility)
1. Go to your production Supabase project
2. Navigate to SQL Editor
3. Create a new query
4. Copy the contents of `supabase/fix-security-comprehensive.sql`
5. Review the SQL one more time
6. Click "Run" to execute

### Option B: Using Supabase CLI
```bash
# Ensure you're linked to production
supabase link --project-ref your-production-project-ref

# Apply the migration
supabase db push --file supabase/fix-security-comprehensive.sql
```

### Option C: Using the automated script
```bash
# The script will create a backup automatically
./scripts/apply-security-fix.sh
```

## Step 3: Verify the Migration

### 1. Check Database Linter
1. Go to Supabase Dashboard → Database → Linter
2. Run the linter
3. Verify all security errors are resolved

### 2. Test Core Functionality
Test these critical paths:

- [ ] User authentication works
- [ ] New users can sign up
- [ ] Existing users can log in
- [ ] Leaderboard displays correctly
- [ ] Users can view their profiles
- [ ] Users can create new sessions
- [ ] Users can ONLY see their own sessions (security check)

### 3. Run SQL Verification Queries
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'session_questions', 'session_analytics', 'session_history');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'session_questions', 'session_analytics', 'session_history');

-- Check views are not SECURITY DEFINER
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('session_details_view', 'leaderboard_view')
AND definition NOT LIKE '%SECURITY DEFINER%';
```

## Step 4: Monitor for Issues

After deployment:
1. Monitor your application logs for any errors
2. Check Supabase logs: Dashboard → Logs → Recent Logs
3. Keep the backup handy for 24-48 hours

## Rollback Plan

If issues occur:

### Quick Rollback via Supabase
1. Go to Settings → Database → Backups
2. Find your pre-deployment backup
3. Click "Restore"

### Manual Rollback
```bash
# Connect to your production database
psql -h your-db-host -U postgres -d postgres < production-backup-YYYYMMDD-HHMMSS.sql
```

## Expected Outcomes

After successful deployment:
- ✅ No security errors in database linter
- ✅ Users can only access their own data
- ✅ Leaderboard remains publicly visible
- ✅ All existing functionality works as before
- ✅ Database is now properly secured

## Support Checklist

If you encounter issues:
1. Check Supabase logs for specific errors
2. Verify auth configuration is correct
3. Ensure all foreign key relationships are valid
4. Test with a fresh user account

## Post-Deployment

1. Remove or archive old backup files after confirming stability
2. Update your team about the security improvements
3. Consider scheduling regular security audits

---

**Remember**: These are security fixes only - no UI/UX changes are included.

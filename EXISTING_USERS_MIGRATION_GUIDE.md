# Existing Users Migration Guide

## Overview

This guide ensures all existing users benefit from the new unified storage system, consistent points, and proper onboarding persistence.

## Migration Strategy

### 1. Automatic Client-Side Migration
When existing users visit the app, the `LocalStorageMigrator` component will automatically:
- ✅ Detect localStorage data
- ✅ Migrate onboarding status to database
- ✅ Import soul seed data
- ✅ Sync missing sessions
- ✅ Trigger point recalculation
- ✅ Clear old localStorage after successful migration

### 2. Server-Side Bulk Migration
For immediate consistency across all users:

## Implementation Steps

### Step 1: Deploy the Code
The migration components are already integrated:
- `LocalStorageMigrator` runs automatically in the app layout
- Migrates data when users visit the site
- Shows a small "Syncing..." indicator during migration

### Step 2: Run SQL Migration (Recommended)
For immediate results, run the bulk migration in Supabase:

```sql
-- In Supabase SQL Editor, run:
-- supabase/migrate-existing-users.sql
```

This will:
1. Recalculate points for ALL users
2. Set onboarding flags based on existing data
3. Ensure OG bonuses are correct
4. Show migration statistics

### Step 3: Use Admin Migration Tool (Alternative)
Visit `/admin/migrate-users` to:
- See how many users need migration
- Run migration with progress tracking
- View detailed results and errors

## What Gets Migrated

### Points Migration
- **Before**: Points might be inconsistent between components
- **After**: Points = base + OG bonus + profile + sessions
- **OG Users**: Guaranteed to have 10,000 bonus points

### Onboarding Status
- **Before**: Only stored in localStorage
- **After**: Stored in database (`has_onboarded`, `has_soul_seed_onboarded`)
- **Logic**: Users with sessions or profile data are marked as onboarded

### Session History
- **Before**: Stored in localStorage and/or JSONB column
- **After**: Properly stored in `sessions` table
- **Import**: Missing sessions are imported with correct points

### Soul Seed Data
- **Before**: Only in localStorage
- **After**: Stored in database with alias, vibe, and creation date

## Verification Steps

### 1. Check Migration Status
```sql
-- How many users have been migrated?
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN has_onboarded THEN 1 END) as onboarded,
    COUNT(CASE WHEN points = (base_points + og_bonus_points + profile_completion_points + session_points) THEN 1 END) as consistent_points
FROM user_profiles;
```

### 2. Verify Point Consistency
```sql
-- Any users with inconsistent points?
SELECT * FROM user_points_breakdown 
WHERE NOT is_consistent;
```

### 3. Check OG Bonuses
```sql
-- All OG users have correct bonus?
SELECT 
    u.twitter_handle,
    up.og_bonus_points,
    up.points
FROM users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.is_og = true;
```

## User Experience

### For Users Who Haven't Visited Yet
- Their data remains in localStorage
- When they visit, automatic migration runs
- They see a brief "Syncing..." message
- All their data is preserved

### For Active Users
- Migration happens seamlessly in background
- Points update to correct values
- Onboarding won't repeat
- Session history is preserved

### For New Users
- Start with the new system immediately
- No migration needed
- Everything stored in Supabase from the start

## Troubleshooting

### Issue: User's points seem wrong
```sql
-- Recalculate for specific user
SELECT recalculate_user_points(
    (SELECT id FROM users WHERE twitter_handle = 'username')
);
```

### Issue: Onboarding status incorrect
```sql
-- Manually update onboarding
UPDATE user_profiles
SET 
    has_onboarded = true,
    has_soul_seed_onboarded = true
WHERE user_id = (SELECT id FROM users WHERE twitter_handle = 'username');
```

### Issue: Sessions missing
Check if they exist in localStorage but not database:
1. User visits the app
2. LocalStorageMigrator imports them
3. Points automatically recalculate

## Migration Timeline

### Phase 1: Immediate (On Deploy)
- LocalStorageMigrator component active
- New users use unified system
- Existing users migrate on visit

### Phase 2: Bulk Migration (Within 24 hours)
- Run SQL migration script
- Ensures all users are consistent
- No need to wait for visits

### Phase 3: Cleanup (After 1 week)
- Verify all users migrated
- Remove migration components
- Archive old localStorage code

## Success Metrics

After migration:
- ✅ 100% of users have consistent points
- ✅ All OG users have 10,000+ points minimum
- ✅ Onboarding status persists across devices
- ✅ No more localStorage conflicts
- ✅ All sessions properly tracked

## Summary

The migration ensures:
1. **No data loss** - All localStorage data is preserved
2. **Automatic process** - Users don't need to do anything
3. **Immediate consistency** - Points are fixed instantly
4. **Better experience** - No more repeated onboarding

The combination of automatic client-side migration and server-side bulk processing ensures every user benefits from the improvements!

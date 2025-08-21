# Storage System Fix Implementation Guide

## Overview

This fix addresses **Problem 1: Local vs Supabase storage inconsistency** by implementing a unified storage system where Supabase is the single source of truth and localStorage is used only as a performance cache.

## What's Been Created

### 1. Unified Storage Manager (`src/lib/storage/unified-storage.ts`)
- Single source of truth: Supabase
- localStorage as read-only cache
- Automatic reconciliation
- Proper OG points enforcement
- Session data management

### 2. New Hook (`src/lib/hooks/useUnifiedProfile.ts`)
- Easy access to profile data
- Automatic syncing
- Real-time updates
- Error handling

### 3. Updated Components (V2 versions)
- `ProfileDashboardV2` - Uses unified storage
- `MirrorAppV2` - Properly checks onboarding status
- `PointsDisplayV2` - Real-time points from unified storage

## Implementation Steps

### Step 1: Update Component Imports

Replace the old components with the new V2 versions:

```typescript
// In src/app/profile/page.tsx
import ProfileDashboard from "@/components/profile/profile-dashboard-v2";

// In src/app/mirror/page.tsx  
import MirrorApp from "@/components/mirror/mirror-app-v2";

// In components that use PointsDisplay
import PointsDisplay from "@/components/mirror/points-display-v2";
```

### Step 2: Update Session Creation

When creating sessions, ensure points are calculated server-side:

```typescript
// In session completion
await unifiedStorage.updateSessionData({
  questionsAnswered: 5,
  humanScore: 85,
  pointsEarned: 2500 // Let Supabase calculate total
});
```

### Step 3: Remove Old Sync Code

Remove these old patterns:
- Direct localStorage writes for profile data
- `syncCompleteProfile()` calls
- Manual point calculations in components
- `loadProfile()` / `saveProfile()` from old system

### Step 4: Update Authentication Flow

```typescript
// On successful auth
const profile = await unifiedStorage.loadProfile();
if (!profile.data?.hasOnboarded) {
  // Show onboarding
}
```

## Key Benefits

### 1. **Consistency**
- Points always match between UI and database
- No more conflicting values
- OG bonus applied only once

### 2. **Performance**
- Fast reads from cache
- Background sync to Supabase
- Optimistic updates

### 3. **Reliability**
- Automatic error recovery
- Conflict resolution
- Audit trail

## Migration Checklist

- [ ] Replace old components with V2 versions
- [ ] Update imports in all pages
- [ ] Test login flow with existing user
- [ ] Test login flow with new user
- [ ] Verify OG points (should be 11,000 for OG users)
- [ ] Verify onboarding doesn't repeat
- [ ] Check points update after sessions
- [ ] Test profile persistence across browsers

## Testing Scenarios

### 1. New User Registration
1. Sign in with Twitter
2. Complete onboarding wizard
3. Check points = 1,000 (base)
4. Refresh page - onboarding shouldn't repeat

### 2. OG User Login
1. Sign in with OG account
2. Check points = 11,000 minimum
3. Complete session
4. Verify points increase correctly

### 3. Cross-Browser Test
1. Login on Chrome
2. Complete a session
3. Login on Safari
4. Points should match exactly

### 4. Offline Recovery
1. Go offline
2. Try to load profile (should use cache)
3. Go online
4. Should sync automatically

## Troubleshooting

### Issue: Points showing 0
- Check `useUnifiedProfile` hook is being used
- Verify authentication is complete
- Check browser console for errors

### Issue: Onboarding repeats
- Ensure `markOnboarded()` is called after wizard
- Check `has_onboarded` column in Supabase

### Issue: OG bonus missing
- Verify user is in `ogList.json`
- Check `is_og` flag in users table
- Run OG enforcement manually if needed

## Next Steps

After implementing this fix:
1. Monitor for 24-48 hours
2. Check Supabase logs for errors
3. Gather user feedback
4. Move on to fixing Problem 2 (onboarding persistence)

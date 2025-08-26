# Eva Online: Persistent Points Disappearing Issue Analysis

## Problem Summary

**Core Issue**: OG points and session points are disappearing from users' dashboards after migrating from hybrid local/online storage to online-only storage, despite multiple attempted fixes.

## Background Context

### The Storage Migration
- **Before**: Hybrid system using both localStorage and Supabase
- **After**: Unified storage system with Supabase as single source of truth
- **Goal**: Eliminate inconsistencies between local and remote data

### What Should Work
1. **OG Users**: Should have 10,000 bonus points permanently
2. **Session Points**: Should accumulate from Mirror conversations
3. **Profile Points**: Should be calculated from profile completion
4. **Base Points**: Everyone gets 1,000 base points

## Current Architecture

### V1 vs V2 Components Status
- **Profile Page**: Still using V1 (`profile-dashboard.tsx`) ❌
- **Mirror Page**: Using V2 (`mirror-app-v2.tsx`) ✅
- **Points Display**: V2 exists but V1 may still be used in some places

### Storage Systems in Use
1. **UnifiedStorageManager** (`src/lib/storage/unified-storage.ts`)
   - Supabase as single source of truth
   - localStorage as read-only cache
   - Automatic reconciliation

2. **useUnifiedProfile Hook** (`src/lib/hooks/useUnifiedProfile.ts`)
   - Manages profile state
   - Real-time updates
   - Error handling

3. **Database Schema** (Supabase)
   - Point components stored separately:
     - `base_points` (1000)
     - `og_bonus_points` (0 or 10000)
     - `profile_completion_points` (varies)
     - `session_points` (accumulated)
     - `calculated_total_points` (generated column)

## Identified Issues

### 1. Component Version Inconsistency
**Critical**: Profile page still uses V1 dashboard instead of V2
```typescript
// src/app/profile/page.tsx - Line 5
import ProfileDashboard from "@/components/profile/profile-dashboard"; // V1 ❌
// Should be:
import ProfileDashboard from "@/components/profile/profile-dashboard-v2"; // V2 ✅
```

### 2. Dual Storage System Conflicts
The old V1 ProfileDashboard still uses:
- `usePointsSync()` hook (old system)
- Direct Supabase calls mixed with localStorage
- Manual point calculations
- `syncCompleteProfile()` calls

While V2 components use:
- `useUnifiedProfile()` hook (new system)
- UnifiedStorageManager
- Server-side point calculations

### 3. Race Conditions in Point Updates
Multiple systems trying to update points simultaneously:
- Old V1 components calculating points client-side
- New V2 components using server-side calculations
- Migration scripts running in background
- Manual point fixes via admin tools

### 4. Database Migration Status Unclear
Multiple migration scripts exist but deployment status unclear:
- `fix-points-consistency.sql`
- `fix-points-consistency-v2.sql`
- `complete-points-migration.sql`
- Various diagnostic and cleanup scripts

### 5. Fallback to Local-Only Mode
UnifiedStorageManager has fallback logic that creates "fake" local users when database operations fail, potentially causing:
- Points to be calculated locally but not persisted
- Users to see points that don't exist in database
- Inconsistent state between sessions

## Symptoms Observed

1. **Points Show Initially Then Disappear**: Users see points on first load, then they vanish on refresh
2. **OG Status Not Persistent**: OG users lose their 10,000 bonus points
3. **Session Points Not Accumulating**: Mirror conversations don't add to total points
4. **Dashboard Shows Zero Points**: Profile dashboard displays 0 points despite user having sessions/profile data

## Root Cause Analysis

### Primary Cause: Mixed Architecture
The application is running a hybrid of V1 and V2 systems:
- Profile page uses V1 (old storage system)
- Mirror page uses V2 (new storage system)
- Points calculated differently in each system
- Data inconsistencies between localStorage and Supabase

### Secondary Causes:
1. **Incomplete Migration**: Database schema changes may not be fully applied
2. **Component Import Mismatch**: Critical components still importing V1 versions
3. **Error Handling**: Fallback modes creating temporary local data
4. **Cache Invalidation**: localStorage cache not properly cleared after migration

## Evidence from Codebase

### V1 Profile Dashboard Issues (Currently Used)
```typescript
// Lines 30, 34-42: Still using old usePointsSync hook
const { points, refreshPoints, isRefreshing } = usePointsSync();

// Lines 49-50: Direct Supabase calls mixed with old system
const { user, isNew, ogPointsAwarded } = await createOrUpdateUser(...);

// Lines 98-99: Manual sync calls
const { syncCompleteProfile } = await import('@/lib/supabase/sync-profile');
await syncCompleteProfile();
```

### V2 Profile Dashboard (Should Be Used)
```typescript
// Uses unified storage system
const { profile, loading, error, isOG, points, hasOnboarded, refreshProfile, updateProfile } = useUnifiedProfile();
```

## Migration Path Forward

### Immediate Fixes Needed:
1. **Update Profile Page Import**: Change to V2 dashboard
2. **Verify Database Migrations**: Ensure all point consistency migrations are applied
3. **Clear localStorage**: Force clear old cached data
4. **Audit All Component Imports**: Ensure all pages use V2 components

### Validation Steps:
1. Check database schema has point component columns
2. Verify atomic functions exist for point updates
3. Confirm all users have proper point breakdowns
4. Test point persistence across sessions

## User Impact

- **High Priority**: OG users losing 10,000 bonus points
- **Medium Priority**: Regular users losing session progress
- **Low Priority**: Profile completion points not showing

The issue affects user retention and trust in the platform, as users see their earned points disappear unpredictably.

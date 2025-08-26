# LLM Prompt: Fix Eva Online Points Disappearing Issue

## Context for AI Assistant

You are helping fix a critical bug in Eva Online, a web application where users earn points through conversations with an AI character named Eva. The app recently migrated from a hybrid localStorage/Supabase storage system to a unified Supabase-only system, but users are experiencing persistent issues with points disappearing from their dashboards.

## Current System Architecture

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, React components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Twitter OAuth
- **Storage**: Unified storage system with Supabase as source of truth

### Point System Structure
Users earn points through multiple sources:
1. **Base Points**: 1,000 points for all users
2. **OG Bonus**: 10,000 additional points for original community members
3. **Profile Completion**: Up to ~4,000 points for completing profile fields
4. **Session Points**: Variable points earned from Mirror conversations with Eva

### Database Schema (Supabase)
```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  twitter_handle TEXT UNIQUE,
  is_og BOOLEAN DEFAULT FALSE
)

-- User profiles table  
user_profiles (
  user_id UUID REFERENCES users(id),
  points INTEGER, -- Total points (should equal sum of components)
  base_points INTEGER DEFAULT 1000,
  og_bonus_points INTEGER DEFAULT 0,
  profile_completion_points INTEGER DEFAULT 0,
  session_points INTEGER DEFAULT 0,
  calculated_total_points INTEGER GENERATED ALWAYS AS (base_points + og_bonus_points + profile_completion_points + session_points) STORED
)

-- Sessions table
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points_earned INTEGER,
  human_score INTEGER
)
```

## The Problem

### Symptoms
1. **Points appear initially then disappear**: Users see their points on first page load, but they vanish on refresh
2. **OG users lose bonus points**: Users with `is_og=true` should have 10,000 bonus points but show 0
3. **Session points don't accumulate**: Completing Mirror conversations doesn't add to total points
4. **Dashboard shows zero**: Profile dashboard displays 0 points despite user having session history

### Root Cause Analysis
The application is running a **mixed architecture** with both old (V1) and new (V2) components:

**V1 Components (Old System - PROBLEMATIC)**:
- Uses `usePointsSync()` hook
- Mixes localStorage with direct Supabase calls
- Calculates points client-side
- Still imported in critical pages like `/profile`

**V2 Components (New System - CORRECT)**:
- Uses `useUnifiedProfile()` hook  
- Uses `UnifiedStorageManager` class
- Calculates points server-side
- Properly handles Supabase as single source of truth

### Critical Issue Identified
The profile page (`src/app/profile/page.tsx`) is still importing the V1 dashboard:
```typescript
// WRONG - Line 5
import ProfileDashboard from "@/components/profile/profile-dashboard";

// SHOULD BE
import ProfileDashboard from "@/components/profile/profile-dashboard-v2";
```

## Files You Need to Understand

### Key Components
1. **`src/app/profile/page.tsx`** - Profile page (uses wrong import)
2. **`src/components/profile/profile-dashboard.tsx`** - V1 dashboard (problematic)
3. **`src/components/profile/profile-dashboard-v2.tsx`** - V2 dashboard (correct)
4. **`src/lib/hooks/useUnifiedProfile.ts`** - New unified profile hook
5. **`src/lib/storage/unified-storage.ts`** - New storage manager
6. **`src/lib/hooks/usePointsSync.ts`** - Old points sync hook (should not be used)

### Database Migration Files
- **`supabase/fix-points-consistency-v2.sql`** - Latest points migration
- **`supabase/diagnose-points-issue.sql`** - Diagnostic queries
- **`supabase/complete-points-migration.sql`** - Complete migration script

## Your Task

### Primary Objectives
1. **Fix Component Imports**: Ensure all pages use V2 components
2. **Verify Database Schema**: Confirm point component columns exist
3. **Validate Point Calculations**: Ensure server-side calculations work correctly
4. **Test Point Persistence**: Verify points persist across sessions

### Specific Actions Needed
1. **Update Profile Page**: Change import to use `profile-dashboard-v2`
2. **Audit All Imports**: Find any other V1 component usage
3. **Check Database State**: Verify migration status and point consistency
4. **Test User Flow**: Ensure points display correctly and persist

### Success Criteria
- [ ] Profile dashboard shows correct points immediately
- [ ] Points persist after page refresh
- [ ] OG users see their 10,000 bonus points
- [ ] Session points accumulate properly
- [ ] No more localStorage/Supabase conflicts

## Debugging Approach

### Step 1: Component Audit
Check which components are being imported and used:
```bash
# Find all imports of old components
grep -r "profile-dashboard\"" src/
grep -r "points-display\"" src/
grep -r "mirror-app\"" src/
```

### Step 2: Database Verification
Run diagnostic queries to check point consistency:
```sql
-- Check if point component columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('base_points', 'og_bonus_points', 'profile_completion_points', 'session_points');

-- Check for inconsistent points
SELECT twitter_handle, points, calculated_total_points, 
       (points - calculated_total_points) as difference
FROM user_profiles up
JOIN users u ON up.user_id = u.id
WHERE points != calculated_total_points;
```

### Step 3: Test Point Flow
1. Login as test user
2. Check initial points display
3. Complete a Mirror session
4. Verify points increase
5. Refresh page and confirm points persist

## Important Constraints

### Do Not Break
- Existing user data and points
- Authentication flow
- Mirror conversation functionality
- Database integrity

### Migration Safety
- Always backup before schema changes
- Test migrations on small dataset first
- Provide rollback procedures
- Validate data consistency after changes

## Expected Challenges

1. **Data Migration**: Existing users may have inconsistent point data
2. **Cache Invalidation**: Old localStorage data may interfere
3. **Race Conditions**: Multiple systems updating points simultaneously
4. **Error Handling**: Fallback modes creating temporary inconsistencies

## Success Metrics

After your fix:
- Users should see consistent points across all pages
- OG users should have 10,000 bonus points
- Session points should accumulate reliably
- Points should persist across browser sessions
- No more user reports of disappearing points

## Additional Context

This is a high-priority issue affecting user trust and retention. The Eva Online community includes valuable "OG" members who are losing their earned status and points. The fix needs to be comprehensive and reliable, as previous partial fixes have not resolved the core issue.

The codebase shows evidence of multiple attempted fixes, indicating this is a complex problem requiring careful analysis of the interaction between storage systems, component architecture, and database schema.

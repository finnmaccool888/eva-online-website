# Onboarding Persistence Fix Implementation Guide

## Overview

This fix addresses **Problem 2: Onboarding repeats on every login** by persisting all onboarding data to Supabase instead of just localStorage.

## What's Been Fixed

### 1. Profile Wizard Persistence
- Created `OnboardingWizardV2` that uses unified storage
- Saves profile data directly to Supabase
- Sets `hasOnboarded` flag in database

### 2. Soul Seed Onboarding Persistence  
- Added soul seed fields to database schema:
  - `has_soul_seed_onboarded` - completion flag
  - `soul_seed_alias` - chosen name
  - `soul_seed_vibe` - chosen conversation style
  - `soul_seed_created_at` - timestamp
- Created `OnboardingV2` component that persists to Supabase
- Added `markSoulSeedOnboarded()` to unified storage

### 3. Fixed Logic in MirrorAppV2
- Checks onboarding status from Supabase profile
- No longer relies on localStorage for onboarding state
- Properly sequences profile wizard → soul seed onboarding

## Implementation Steps

### Step 1: Apply Database Migration

Run the soul seed onboarding migration:

```sql
-- In Supabase SQL Editor
-- Copy contents of: supabase/add-soul-seed-onboarding.sql
```

This adds the necessary columns to track soul seed onboarding.

### Step 2: Update Component Imports

The V2 components are already imported in MirrorAppV2. For other places:

```typescript
// Replace old imports
import OnboardingWizard from "./onboarding-wizard";
import Onboarding from "./onboarding";

// With new imports  
import OnboardingWizardV2 from "./onboarding-wizard-v2";
import OnboardingV2 from "./onboarding-v2";
```

### Step 3: Test the Fix

1. **New User Flow:**
   - Sign in with new Twitter account
   - Complete profile wizard (name, bio, socials)
   - Complete soul seed onboarding (alias, vibe, questions)
   - Sign out
   - Sign in again → Should go directly to Eva's Mirror

2. **Existing User Migration:**
   - Users with profile data but no soul seed → Will see soul seed onboarding
   - Users with both completed → Go straight to Eva's Mirror
   - Users with neither → Start from profile wizard

3. **Cross-Browser Test:**
   - Complete onboarding in Chrome
   - Open in Safari
   - Should NOT see onboarding again

## Key Changes

### Database Schema
```sql
-- New columns in user_profiles
has_onboarded BOOLEAN DEFAULT false
has_soul_seed_onboarded BOOLEAN DEFAULT false  
soul_seed_alias TEXT
soul_seed_vibe TEXT CHECK (vibe IN ('ethereal', 'zen', 'cyber'))
soul_seed_created_at TIMESTAMPTZ
```

### Unified Storage Methods
```typescript
// Mark profile wizard complete
await markOnboarded();

// Mark soul seed complete with data
await markSoulSeedOnboarded(alias, vibe);
```

### Component Flow
```
MirrorAppV2
├── Check profile.hasOnboarded
│   ├── false → Show OnboardingWizardV2
│   └── true → Check profile.hasSoulSeedOnboarded
│       ├── false → Show OnboardingV2
│       └── true → Show EvaTransmission
```

## Benefits

1. **True Persistence**: Onboarding status stored in database
2. **Cross-Device**: Works across browsers and devices  
3. **No Repeat**: Users only onboard once per account
4. **Data Recovery**: Can restore onboarding state from database

## Troubleshooting

### Issue: Onboarding still repeats
- Check `has_onboarded` column in user_profiles table
- Verify `markOnboarded()` is being called
- Check browser console for errors

### Issue: Soul seed data not saving
- Verify migration was applied (check columns exist)
- Check `markSoulSeedOnboarded()` is called with correct params
- Look for errors in Supabase logs

### Issue: Existing users stuck
- Manually update their flags in database if needed:
```sql
UPDATE user_profiles 
SET has_onboarded = true,
    has_soul_seed_onboarded = true
WHERE user_id = 'their-user-id';
```

## Next Steps

1. Deploy these changes
2. Monitor for any onboarding issues
3. Consider adding analytics to track onboarding completion rates
4. Move on to fixing Problem 3 (points consistency)

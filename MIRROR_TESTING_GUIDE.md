# Mirror App Testing Guide

## 📋 Pre-Test Setup Checklist

### 1. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```bash
# Twitter OAuth 2.0 (REQUIRED)
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here

# OpenAI (REQUIRED for personality analysis)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase (REQUIRED for data persistence)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Alchemy (OPTIONAL - for existing staking feature)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Run these SQL scripts IN ORDER:
   - `supabase/schema.sql` - Creates base tables
   - `supabase/og-update.sql` - Adds OG support columns
   - `supabase/fix-og-columns.sql` - Ensures all columns exist

### 3. Twitter OAuth Setup
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Add these redirect URIs to your app:
   - `http://localhost:3000/api/auth/twitter/callback` (for local testing)
   - `https://www.evaonline.xyz/api/auth/twitter/callback` (for production)

### 4. Install Dependencies & Start
```bash
npm install
npm run dev
```

## 🧪 Testing Scenarios

### Test 1: OG Member Access
1. Visit http://localhost:3000/mirror
2. Click "Login with Twitter"
3. Use @starlordyftw or @EvaOnlineXyz (both are OG)
4. **Expected Results:**
   - ✅ OG welcome popup with fireworks
   - ✅ 11,000 points (1,000 base + 10,000 OG bonus)
   - ✅ Full access to Mirror app
   - ✅ "OG Member" badge in bottom-left

### Test 2: Non-OG Member Denial
1. Visit http://localhost:3000/mirror
2. Login with a non-OG Twitter account
3. **Expected Results:**
   - ✅ "Access Restricted" page
   - ✅ Cannot access Mirror features
   - ✅ Sign Out button works

### Test 3: Personality Analysis Flow
As an OG member:
1. Complete onboarding (name, location, bio)
2. Answer Eva's 5 questions
3. **Expected Results:**
   - ✅ AI-powered responses from Eva
   - ✅ Human score calculation (0-100)
   - ✅ 500 points per question answered
   - ✅ Soul Seed NFT generation
   - ✅ Personality traits revealed

### Test 4: Data Persistence
1. Complete a session
2. Logout and login again
3. **Expected Results:**
   - ✅ Points persist
   - ✅ Profile data saved
   - ✅ Session history maintained
   - ✅ OG status remembered

### Test 5: Existing Site Features
Verify these still work:
1. Homepage: http://localhost:3000
2. Staking: http://localhost:3000/stake
3. Leaderboard: http://localhost:3000/leaderboard
4. Other existing pages

## 🐛 Common Issues & Solutions

### Issue: "Could not find the 'is_og' column"
**Solution:** Run the SQL migrations in Supabase

### Issue: Authentication loops
**Solution:** 
1. Clear browser cookies
2. Check redirect URI matches exactly
3. Ensure .env.local has correct credentials

### Issue: "Access Restricted" for OG member
**Solution:**
1. Verify username is in `src/data/ogList.json`
2. Run in Supabase SQL Editor:
   ```sql
   UPDATE users SET is_og = true WHERE twitter_handle = 'your_handle';
   ```

### Issue: OpenAI errors
**Solution:** Check OPENAI_API_KEY is valid and has credits

### Issue: Points not persisting
**Solution:** Check Supabase connection and tables exist

## 📊 Database Verification

Run these queries in Supabase to verify setup:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check OG users
SELECT twitter_handle, is_og FROM users WHERE is_og = true;

-- Check user profiles
SELECT * FROM user_profiles LIMIT 5;

-- Check session history
SELECT * FROM session_history ORDER BY created_at DESC LIMIT 10;
```

## ✅ Pre-Deployment Checklist

Before going live:
- [ ] All tests pass locally
- [ ] Environment variables ready for production
- [ ] Supabase production instance configured
- [ ] Twitter OAuth production redirect URI added
- [ ] OG list is final (1,158 members)
- [ ] UI colors match brand (dark burgundy)
- [ ] Mobile responsive tested
- [ ] Error handling works

## 🚀 Ready for Production?

Once all tests pass:
1. Create PR from `feature/add-mirror-app` to `main`
2. Deploy to staging first if available
3. Update production environment variables
4. Run SQL migrations on production Supabase
5. Deploy to production
6. Test with real OG account

---

Need help? Check the logs:
- Browser Console (F12)
- Terminal output
- Supabase logs
- Vercel function logs (in production) 
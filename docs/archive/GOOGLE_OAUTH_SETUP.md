# Google OAuth Setup for Vercel Deployment

## Issue: Not Being Redirected After Google Sign-In

If Google shows the account selection but doesn't redirect back to your app, follow these steps.

---

## Step 1: Verify Google Cloud Console Settings

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com
- Select your project

### 2. Navigate to OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**
- Verify your app is configured (Internal or External)

### 3. Configure Authorized Domains
- In OAuth consent screen
- Scroll to **Authorized domains**
- Add: `vercel.app`
- Click **Save**

### 4. Go to Credentials
- Click **APIs & Services** → **Credentials**
- Find your OAuth 2.0 Client ID
- Click to edit

### 5. Add Authorized Redirect URIs

**CRITICAL:** These must match EXACTLY (case-sensitive, no trailing slashes)

Add ALL of these:

```
https://sportstrivia.vercel.app/api/auth/callback/google
https://sportstrivia-c3kfy47fq-sahil-mehtas-projects-b23087d9.vercel.app/api/auth/callback/google
```

**Why both?**
- First URL: Your production domain
- Second URL: Vercel's preview/deployment URL (changes with each deployment)

**Better approach:** Use your custom domain only if you have one

### 6. Save Changes
- Click **Save** at the bottom
- Wait 5 minutes for changes to propagate

---

## Step 2: Verify Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

### Required Variables

```bash
# Must include https://
NEXTAUTH_URL=https://sportstrivia.vercel.app

# From Google Cloud Console → Credentials
GOOGLE_CLIENT_ID=your-app-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret-key

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-32-char-minimum-secret

# From Supabase
DATABASE_URL=postgresql://postgres.[ref]:[password]@...
DIRECT_URL=postgresql://postgres.[ref]:[password]@...
```

### Common Mistakes

❌ `NEXTAUTH_URL=sportstrivia.vercel.app` (missing https://)
❌ `NEXTAUTH_URL=http://sportstrivia.vercel.app` (http instead of https)
❌ Trailing slash: `https://sportstrivia.vercel.app/` (remove the /)
❌ Wrong domain in redirect URI

✅ `NEXTAUTH_URL=https://sportstrivia.vercel.app` (correct!)

---

## Step 3: Test the OAuth Flow

### 1. Redeploy in Vercel
- Go to Deployments tab
- Click **Redeploy** on latest deployment
- OR push a new commit to trigger auto-deploy

### 2. Clear Browser Data
- Clear cookies for your domain
- Clear cache
- Or use Incognito/Private mode

### 3. Test Sign In
1. Go to `https://sportstrivia.vercel.app`
2. Click "Get Started" or "Sign In"
3. Click "Sign in with Google"
4. Select your Google account
5. Should redirect to app homepage or `/quizzes`

### 4. Check Logs
If it still fails:
- Go to Vercel → Deployments → Your deployment
- Click **Function Logs**
- Look for any errors in `/api/auth/callback/google`

---

## Step 4: Debugging

### Check NEXTAUTH_URL is Correct

Add a temporary test endpoint:

**Create:** `app/api/test-env/route.ts`
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  });
}
```

Visit: `https://sportstrivia.vercel.app/api/test-env`

Verify:
- `NEXTAUTH_URL` shows `https://sportstrivia.vercel.app`
- Not `sportstrivia.vercel.app` (missing https)

**Delete this file after testing!**

### Check Database Connection

The OAuth flow requires database access. Verify:
- Database is accessible from Vercel
- `DATABASE_URL` is correct
- Prisma migrations ran successfully

Test database:
```bash
# From Vercel CLI or local with production env
npx prisma db push
```

---

## Common Issues & Solutions

### Issue 1: Infinite Redirect Loop
**Cause:** NEXTAUTH_URL doesn't match actual domain
**Fix:** Ensure NEXTAUTH_URL exactly matches your deployment URL

### Issue 2: "Redirect URI Mismatch"
**Cause:** Google Console redirect URI doesn't match
**Fix:** Copy exact URL from error message, add to Google Console

### Issue 3: "Access Blocked: Authorization Error"
**Cause:** App not verified by Google
**Fix:** 
- For testing: Add test users in OAuth consent screen
- For production: Submit for verification

### Issue 4: Session Not Persisting
**Cause:** Database connection issue
**Fix:** Check DATABASE_URL, run prisma generate

### Issue 5: CORS Errors
**Cause:** Missing trustHost configuration
**Fix:** Already added `trustHost: true` in auth.ts

---

## Recommended Google OAuth Setup

### Authorized JavaScript Origins
```
https://sportstrivia.vercel.app
```

### Authorized Redirect URIs
```
https://sportstrivia.vercel.app/api/auth/callback/google
```

**Note:** Only add the preview URL if you need to test preview deployments.

---

## Quick Checklist

Before testing again:

- [ ] NEXTAUTH_URL includes `https://` protocol
- [ ] NEXTAUTH_URL has no trailing slash
- [ ] Google redirect URI matches exactly
- [ ] Google authorized domain includes `vercel.app`
- [ ] All environment variables saved in Vercel
- [ ] Redeployed after changing env vars
- [ ] Cleared browser cookies/cache
- [ ] Database is accessible
- [ ] Using correct Google Client ID/Secret

---

## If Still Not Working

### Enable Debug Mode Temporarily

In Vercel environment variables, add:
```
NODE_ENV=development
```

This will enable NextAuth debug logs. Check function logs for detailed error messages.

**Remember to remove this after debugging!**

### Check Vercel Function Logs

1. Go to Vercel → Deployments → Latest
2. Click **Function Logs**
3. Filter by `/api/auth/callback/google`
4. Look for error messages

Common errors:
- Database connection timeout
- Invalid session
- Adapter errors
- Missing required fields

---

## Contact Support

If none of these work, share:
1. Vercel function logs for `/api/auth/callback/google`
2. Browser console errors
3. Network tab showing the redirect chain
4. Exact error message from Google (if any)

This will help diagnose the specific issue!


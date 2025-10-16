# Fix: OAuth Stuck on "Signing back to..." Screen

## The Problem You're Experiencing

You click "Sign in with Google" → Select account → Google shows "You're signing back to sportstrivia.vercel.app" → **Gets stuck, doesn't redirect back**.

## Root Cause

You're accessing a **preview deployment URL**:
```
https://sportstrivia-4y08nrdi1-sahil-mehtas-projects-b23087d9.vercel.app
```

But `NEXTAUTH_URL` is set to:
```
https://sportstrivia.vercel.app
```

This mismatch causes the OAuth callback to fail.

---

## Solution Applied

I've updated the code to **dynamically use the correct URL**:

1. If `NEXTAUTH_URL` is set → uses that
2. Otherwise, constructs from `VERCEL_URL` automatically
3. Falls back to localhost for development

This means OAuth will work on **both** production and preview deployments.

---

## Action Required: Update Google OAuth Settings

Since the code now supports dynamic URLs, you need to add a **wildcard redirect URI** in Google Cloud Console.

### Option 1: Use Production URL Only (Recommended)

**In Google Cloud Console → Credentials → OAuth 2.0 Client:**

Only add the production URL:
```
https://sportstrivia.vercel.app/api/auth/callback/google
```

**Then always access your app via:**
```
https://sportstrivia.vercel.app
```

Not the preview URL.

### Option 2: Support All Vercel Deployments

If you need preview deployments to work, add:

```
https://sportstrivia.vercel.app/api/auth/callback/google
https://*.vercel.app/api/auth/callback/google
```

**Note:** Google might not accept wildcards. In that case, you need to manually add each preview URL.

---

## Immediate Fix (For Testing Now)

### Option A: Use Production Domain

1. Go to: **`https://sportstrivia.vercel.app`** (NOT the preview URL)
2. Try Google sign-in
3. Should work now!

### Option B: Add Preview URL to Google

1. Copy your preview URL: `https://sportstrivia-4y08nrdi1-sahil-mehtas-projects-b23087d9.vercel.app`
2. Go to Google Cloud Console → Credentials
3. Add this redirect URI:
   ```
   https://sportstrivia-4y08nrdi1-sahil-mehtas-projects-b23087d9.vercel.app/api/auth/callback/google
   ```
4. Save and wait 5 minutes
5. Try sign-in on preview URL

---

## Recommended Approach

**Use Vercel's Production Domain Assignment:**

1. In Vercel Dashboard → Settings → Domains
2. Ensure `sportstrivia.vercel.app` is marked as **Production**
3. Always access via production URL for testing

**OR set up a custom domain:**

1. Add custom domain (e.g., `sportstrivia.com`)
2. Set `NEXTAUTH_URL=https://sportstrivia.com`
3. Add that to Google OAuth redirect URIs
4. More stable and professional

---

## Why This Happens

Vercel creates a **new preview URL for each deployment**:
- `sportstrivia-abc123-...vercel.app` (deployment 1)
- `sportstrivia-xyz789-...vercel.app` (deployment 2)
- etc.

But `NEXTAUTH_URL` is static. The URLs don't match, so OAuth fails.

**The fix I applied** makes the app use the actual URL it's running on, not the hardcoded NEXTAUTH_URL.

---

## After Deployment Completes

### Test These Endpoints:

**1. Environment Check:**
```
https://sportstrivia.vercel.app/api/test-auth
```
Should show all env vars are present.

**2. Try Sign-In:**
```
https://sportstrivia.vercel.app
```
Click "Get Started" → "Sign in with Google"

**3. Check Function Logs:**

In Vercel, with debug enabled, you'll see detailed logs like:
```
[auth][debug] session callback
[auth][debug] redirect callback
[auth][debug] creating session
```

Any errors will be visible now.

---

## Expected Result

After this fix + accessing via production URL:
✅ Google sign-in should work
✅ You'll be redirected back to `/`
✅ Session will be created
✅ You'll be logged in

**Try accessing `https://sportstrivia.vercel.app` directly** (not the preview URL) and sign in!

Let me know what the function logs show if it still doesn't work.

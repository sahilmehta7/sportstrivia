# Fix: "Invalid URL" Error on Vercel

## Error
```
TypeError: Invalid URL
input: 'sportstrivia.vercel.app'
```

## Root Cause

The `NEXTAUTH_URL` environment variable is missing the `https://` protocol.

NextAuth requires a **full URL** with protocol to construct redirect URLs and session handling.

## Solution

In your Vercel dashboard:

### 1. Go to Project Settings
- Navigate to your project in Vercel
- Click "Settings" tab
- Click "Environment Variables"

### 2. Find NEXTAUTH_URL
- Locate the `NEXTAUTH_URL` variable
- Click "Edit"

### 3. Update the Value

**Current (WRONG):**
```
sportstrivia.vercel.app
```

**Updated (CORRECT):**
```
https://sportstrivia.vercel.app
```

### 4. Redeploy

Option A: Click "Redeploy" in Vercel dashboard
Option B: Make a new commit and push to trigger deployment

## Verification

After fixing, the homepage should load successfully. Check:
- ✅ Homepage loads (`/`)
- ✅ Sign in works (`/auth/signin`)
- ✅ Quizzes page loads (`/quizzes`)
- ✅ No "Invalid URL" errors in logs

## Other Environment Variables to Check

Make sure these are also set correctly:

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# NextAuth (MUST include https://)
NEXTAUTH_URL=https://sportstrivia.vercel.app
NEXTAUTH_SECRET=your-secret-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-key
```

## Generate NEXTAUTH_SECRET

If you need to generate a new secret:

```bash
openssl rand -base64 32
```

Or:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Update Google OAuth Redirect URIs

Don't forget to add your Vercel URL to Google Cloud Console:

**Authorized redirect URIs:**
```
https://sportstrivia.vercel.app/api/auth/callback/google
```

---

## Quick Fix Checklist

- [ ] Update `NEXTAUTH_URL` to include `https://`
- [ ] Verify all environment variables are set
- [ ] Redeploy the application
- [ ] Check deployment logs for success
- [ ] Test homepage loads
- [ ] Test sign in with Google
- [ ] Verify database connection works

After these steps, your deployment should be fully functional! 🚀


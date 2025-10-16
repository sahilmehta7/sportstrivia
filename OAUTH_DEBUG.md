# OAuth Not Redirecting - Debug Guide

## The Problem

You're stuck at Google's "You're signing back to sportstrivia.vercel.app" screen and not getting redirected back to the app.

This typically means the OAuth callback is **failing silently** - most likely due to a database issue.

---

## Most Likely Cause: Database Schema Missing

### Did you run migrations on production database?

The NextAuth Prisma adapter needs these tables to exist:
- `User`
- `Account`
- `Session`
- `VerificationToken`

If these don't exist in your **production database**, the OAuth flow will fail.

### Quick Check

1. Open your Supabase dashboard
2. Go to Table Editor
3. Check if you see these tables:
   - User
   - Account
   - Session
   - VerificationToken
   - Quiz
   - Question
   - etc.

**If tables are missing, that's your problem!**

---

## Solution: Run Database Migrations

### Option 1: From Local Machine (Recommended)

1. **Update your local `.env` to point to production:**

```bash
# Temporarily point to production database
DATABASE_URL="your-production-database-url-from-vercel"
DIRECT_URL="your-production-direct-url-from-vercel"
```

2. **Run migrations:**

```bash
npx prisma db push
```

3. **Verify tables created:**

```bash
npx prisma studio
# Opens GUI to view database
```

4. **Restore local `.env`:**

```bash
# Point back to local database
DATABASE_URL="postgresql://..."
```

### Option 2: Using Vercel CLI

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Login:**

```bash
vercel login
```

3. **Link project:**

```bash
vercel link
```

4. **Pull environment variables:**

```bash
vercel env pull .env.production
```

5. **Run migrations:**

```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2-) npx prisma db push
```

### Option 3: Quick Database Check Script

Run this locally (pointing to production DB):

```bash
# In package.json, add:
"check-db": "ts-node scripts/check-db.ts"

# Then run:
npm run check-db
```

---

## Verify Environment Variables

### In Vercel Dashboard

Go to Settings → Environment Variables and verify:

```bash
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# MUST include https://
NEXTAUTH_URL=https://sportstrivia.vercel.app

# At least 32 characters
NEXTAUTH_SECRET=abc123...longstring...xyz789

GOOGLE_CLIENT_ID=12345.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123
```

### Test Environment Variables

Create a test endpoint to verify they're loaded:

**app/api/debug/route.ts:**
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasDatabase: !!process.env.DATABASE_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL, // Remove after testing
  });
}
```

Visit: `https://sportstrivia.vercel.app/api/debug`

**All should be `true` and `nextAuthUrl` should show `https://sportstrivia.vercel.app`**

---

## Check Vercel Function Logs

### Step by Step:

1. **Open Vercel Dashboard** → Your project
2. **Click "Deployments"**
3. **Click your latest deployment**
4. **Click "Functions"** tab
5. **Click "View Function Logs"**

### During Sign-In Attempt:

6. **Start sign in with Google**
7. **Watch the logs in real-time**
8. **Look for errors in:**
   - `/api/auth/signin/google`
   - `/api/auth/callback/google`

### Common Error Messages:

**Database Errors:**
```
relation "User" does not exist
relation "Account" does not exist
P2021: The table `User` does not exist
```
→ **Fix:** Run `npx prisma db push`

**Connection Errors:**
```
Can't reach database server
Connection timeout
```
→ **Fix:** Check DATABASE_URL, whitelist Vercel IPs in Supabase

**Auth Errors:**
```
Adapter error
Invalid session
```
→ **Fix:** Check Prisma adapter version compatibility

---

## Test Database Connection

Create a simple test endpoint:

**app/api/test-db/route.ts:**
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "connected",
      userCount,
      message: "Database is accessible",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

Visit: `https://sportstrivia.vercel.app/api/test-db`

**Expected:** `{"status":"connected","userCount":6}`
**If error:** Shows database connection issue

---

## Supabase-Specific Checks

### 1. Connection Pooling

Make sure you're using the **pooler** URL, not direct:

```bash
# ✅ Correct (has "pooler")
DATABASE_URL=postgresql://postgres...@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# ❌ Wrong (direct connection)
DATABASE_URL=postgresql://postgres...@aws-1-ap-south-1.supabase.com:5432/postgres
```

### 2. Password Special Characters

If your password has special characters, they might need URL encoding:

```bash
# If password is: p@ss!word#123
# URL encode it: p%40ss%21word%23123
```

### 3. IPv6 Issues

Vercel uses IPv6. Make sure Supabase allows it:
- Go to Supabase → Settings → Database
- Check "Allow connections from IPv6"

---

## Nuclear Option: Simplify to Debug

### Temporarily switch to JWT sessions

In `lib/auth.ts`:

```typescript
session: {
  strategy: "jwt", // Changed from "database"
},
```

This removes the database dependency from OAuth flow.

**If this works:** The issue is definitely database-related
**If this fails:** The issue is with OAuth configuration

**Remember to switch back to "database" after debugging!**

---

## Check Prisma Version Compatibility

Ensure you're using compatible versions:

```bash
npm list @prisma/client @auth/prisma-adapter next-auth
```

Expected:
- `@prisma/client`: ^6.17.1
- `@auth/prisma-adapter`: ^2.x
- `next-auth`: ^5.x (beta)

---

## My Best Guess

Based on the symptoms, I strongly suspect:

**You haven't run `npx prisma db push` on your production database yet.**

The tables don't exist, so NextAuth's adapter can't write the session/account data, causing the OAuth flow to hang.

### To Fix:

1. **Point to production DB:**
   - Copy `DATABASE_URL` from Vercel env vars
   - Update local `.env` file temporarily

2. **Run migrations:**
   ```bash
   npx prisma db push
   ```

3. **Verify in Supabase:**
   - Open Supabase dashboard
   - Check Table Editor
   - Should see 20+ tables

4. **Redeploy in Vercel**

5. **Test sign-in**

---

## Need More Help?

Share with me:
1. **Vercel function logs** for `/api/auth/callback/google`
2. **Screenshot** of Supabase Table Editor (to see if tables exist)
3. **Output** of the `/api/test-db` endpoint
4. **Exact error message** from browser console (F12)

This will help pinpoint the exact issue!


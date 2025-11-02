# Admin Access Troubleshooting Guide

## Issue
After switching from database to JWT session strategy, admin users cannot access `/admin` routes and are redirected to sign-in.

## Root Cause
The app now uses JWT sessions instead of database sessions. Existing browser sessions have database-backed cookies that are incompatible with the new JWT implementation. Admin access requires the user's role to be stored in the JWT token.

## Solution

### Step 1: Sign Out Completely
1. Clear all browser cookies for your localhost domain
2. Or manually sign out if you're currently logged in

### Step 2: Sign In Again
1. Go to `http://localhost:3000/auth/signin`
2. Sign in with your admin Google account
3. The JWT token will now contain your admin role

### Step 3: Access Admin Panel
1. Navigate to `http://localhost:3000/admin`
2. You should now have access

## Verification

To verify your user has admin privileges:

1. Check the database:
```bash
npx prisma studio
# Look for your user email and check the `role` field is "ADMIN"
```

2. Check the JWT token:
After signing in, inspect your browser's Application/Storage tab:
- Look for a cookie named `next-auth.session-token` (dev) or `__Secure-next-auth.session-token` (prod)
- The JWT contains your role in the payload

## Technical Details

### How Admin Access Works Now

1. **JWT Strategy**: Sessions are stored in encrypted JWT cookies instead of the database
2. **Role in Token**: During sign-in, the `jwt` callback fetches your role from the database and stores it in the JWT
3. **Middleware Check**: The middleware reads the role from the JWT token via `session.user.role`
4. **Edge Compatibility**: JWT sessions work in Edge runtime, allowing middleware to check roles without database access

### Files Involved

- `lib/auth.ts`: Main NextAuth config with JWT callbacks that fetch/store roles
- `auth.config.ts`: Edge-compatible config for middleware
- `middleware.ts`: Checks `session.user.role !== 'ADMIN'` for admin routes
- `prisma/schema.prisma`: UserRole enum with USER and ADMIN values

## Troubleshooting

### Still Can't Access Admin After Signing In

1. **Check your email**: Make sure you're signing in with an account that has `role: 'ADMIN'` in the database
2. **Clear cache**: Run `rm -rf .next` and restart the dev server
3. **Check logs**: Look for JWT callback execution in the console
4. **Verify seed data**: Run `npm run prisma:seed` to ensure admin user exists

### Create Admin User Manually

If the admin user doesn't exist in your database:

```sql
-- Connect to your database and run:
INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'your-email@gmail.com', 'Admin User', 'ADMIN', NOW(), NOW());
```

Or use Prisma Studio:
```bash
npx prisma studio
# Navigate to User table and create/update a user with role: ADMIN
```

### Common Issues

**"Session is null"**
- You're not signed in. Complete the OAuth flow.

**"Role is undefined"** 
- JWT callback didn't run. Sign out and sign in again to trigger it.

**"Incorrect role"**
- Database role doesn't match expectations. Verify in database and re-sign in.

## Testing in Production

For Vercel deployment:

1. All environment variables must be set (especially `AUTH_SECRET` or `NEXTAUTH_SECRET`)
2. Admin users must sign in after the deployment to get JWT tokens with roles
3. Middleware will work in Edge runtime as expected

## Migration Notes

- **Breaking Change**: All existing sessions are invalidated after this migration
- **User Impact**: All users must sign in again once
- **Benefit**: Better performance with Edge-compatible middleware and no database queries on every request


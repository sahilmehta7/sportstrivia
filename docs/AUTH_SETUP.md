# Authentication Setup Guide

## 🎉 Authentication Pages Created

### 1. Sign-In Page
**URL**: http://localhost:3200/auth/signin

Features:
- Clean, minimal design with Sports Trivia branding
- Google OAuth sign-in button
- Server action for authentication
- Redirects to homepage after successful sign-in

### 2. Error Page
**URL**: http://localhost:3200/auth/error

Handles authentication errors:
- Configuration errors (missing OAuth credentials)
- Access denied
- Verification token issues
- Generic authentication failures

### 3. Unauthorized Page
**URL**: http://localhost:3200/auth/unauthorized

Displays when:
- User tries to access admin panel without ADMIN role
- Non-authenticated users try to access protected routes

### 4. Updated Homepage
**URL**: http://localhost:3200

- Shows "Get Started" button for non-authenticated users
- Shows "Browse Quizzes" and "Admin Panel" for authenticated users
- Beautiful landing page with Sports Trivia branding

## 🔐 How to Sign In

### Option 1: Via Homepage
1. Go to http://localhost:3200
2. Click "Get Started"
3. Click "Continue with Google"
4. Authorize the application

### Option 2: Direct Sign-In
1. Go to http://localhost:3200/auth/signin
2. Click "Continue with Google"
3. Authorize the application

## ⚠️ Important: Google OAuth Setup

Before you can sign in, you MUST configure Google OAuth:

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3200/api/auth/callback/google`
5. Copy Client ID and Client Secret

### 2. Update .env.local

```env
# Add these to your .env.local file
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

### 3. Restart the Server

```bash
# Stop the current server (Ctrl+C if running)
npm run dev
```

## 🛠️ Making Yourself an Admin

After signing in for the first time:

### Option 1: Using Prisma Studio (Recommended)
```bash
npx prisma studio
```
1. Open the User table
2. Find your user by email
3. Change `role` from `USER` to `ADMIN`
4. Save

### Option 2: Using SQL
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@gmail.com';
```

## 🚀 Testing the Flow

1. **Homepage (Not Signed In)**:
   - Visit http://localhost:3200
   - Should see "Get Started" button

2. **Sign In**:
   - Click "Get Started"
   - Click "Continue with Google"
   - Authorize the app

3. **Homepage (Signed In)**:
   - Should now see "Browse Quizzes" and "Admin Panel" buttons
   - Your name/avatar should appear (if you add a navbar)

4. **Access Admin Panel**:
   - Click "Admin Panel" or go to http://localhost:3200/admin
   - If not admin: redirected to /auth/unauthorized
   - If admin: see the dashboard

## 📁 Created Files

```
app/
├── auth/
│   ├── signin/
│   │   └── page.tsx          # Sign-in page with Google OAuth
│   ├── error/
│   │   └── page.tsx          # Auth error page
│   └── unauthorized/
│       └── page.tsx          # Access denied page
├── page.tsx                  # Updated homepage with auth state
└── admin/
    └── layout.tsx           # Updated to redirect instead of error
```

## 🎨 UI Features

All pages use:
- Shadcn UI components (Card, Button, etc.)
- Consistent branding with Trophy icon
- Gradient backgrounds
- Responsive design
- Clean, minimal aesthetic

## 🔒 Security Features

- Server-side authentication checks
- Proper redirects for unauthorized access
- Role-based access control (ADMIN vs USER)
- Secure session management with NextAuth v5
- Protected API routes via auth helpers

## 🐛 Troubleshooting

### "Configuration Error"
- Google OAuth credentials not set
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
- Restart the server after adding credentials

### "Access Denied"
- User role is not ADMIN
- Update role in database using Prisma Studio

### "Sign-in not working"
- Check if Google OAuth redirect URI is correct
- Ensure Google+ API is enabled
- Check .env.local variables are correct

## 📝 Next Steps

Now that authentication is working, you can:

1. ✅ Sign in with Google OAuth
2. ✅ Make yourself admin
3. ✅ Access the admin panel
4. 🚀 Start building admin forms (quiz creation, etc.)
5. 🚀 Build user-facing quiz pages

The backend is ready - time to build the UI! 🎯


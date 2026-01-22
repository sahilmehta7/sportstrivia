# Environment Variables Setup

This document lists all required and optional environment variables for the Sports Trivia application.

## Required Variables

### Database
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sportstrivia"
```

### NextAuth
```bash
NEXTAUTH_URL="http://localhost:3200"
NEXTAUTH_SECRET="your-secret-key-here"
```
Generate secret: `openssl rand -base64 32`

## Optional Variables

### Google OAuth (For Social Login)
```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```
Get credentials from: https://console.cloud.google.com/

### OpenAI API (For AI Quiz Generator)
```bash
OPENAI_API_KEY="sk-your-openai-api-key-here"
```
Get API key from: https://platform.openai.com/api-keys

**Note:** The AI Quiz Generator feature requires this key. Without it:
- App will build and run normally ✅
- AI Quiz Generator will show a configuration warning ⚠️
- All other features work normally ✅

### Gemini API (For AI Image Generation)
```bash
GEMINI_API_KEY="your-gemini-api-key-here"
```
Get API key from: https://aistudio.google.com/app/apikey

**Note:** AI Cover Image generation requires this key. It replaces the previous DALL-E-3 implementation.


### Supabase Storage (For Image Uploads)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```
Get credentials from: Supabase Dashboard → Settings → API

**Note:** Cover image upload requires Supabase. Without it:
- App will build and run normally ✅
- You can still use image URLs ✅
- File upload will show configuration warning ⚠️

**Setup Required:**
1. Create Supabase project
2. Create `quiz-images` storage bucket
3. Set bucket to Public
4. Configure storage policies (see docs/COVER_IMAGE_UPLOAD.md)

### Push Notifications & Email Digests
```bash
NEXT_PUBLIC_PUSH_PUBLIC_KEY="generated-vapid-public-key"
PUSH_PUBLIC_KEY="generated-vapid-public-key"
PUSH_PRIVATE_KEY="generated-vapid-private-key"
PUSH_SUBJECT="mailto:support@sportstrivia.in"
RESEND_API_KEY="your-resend-api-key"
NOTIFICATION_DIGEST_FROM="notifications@sportstrivia.in"
NOTIFICATION_DIGEST_REPLY_TO="support@sportstrivia.in"
NOTIFICATIONS_PUSH_ENABLED="true"
```

- Generate VAPID keys with `npm run notifications:vapid`
- `PUSH_SUBJECT` must be a `mailto:` or `https://` URL per Web Push spec
- `NOTIFICATION_DIGEST_FROM` should match a verified sender in Resend

## Setting Up Your .env File

1. Copy the template above
2. Create a `.env` file in the project root
3. Add your actual values
4. Never commit `.env` to git (already in `.gitignore`)

## Verifying Setup

After adding environment variables:
1. Restart your development server
2. Check the admin panel
3. Navigate to "AI Quiz Generator"
4. If configured correctly, no warning will appear

## Production Deployment

For Vercel/production environments, add these variables in:
- Vercel Dashboard → Project → Settings → Environment Variables
- Or your hosting provider's environment configuration

## Security Notes

- ✅ Keep `.env` file private
- ✅ Never commit secrets to git
- ✅ Rotate API keys regularly
- ✅ Use different keys for dev/prod environments

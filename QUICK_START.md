# Quick Start Guide

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- Google Cloud Console account (for OAuth)

## Step 1: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Get your connection string:
   - Go to Project Settings > Database
   - Copy the "Connection string" (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password

3. Create a storage bucket:
   - Go to Storage
   - Create a new bucket named `quiz-media`
   - Set it to public or configure policies as needed

4. Note down these values:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon/Public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service role key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)

2. Create a new project or select existing one

3. Enable Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/callback/google` (development)
     - Add production URL when deploying

5. Note down:
   - Client ID (GOOGLE_CLIENT_ID)
   - Client Secret (GOOGLE_CLIENT_SECRET)

## Step 3: Environment Variables

1. Create `.env.local` in the project root:

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

2. Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Database Setup

1. Generate Prisma Client:
```bash
npx prisma generate
```

2. Push schema to database:
```bash
npx prisma db push
```

Or create and run migrations:
```bash
npx prisma migrate dev --name init
```

3. Seed the database with sample data:
```bash
npm run prisma:seed
```

This creates:
- Admin user: `admin@sportstrivia.com`
- Regular user: `user@sportstrivia.com`
- Sample topic hierarchy (Sports > Cricket > Batting/Bowling, Basketball > NBA)
- Sample quiz: "Cricket Basics Quiz" with 3 questions
- Sample badges

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Access Admin Panel

1. You need to sign in with Google OAuth first
2. After signing in, manually update your user role in the database:

```bash
npx prisma studio
```

Or using SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@gmail.com';
```

3. Access admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

## Useful Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Create and apply migration
npx prisma db push       # Push schema without migration
npm run prisma:seed      # Seed database
```

### Testing
```bash
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
```

## Troubleshooting

### "Database connection failed"
- Check your DATABASE_URL is correct
- Ensure Supabase project is running
- Check if your IP is whitelisted in Supabase (if required)

### "NextAuth configuration error"
- Verify NEXTAUTH_URL matches your dev server URL
- Check NEXTAUTH_SECRET is set
- Ensure Google OAuth redirect URI is correct

### "Google OAuth not working"
- Verify Google Cloud Console OAuth settings
- Check redirect URIs are correctly configured
- Ensure Google+ API is enabled

### "Prisma Client not found"
- Run `npx prisma generate`
- Restart your dev server

### "Cannot access admin panel"
- Ensure you're signed in
- Check your user role is set to ADMIN in database
- Clear browser cache and cookies

## Next Steps

After setup is complete:

1. **Explore the Admin Panel**:
   - View dashboard at `/admin/dashboard`
   - Browse quizzes at `/admin/quizzes`
   - Check questions at `/admin/questions`

2. **Create Your First Quiz**:
   - Use the JSON import feature
   - Or build one using the forms (when implemented)

3. **Test the Quiz Flow**:
   - View public quizzes at `/api/quizzes`
   - Start a quiz attempt using API

4. **Customize**:
   - Update theme colors in `tailwind.config.ts`
   - Modify global styles in `app/globals.css`
   - Add custom branding in admin layout

## Sample JSON Import

Save this as `sample-quiz.json`:

```json
{
  "title": "NBA Champions Quiz",
  "sport": "Basketball",
  "difficulty": "medium",
  "duration": 300,
  "passingScore": 70,
  "seo": {
    "title": "NBA Champions Quiz - Test Your Basketball Knowledge",
    "description": "How well do you know NBA championship history?",
    "keywords": ["nba", "basketball", "champions", "quiz"]
  },
  "questions": [
    {
      "text": "Which team won the 2023 NBA Championship?",
      "difficulty": "easy",
      "topicId": "get-from-database",
      "answers": [
        { "text": "Denver Nuggets", "isCorrect": true },
        { "text": "Miami Heat", "isCorrect": false },
        { "text": "Boston Celtics", "isCorrect": false },
        { "text": "Los Angeles Lakers", "isCorrect": false }
      ]
    }
  ]
}
```

Note: You'll need to get a valid `topicId` from your database first.

## Support

- Check `IMPLEMENTATION_STATUS.md` for what's implemented
- Review `README.md` for full documentation
- Open an issue for bugs or questions

## Production Deployment

When ready to deploy:

1. Update environment variables for production
2. Set proper NEXTAUTH_URL
3. Configure production database
4. Run migrations: `npx prisma migrate deploy`
5. Build: `npm run build`
6. Deploy to Vercel, Railway, or your preferred platform

For detailed deployment instructions, see the deployment section in README.md.


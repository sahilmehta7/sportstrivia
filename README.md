# Sports Trivia Platform

A comprehensive sports trivia quiz platform built with Next.js 15, Prisma, and Supabase.

## Features

- 🎯 **Quiz System**: Multiple quiz types (fixed, topic-based random, pool-based random)
- 👥 **Social Features**: Friend challenges, leaderboards, badges
- 📊 **Analytics**: Detailed user statistics and performance tracking
- 🔐 **Authentication**: Google OAuth with NextAuth
- 👔 **Admin Panel**: Complete content management system
- 📱 **Responsive**: Mobile-first design with Shadcn UI
- 🎨 **SEO Optimized**: Configurable SEO metadata for all quizzes

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth v5 with Google OAuth
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sportstrivia-2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sportstrivia"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Seed the database:
```bash
npm run prisma:seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses a comprehensive database schema with the following key models:

- **User**: User accounts with authentication and profile data
- **Quiz**: Quiz configurations with multiple selection modes
- **Question**: Questions with media support and topic tagging
- **Topic**: Hierarchical topic tree for categorization
- **QuizAttempt**: User quiz attempts with scoring
- **Friend**: Friend relationships
- **Challenge**: Quiz challenges between users
- **Badge**: Achievement system
- **QuizLeaderboard**: Quiz-specific leaderboards
- **UserTopicStats**: Per-topic performance tracking

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database with sample data
```

## Project Structure

```
sportstrivia-2/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth routes
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── quizzes/       # Quiz management
│   │   ├── questions/     # Question management
│   │   └── attempts/      # Quiz attempts
│   ├── admin/             # Admin panel pages
│   └── quiz/              # User-facing quiz pages
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── admin/            # Admin-specific components
│   └── shared/           # Shared components
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── validations/      # Zod schemas
│   └── seo-utils.ts      # SEO utilities
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── __tests__/            # Test files
```

## API Endpoints

### Public Endpoints
- `GET /api/quizzes` - List published quizzes
- `GET /api/quizzes/[slug]` - Get quiz details

### Protected Endpoints
- `POST /api/attempts` - Start quiz attempt
- `PUT /api/attempts/[id]/answer` - Submit answer
- `GET /api/users/me` - Get current user profile

### Admin Endpoints
- `POST /api/admin/quizzes` - Create quiz
- `PUT /api/admin/quizzes/[id]` - Update quiz
- `POST /api/admin/quizzes/import` - Bulk import from JSON
- `POST /api/admin/questions` - Create question

## Development Workflow

### Creating a New Quiz

1. Use the admin panel at `/admin/quizzes/new`
2. Fill in quiz details and SEO metadata
3. Choose question selection mode (Fixed, Topic Random, or Pool Random)
4. Configure scoring settings
5. Add questions or import from JSON
6. Publish quiz

### JSON Import Format

```json
{
  "title": "Quiz Title",
  "slug": "quiz-slug",
  "sport": "Cricket",
  "difficulty": "medium",
  "duration": 600,
  "passingScore": 70,
  "seo": {
    "title": "SEO Title",
    "description": "SEO Description",
    "keywords": ["cricket", "trivia"]
  },
  "questions": [
    {
      "text": "Question text?",
      "difficulty": "easy",
      "topicId": "topic-id",
      "hint": "Optional hint",
      "explanation": "Answer explanation",
      "answers": [
        { "text": "Correct answer", "isCorrect": true },
        { "text": "Wrong answer", "isCorrect": false }
      ]
    }
  ]
}
```

## Testing

Run tests with:
```bash
npm test
```

Tests are located in `__tests__/` directory with separate folders for API and component tests.

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database Migrations

```bash
npx prisma migrate deploy
```

## Contributing

1. Create a feature branch
2. Make changes
3. Write/update tests
4. Submit pull request

## License

MIT

## Support

For questions or issues, please open a GitHub issue.


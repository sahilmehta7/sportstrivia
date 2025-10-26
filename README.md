# Sports Trivia Platform

A comprehensive sports trivia quiz platform built with Next.js 15, Prisma, and Supabase.

## 🎯 Current Status

**✅ BACKEND COMPLETE** - Production-ready API with 22+ endpoints  
**✅ ADMIN PANEL COMPLETE** - Full content management system  
**🔄 FRONTEND IN PROGRESS** - Landing page complete, user interfaces in development  

## Features

### ✅ Implemented & Ready
- 🎯 **Quiz System**: Multiple quiz types (fixed, topic-based random, pool-based random)
- 🔐 **Authentication**: Google OAuth with NextAuth v5
- 👔 **Admin Panel**: Complete CRUD operations for quizzes, questions, topics
- 📊 **API Backend**: 22+ REST endpoints with advanced filtering
- 🎨 **SEO Optimized**: Configurable SEO metadata for all quizzes
- 📱 **Responsive Design**: Mobile-first with Shadcn UI

### 🔄 In Development
- 👥 **Social Features**: Friend challenges, leaderboards, badges (API complete, UI pending)
- 📊 **User Analytics**: Detailed statistics and performance tracking (API complete, UI pending)
- 🎮 **Quiz Interface**: Complete quiz taking experience (components exist, integration pending)

### 🚀 Ready to Build
- 👤 **User Dashboard**: Profile management and statistics
- 🏆 **Leaderboards**: Global, topic-specific, and friend leaderboards
- 👥 **Social UI**: Friend management and challenge interfaces

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
│   ├── api/               # ✅ 22+ API routes
│   │   ├── auth/          # NextAuth v5 routes
│   │   ├── admin/         # Admin CRUD endpoints
│   │   ├── quizzes/       # Public quiz API
│   │   ├── attempts/      # Quiz attempt system
│   │   ├── friends/       # Social features
│   │   ├── challenges/    # Challenge system
│   │   ├── leaderboards/  # Leaderboard APIs
│   │   └── notifications/ # Notification system
│   ├── admin/             # ✅ Complete admin panel
│   │   ├── dashboard/     # Analytics dashboard
│   │   ├── quizzes/       # Quiz management
│   │   ├── questions/     # Question management
│   │   └── topics/        # Topic management
│   ├── auth/              # ✅ Authentication pages
│   ├── showcase/          # 🔄 UI component showcase
│   └── page.tsx           # ✅ Landing page
├── components/            # React components
│   ├── ui/               # ✅ Shadcn UI components
│   ├── admin/            # ✅ Admin panel components
│   ├── home/             # ✅ Landing page components
│   ├── quiz/             # 🔄 Quiz interface components
│   ├── friends/          # 🔄 Social UI components
│   └── shared/           # ✅ Shared components
├── lib/                   # Utility libraries
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── validations/      # Zod schemas
│   └── services/         # Business logic services
├── prisma/               # Database schema
│   ├── schema.prisma     # ✅ 23 models
│   └── seed.ts           # Sample data
└── docs/                 # ✅ 15+ documentation files
```

## API Endpoints

### ✅ Public Endpoints (No Auth Required)
- `GET /api/quizzes` - List published quizzes with advanced filtering
- `GET /api/quizzes/[slug]` - Get quiz details and availability
- `GET /api/topics` - List all topics (hierarchical)
- `GET /api/badges` - List available badges
- `GET /api/leaderboards/global` - Global leaderboard
- `GET /api/users/[id]` - Public user profiles

### 🔐 Protected Endpoints (Auth Required)
- `POST /api/attempts` - Start quiz attempt
- `PUT /api/attempts/[id]/answer` - Submit answer
- `POST /api/attempts/[id]/complete` - Complete quiz
- `GET /api/users/me` - Get current user profile
- `GET /api/users/me/stats` - Get user statistics
- `GET /api/friends` - Manage friends and requests
- `POST /api/friends` - Send friend request
- `GET /api/challenges` - List challenges
- `POST /api/challenges` - Create challenge
- `GET /api/notifications` - Get notifications

### 👑 Admin Endpoints (Admin Only)
- `GET /api/admin/quizzes` - List all quizzes
- `POST /api/admin/quizzes` - Create quiz
- `PUT /api/admin/quizzes/[id]` - Update quiz
- `POST /api/admin/quizzes/import` - Bulk import from JSON
- `GET /api/admin/questions` - List all questions
- `POST /api/admin/questions` - Create question
- `GET /api/admin/topics` - Manage topics
- `GET /api/admin/users` - User management

## What's Ready to Use

### ✅ Admin Panel (Fully Functional)
- **Dashboard**: View platform statistics and recent activity
- **Quiz Management**: Create, edit, delete quizzes with full configuration
- **Question Management**: Create questions with multiple answers, hints, explanations
- **Topic Management**: Hierarchical topic organization
- **Bulk Import**: Import quizzes from JSON format
- **User Management**: View and manage user accounts

### ✅ API Backend (Production Ready)
- **Quiz API**: Advanced filtering, sorting, and search
- **Social Features**: Friends, challenges, leaderboards (API complete)
- **User Management**: Profiles, statistics, badges
- **Content Management**: Full CRUD operations
- **Authentication**: Secure Google OAuth integration

### 🔄 User Interface (In Development)
- **Landing Page**: ✅ Complete with hero, featured quizzes, topics
- **Admin Panel**: ✅ Fully functional
- **Quiz Taking**: 🔄 Components exist, integration pending
- **Social Features**: 🔄 API ready, UI components exist
- **User Dashboard**: ❌ Not implemented

## Development Workflow

### For Admins (Ready Now)
1. Sign in at `/auth/signin`
2. Access admin panel at `/admin`
3. Create topics, questions, and quizzes
4. Import content via JSON
5. Manage platform content

### For Users (In Development)
1. Browse quizzes on landing page
2. Sign in with Google OAuth
3. Take quizzes (interface being built)
4. View results and statistics (pending)
5. Manage friends and challenges (pending)

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

## Next Steps

### Phase 1: Complete User Interface (Recommended)
1. **Quiz Taking Interface**: Complete the quiz playing experience
2. **User Dashboard**: Profile management and statistics
3. **Results Pages**: Score display and answer review
4. **Social UI**: Friend management and challenge interfaces

### Phase 2: Enhanced Features
1. **Leaderboards**: Global, topic-specific, and friend leaderboards
2. **Badge System**: Achievement tracking and display
3. **Notifications**: Real-time notification system
4. **Analytics**: User engagement and performance metrics

### Phase 3: Advanced Features
1. **Mobile App**: React Native or PWA
2. **Real-time Features**: Live challenges and multiplayer
3. **AI Integration**: Smart quiz recommendations
4. **Content Moderation**: Advanced reporting and review system

## Testing

Run tests with:
```bash
npm test
```

Tests are located in `__tests__/` directory with separate folders for API and component tests.

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   ```env
   DATABASE_URL="your-supabase-url"
   NEXTAUTH_SECRET="your-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```
4. Deploy

### Database Migrations

```bash
npx prisma migrate deploy
```

## Documentation

Comprehensive documentation is available in the `/docs` folder:
- `API_REFERENCE.md` - Complete API documentation
- `ADMIN_PANEL_COMPLETE.md` - Admin panel guide
- `QUICK_START.md` - Setup instructions
- `AUTH_SETUP.md` - Authentication configuration

## License

MIT

## Support

For questions or issues, please open a GitHub issue or check the documentation in `/docs`.


# Developer Quick Reference - Sports Trivia Platform

**Last Updated**: January 2025  
**Status**: Backend Complete, Frontend In Development

---

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Clone and install
git clone <repository-url>
cd sportstrivia-2
npm install

# Environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Database setup
npx prisma generate
npx prisma migrate dev
npm run prisma:seed

# Start development
npm run dev
```

### 2. Access Points
- **Landing Page**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Sign In**: http://localhost:3000/auth/signin
- **API Docs**: See `/docs/API_REFERENCE.md`

---

## 📁 Project Structure

```
sportstrivia-2/
├── app/                    # Next.js App Router
│   ├── api/               # ✅ 22+ API endpoints
│   ├── admin/             # ✅ Complete admin panel
│   ├── auth/              # ✅ Authentication pages
│   └── page.tsx           # ✅ Landing page
├── components/            # React components
│   ├── ui/               # ✅ Shadcn UI components
│   ├── admin/            # ✅ Admin components
│   ├── home/             # ✅ Landing page components
│   ├── quiz/             # 🔄 Quiz interface components
│   ├── friends/          # 🔄 Social components
│   └── shared/           # ✅ Shared components
├── lib/                   # Utilities and services
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── validations/      # Zod schemas
│   └── services/         # Business logic
├── prisma/               # Database
│   ├── schema.prisma     # ✅ 23 models
│   └── seed.ts           # Sample data
└── docs/                 # ✅ Documentation
```

---

## 🔧 Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.5 | React framework |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.7.3 | Type safety |
| **Prisma** | 6.2.1 | Database ORM |
| **NextAuth** | 5.0.0-beta.25 | Authentication |
| **Tailwind CSS** | 3.4.17 | Styling |
| **Shadcn/ui** | Latest | UI components |
| **Zod** | 3.25.76 | Validation |
| **Supabase** | 2.75.0 | Database hosting |

---

## 🎯 Current Status

### ✅ Production Ready
- **Backend API**: 22+ endpoints with full CRUD
- **Admin Panel**: Complete content management
- **Authentication**: Google OAuth integration
- **Database**: 23 models with relationships
- **Landing Page**: Professional marketing site

### 🔄 In Development
- **Quiz Taking Interface**: Components exist, integration pending
- **User Dashboard**: Profile management and statistics
- **Social Features**: API complete, UI components exist
- **Content Discovery**: Advanced browsing and search

### ❌ Not Implemented
- **User-Facing Social UI**: Friend management, challenges
- **Leaderboard Pages**: Global and friend leaderboards
- **Notification Center**: Real-time notification management
- **Badge System UI**: Achievement tracking and display

---

## 🔌 API Quick Reference

### Public Endpoints (No Auth)
```bash
# List quizzes with filters
GET /api/quizzes?featured=true&sortBy=rating&limit=6

# Get quiz details
GET /api/quizzes/cricket-basics

# List topics
GET /api/topics

# Global leaderboard
GET /api/leaderboards/global
```

### Protected Endpoints (Auth Required)
```bash
# Start quiz attempt
POST /api/attempts
{
  "quizId": "quiz-id",
  "isPracticeMode": false
}

# Submit answer
PUT /api/attempts/attempt-id/answer
{
  "questionId": "question-id",
  "answerId": "answer-id",
  "timeSpent": 15
}

# Complete quiz
POST /api/attempts/attempt-id/complete

# Get user profile
GET /api/users/me

# Send friend request
POST /api/friends
{
  "friendEmail": "friend@example.com"
}
```

### Admin Endpoints (Admin Required)
```bash
# Create quiz
POST /api/admin/quizzes
{
  "title": "Quiz Title",
  "slug": "quiz-slug",
  "sport": "Cricket",
  "difficulty": "MEDIUM"
}

# Create question
POST /api/admin/questions
{
  "questionText": "Question?",
  "topicId": "topic-id",
  "difficulty": "EASY",
  "answers": [
    { "text": "Correct", "isCorrect": true },
    { "text": "Wrong", "isCorrect": false }
  ]
}

# Bulk import
POST /api/admin/quizzes/import
{
  "title": "Quiz Title",
  "questions": [...]
}
```

---

## 🎨 UI Components

### Available Components
```typescript
// Admin components
<AdminShell />           // Admin layout
<QuestionEditor />       // Question form
<PageHeader />           // Page headers

// Home components
<LandingPage />          // Main landing page
<HeroSection />          // Hero section
<FeaturedQuizzes />      // Quiz showcase
<PopularTopics />        // Topic showcase

// Quiz components
<ShowcaseQuizCard />     // Quiz card
<ShowcaseQuizDetail />   // Quiz details
<ShowcaseQuizResults />  // Results display

// Social components
<FriendCard />           // Friend display
<ChallengeCard />        // Challenge display
<Leaderboard />          // Leaderboard

// Shared components
<UserAvatar />           // User avatar
<LoadingSpinner />       // Loading state
<ErrorMessage />         // Error display
```

### Component Status
- ✅ **Admin Components**: Fully functional
- ✅ **Home Components**: Complete landing page
- 🔄 **Quiz Components**: Showcase components exist
- 🔄 **Social Components**: Display components exist
- ✅ **Shared Components**: Reusable utilities

---

## 🗄️ Database Schema

### Key Models
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          UserRole  @default(USER)
  totalPoints   Int       @default(0)
  currentStreak Int       @default(0)
  // ... relations
}

model Quiz {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  sport       String?
  difficulty  Difficulty @default(MEDIUM)
  isFeatured  Boolean  @default(false)
  // ... configuration options
}

model Question {
  id           String       @id @default(cuid())
  questionText String       @db.Text
  topicId      String
  difficulty   Difficulty   @default(MEDIUM)
  // ... media and answers
}

model QuizAttempt {
  id                  String    @id @default(cuid())
  userId              String
  quizId              String
  score               Float     @default(0)
  passed              Boolean   @default(false)
  // ... detailed tracking
}
```

### Relationships
- **User** ↔ **QuizAttempt** (one-to-many)
- **Quiz** ↔ **Question** (many-to-many via QuizQuestionPool)
- **Topic** ↔ **Question** (one-to-many)
- **User** ↔ **Friend** (many-to-many)
- **User** ↔ **Challenge** (many-to-many)

---

## 🔐 Authentication

### Setup
```typescript
// lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
})
```

### Usage
```typescript
// Get current user
import { getCurrentUser } from '@/lib/auth-helpers'
const user = await getCurrentUser()

// Require authentication
import { requireAuth } from '@/lib/auth-helpers'
const user = await requireAuth()

// Check admin role
import { requireAdmin } from '@/lib/auth-helpers'
await requireAdmin()
```

---

## 🎯 Development Workflow

### 1. Admin Workflow (Ready Now)
```bash
# 1. Sign in as admin
# 2. Access admin panel
# 3. Create topics
# 4. Create questions
# 5. Create quizzes
# 6. Import content via JSON
```

### 2. User Workflow (In Development)
```bash
# 1. Browse landing page
# 2. Sign in with Google
# 3. Take quizzes (pending)
# 4. View results (pending)
# 5. Manage friends (pending)
```

### 3. API Development
```bash
# Test endpoints
curl http://localhost:3000/api/quizzes
curl http://localhost:3000/api/quizzes?featured=true

# Test with auth
curl -H "Cookie: session=..." http://localhost:3000/api/users/me
```

---

## 📊 Testing

### Run Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Test Structure
```
__tests__/
├── api/                 # API endpoint tests
├── components/         # Component tests
└── lib/                # Utility tests
```

### Test Examples
```typescript
// API test
describe('/api/quizzes', () => {
  it('should return published quizzes', async () => {
    const response = await request(app)
      .get('/api/quizzes')
      .expect(200)
    
    expect(response.body.success).toBe(true)
  })
})

// Component test
describe('QuizCard', () => {
  it('should render quiz information', () => {
    render(<QuizCard quiz={mockQuiz} />)
    expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
  })
})
```

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# 1. Push to GitHub
# 2. Connect to Vercel
# 3. Add environment variables
# 4. Deploy
```

### Environment Variables
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
```

### Database Migration
```bash
npx prisma migrate deploy
```

---

## 📚 Documentation

### Available Guides
- `README.md` - Project overview
- `docs/API_REFERENCE.md` - Complete API documentation
- `docs/ADMIN_PANEL_COMPLETE.md` - Admin panel guide
- `docs/CURRENT_PROJECT_STATUS.md` - Current status
- `docs/FEATURE_IMPLEMENTATION_STATUS.md` - Feature status
- `docs/QUICK_START.md` - Setup instructions
- `docs/AUTH_SETUP.md` - Authentication guide

### Code Examples
- API endpoint implementations
- Component usage examples
- Database query examples
- Authentication flow examples

---

## 🐛 Common Issues

### 1. Authentication Issues
```bash
# Check environment variables
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check database connection
npx prisma studio
```

### 2. Database Issues
```bash
# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate

# Check schema
npx prisma validate
```

### 3. Build Issues
```bash
# Clear cache
rm -rf .next
npm run build

# Check TypeScript
npx tsc --noEmit
```

---

## 🎯 Next Steps

### Immediate (High Priority)
1. **Complete Quiz Taking Interface**: Finish quiz playing experience
2. **Build User Dashboard**: Profile management and statistics
3. **Implement Quiz Results**: Score display and answer review

### Short Term (Medium Priority)
1. **Social Features UI**: Friend management and challenges
2. **Leaderboard Pages**: Global and friend leaderboards
3. **Notification Center**: Real-time notification management

### Long Term (Low Priority)
1. **Mobile App**: React Native or PWA
2. **Real-time Features**: WebSocket integration
3. **AI Features**: Smart recommendations

---

## 📞 Support

### Resources
- **Documentation**: `/docs` folder
- **API Reference**: `docs/API_REFERENCE.md`
- **Admin Guide**: `docs/ADMIN_PANEL_COMPLETE.md`
- **Status Updates**: `docs/CURRENT_PROJECT_STATUS.md`

### Getting Help
1. Check documentation in `/docs`
2. Review API examples
3. Check component usage
4. Open GitHub issue for bugs

---

## 🎉 Summary

The Sports Trivia Platform has a **production-ready backend** with comprehensive APIs and a **fully functional admin panel**. The next phase focuses on completing the user-facing interface to provide a full quiz-taking experience.

**Ready for**: Admin use, API integration, production deployment  
**In Development**: User interface, social features, quiz experience  
**Architecture**: Scalable, maintainable, well-documented

---

*This guide will be updated as development progresses.*

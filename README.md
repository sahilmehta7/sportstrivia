# Sports Trivia Platform

> A modern, high-performance multi-player sports trivia experience built with Next.js 16, Prisma 7, and Supabase.

The Sports Trivia Platform is a comprehensive suite for sport fans to test their knowledge, challenge friends, and climb global leaderboards. It features AI-powered content generation, a robust hierarchical topic system, and a deep gamification layer (badges, streaks, levels).

## Key Features

- **Dynamic Quizzes**: Support for standard, time-pressured, and "Immaculate Grid" style games.
- **Hierarchical Topic System**: 70+ sports and sub-topics with automatic parent-child relationships and SEO-optimized snapshots.
- **Competitions & Social**: Head-to-head challenges, friend systems, and real-time global leaderboards.
- **Gamification**: 50+ unlockable meta-badges, experience tiers (Rookies to Legends), and daily reward streaks.
- **AI-Powered Content**: Automated question generation and topic enrichment via Google Gemini integration.
- **Admin Suite**: Full control over content moderation, user management, and platform analytics.

## Tech Stack

- **Core**: [Next.js 16 (App Router)](https://nextjs.org), [React 19](https://react.dev)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com), [Framer Motion](https://www.framer.com/motion/), [Shadcn UI](https://ui.shadcn.com)
- **Database**: [PostgreSQL (Supabase)](https://supabase.com), [Prisma 7.6.0](https://prisma.io)
- **Authentication**: [NextAuth v5 (Auth.js)](https://authjs.dev) with Google OAuth
- **AI/ML**: [Google Generative AI (Gemini)](https://ai.google.dev)
- **Media**: [Supabase Storage](https://supabase.com/storage)
- **Real-time/PWA**: [next-pwa](https://github.com/ducanh2912/next-pwa), [Web Push](https://web.dev/push-notifications/)
- **Testing**: [Jest](https://jestjs.io), [Playwright](https://playwright.dev), [Supertest](https://github.com/ladjs/supertest)

## Prerequisites

- **Node.js**: 24.x or higher (check `.nvmrc`)
- **Package Manager**: `pnpm` (recommended) or `npm`
- **Database**: A PostgreSQL instance (local or Supabase)
- **Cloud Accounts**:
    - [Supabase](https://supabase.com) (DB + Storage)
    - [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0 Credentials)
    - [Upstash](https://upstash.com) (Redis for rate limiting)
    - [Resend](https://resend.com) (Transactional Email)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/sahilmehta7/sportstrivia.git
cd sportstrivia-2
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
Copy the local environment template:
```bash
cp .env.example .env.local
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled connection for App | `postgres://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | Direct connection for Migrations | `postgres://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Auth secret | `openssl rand -base64 32` |
| `GOOGLE_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `NEXT_PUBLIC_VAPID_PUB` | Web Push Public Key | `pnpm notifications:vapid` |
| `RESEND_API_KEY` | Transactional Email Key | `re_xxx` |

### 4. Database Initialization
```bash
# Generate Prisma Client
pnpm prisma:generate

# Run Migrations (Warning: Resets local DB)
pnpm prisma:migrate:dev

# Seed Sample Data (Quizzes, Topics, Badges)
pnpm prisma:seed
```

### 5. Launch Development Server
```bash
pnpm dev
```
Open [http://localhost:3200](http://localhost:3200) in your browser.

## Architecture

### Directory Structure
```text
├── app/             # Next.js 16 App Router (Routes & Layouts)
│   ├── (public)/    # User-facing routes (Quizzes, Topics)
│   ├── admin/       # Management dashboard (Protected)
│   └── api/         # 70+ REST API Route Handlers
├── components/      # UI Components (Shadcn + Shared)
├── lib/             # Core Core Logic
│   ├── services/    # Business logic (Quiz, Gamification, AI)
│   ├── validations/ # Zod schemas for API safety
│   ├── dto/         # Data Transfer Objects
│   └── prisma.ts    # Prisma Client Singleton
├── prisma/          # Database schema and seed scripts
├── public/          # Static assets and PWA manifest
└── scripts/         # Operational and build-time utilities
```

### Business Logic (Services)
The platform follows a **Services-First** pattern. Route Handlers call isolated services in `lib/services/`:
- **QuizService**: Handles scoring, attempts, and passing logic.
- **GamificationService**: Manages badge awards and level-ups.
- **TopicService**: Manages hierarchical topic data and in-memory caching.
- **AIService**: Orchestrates Gemini for content generation.

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start dev server on port 3200 |
| `pnpm build` | Production build (Next.js) |
| `pnpm lint` | Run ESLint static analysis |
| `pnpm test` | Run Jest unit and integration tests |
| `pnpm prisma:studio` | Open interactive database UI |
| `pnpm prisma:seed` | Re-seed database with sample content |
| `pnpm db:health` | Run database optimization/health check |
| `pnpm lighthouse:audit` | Run standard performance audits |
| `pnpm notifications:vapid` | Generate new Web Push keys |

## Testing

### Unit & Integration (Jest)
Minitest-style tests covering core service logic:
```bash
pnpm test
```

### End-to-End (Playwright)
Browser-based flows for authentication and quiz completion:
```bash
pnpm exec playwright test
```

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. Configure **Environment Variables** (see `Environment Setup`).
3. Ensure **OIDC** is enabled if using Supabase protection.
4. Deployment settings:
    - **Build Command**: `next build`
    - **Output Directory**: `.next`

For more details, see [VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md).

## Documentation

Comprehensive guides are available in the [docs/](docs/) folder:
- [API_REFERENCE.md](docs/API_REFERENCE.md) - Exhaustive endpoint documentation.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Deep dive into system flows.
- [QUICK_START.md](docs/QUICK_START.md) - 5-minute setup guide.
- [sportstrivia.md](docs/sportstrivia.md) - Product Requirements (PRD).

---

Built with ❤️ by the Sports Trivia Team.

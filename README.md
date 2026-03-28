# Sports Trivia Platform

Modern multi-player sports trivia experience built with Next.js 15, Prisma, and Supabase.

## Current Status

- ✅ Production-ready admin console, player experience, and public marketing site
- ✅ 70 API handlers covering quiz authoring, attempts, reviews, social graphs, leaderboards, notifications, AI helpers, and gamification
- ✅ Fully responsive App Router UI with landing, discovery, quiz play, dashboards, social, and notifications flows
- 🔄 Roadmap: push notifications, extended analytics exports, native mobile companion

## Platform Modules

**Quiz Engine**
- Configurable quiz types (fixed pools, topic-random, recurring events, single-attempt challenges)
- Weighted scoring, streak and time bonuses, per-question timers, practice mode, attempt limits with resets
- Rich media support (images/video/audio), hints, explanations, review and rating pipeline

**Player Experience**
- SEO-ready landing page, quiz discovery & filters, topic hubs, search suggestions
- Quiz play, results, review prompts, player dashboard with stats, streaks, badges, challenge history
- Leaderboard views (daily & all-time), random challenge flow, profile pages, structured data for SEO

**Social & Gamification**
- Friend graph, requests, declines, removals
- Head-to-head challenges with score tracking and expiry
- Badge progress, levels and tier history, completion bonus awards, notifications center
- Web push notifications for challenges/streaks plus configurable email digests

**Admin & Operations**
- Dashboard analytics, quiz/question/topic CRUD, question pool manager, JSON import/export
- User management, flag/report resolution, AI-assisted quiz/metadata generation, image upload pipeline
- Gamification configuration (levels, tiers), sitemap generation, admin settings management

## Tech Stack

- Framework: Next.js 15 (App Router) + React 19
- Language: TypeScript 5.7
- Styling: Tailwind CSS, Shadcn UI, CSS modules
- Data: Prisma ORM + PostgreSQL (Supabase)
- Auth: NextAuth v5 (Google OAuth provider)
- Validation: Zod
- Charts & Visualization: Recharts
- Testing: Jest, Testing Library, Supertest
- Tooling: ESLint, Next lint, TSX scripts

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # fill in database, Supabase, NextAuth, Google OAuth, and service role values
   ```
3. **Setup database**
   ```bash
   npx prisma generate
   npm run prisma:migrate:dev
   npm run prisma:seed
   ```
4. **Run the app**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3200`.

## Database Schema

Prisma models cover the whole platform:

- Accounts, sessions, verification tokens, and user profile metadata
- Quizzes with configuration, pools, tags, recurring schedules, featured flags
- Questions, answers, explanations, media, question stats
- Topics hierarchy, search queries, review & report records
- Quiz attempts, question responses, completion bonuses, leaderboards
- Friends, challenges, notifications, badges, user topic stats
- Gamification tiers, levels, tier history, admin background tasks, AI jobs
- Media uploads and SEO assets

See `prisma/schema.prisma` for complete definitions.

## API Surface

- **Public**: quizzes, topics, badges, leaderboards, search suggestions, public profiles and stats
- **Authenticated players**: attempts lifecycle, reviews, notifications, friends, challenges, user stats & badges, gamification status
- **Admins**: quizzes, questions, topics, pools, users, reports, settings, sitemap, uploads, gamification, AI tooling
- **AI & utilities**: quiz generation, topic question generation, suggestion endpoints

Full details live in `docs/API_REFERENCE.md`. Quick commands in `docs/API_QUICK_REFERENCE.md`.

## Project Structure

```
app/                     # App Router pages and layouts
│ ├── page.tsx           # Landing page
│ ├── quizzes/           # Quiz discovery, detail, play, results
│ ├── topics/            # Topic hubs and taxonomy exploration
│ ├── random-quiz/       # Single-attempt daily challenge
│ ├── search/            # Search results experience
│ ├── leaderboard/       # Global leaderboard page
│ ├── friends/, challenges/, notifications/, profile/  # Social & player dashboards
│ └── admin/             # Admin console (dashboard, quizzes, questions, topics, users)
├── app/api/             # 70 REST handlers (public, player, admin, AI)
├── components/          # Shared UI, showcase system, quiz experience widgets
├── constants/, hooks/, lib/  # Business logic, services, helpers, schemas
├── prisma/              # Prisma schema, seed data, migrations
├── docs/                # Authoritative documentation & playbooks
└── scripts/             # Operational & data scripts
```

## Scripts

```bash
npm run dev                 # Start dev server
npm run build               # Production build
npm run start               # Start compiled app
npm run lint                # ESLint
npm test                    # Jest test suite
npm run test:watch          # Jest watch mode
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Apply committed migrations to shared/remote DBs
npm run prisma:migrate:dev  # Create/apply migrations on a local dev DB
npm run prisma:migrate:status  # Show migration status
npm run prisma:studio       # Open Prisma Studio
npm run prisma:seed         # Seed sample data
npm run scripts:backfill:emojis  # Populate topic emoji defaults
```

## Testing & Quality

- Unit & integration tests live under `__tests__/`
- Supertest suite covers attempts, challenges, topics, auth, and content flows
- Jest configured via `jest.config.js`, `jest.setup.js` for Testing Library matchers

## Documentation

- `docs/CURRENT_PROJECT_STATUS.md` — live status, roadmap, metrics
- `docs/FEATURE_IMPLEMENTATION_STATUS.md` — feature matrix & ownership
- `docs/API_REFERENCE.md` — exhaustive endpoint docs
- `docs/API_QUICK_REFERENCE.md` — copy-paste friendly commands
- `docs/LATEST_UPDATES.md` — changelog of major milestones
- Additional focused guides for admin, quiz engine, AI tooling, and troubleshooting live in `docs/`

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

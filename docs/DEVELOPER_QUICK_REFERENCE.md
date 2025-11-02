# Developer Quick Reference - Sports Trivia Platform

**Last Updated**: February 2025  
**Status**: Production-ready (backend + admin + player)

---

## 🔑 Quick Start

```bash
npm install
cp .env.example .env.local     # fill Supabase, OAuth, service role secrets
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Access points:
- Landing page: `http://localhost:3000/`
- Admin dashboard: `http://localhost:3000/admin`
- Sign-in: `http://localhost:3000/auth/signin`
- Player profile: `http://localhost:3000/profile/me`
- API reference: `docs/API_REFERENCE.md`

---

## 📁 Project Topography

```
app/
│── page.tsx                # Landing
│── quizzes/                # Discovery, play, results
│── topics/                 # Topic hubs
│── search/                 # Search experience
│── random-quiz/            # Single-attempt challenge
│── leaderboard/            # Global leaderboard
│── friends/, challenges/, notifications/, profile/
│── admin/                  # Admin console (dashboard, quizzes, questions, topics, users, AI)
│── api/                    # 70 REST handlers
components/                 # UI kit, showcase library, quiz widgets
lib/                        # Prisma client, auth, services, helper utilities
prisma/                     # `schema.prisma`, seed data, migrations
docs/                       # Living documentation set
scripts/                    # Operational helpers (`scripts:backfill:emojis`, etc.)
```

---

## 🔌 API Cheatsheet

| Area | Key Routes | Auth |
|------|------------|------|
| Public content | `GET /api/quizzes`, `GET /api/topics`, `GET /api/leaderboards/global`, `GET /api/search/suggestions` | Public |
| Quiz lifecycle | `POST /api/attempts`, `PUT /api/attempts/:id/answer`, `POST /api/attempts/:id/complete`, `GET /api/attempts/:id` | Player |
| Reviews & ratings | `GET/POST /api/quizzes/[slug]/reviews`, `PATCH/DELETE /api/reviews/:id` | Player |
| Social graph | `GET/POST /api/friends`, `PATCH/DELETE /api/friends/:id`, `GET/POST /api/challenges`, `POST /api/challenges/:id/{accept|decline}` | Player |
| Notifications | `GET /api/notifications`, `PATCH /api/notifications/:id`, `PATCH /api/notifications/read-all`, `DELETE /api/notifications/:id` | Player |
| Gamification | `GET /api/users/me/{badges,stats,topic-stats,gamification}` | Player |
| Admin quiz ops | `GET/POST /api/admin/quizzes`, `GET/PUT/DELETE /api/admin/quizzes/:id`, `POST /api/admin/quizzes/import`, `PATCH /api/admin/quizzes/:id/featured` | Admin |
| Question bank | `GET/POST /api/admin/questions`, `GET/PUT/DELETE /api/admin/questions/:id`, `PATCH /api/admin/quizzes/:id/questions`, etc. | Admin |
| Topics & taxonomy | `GET/POST /api/admin/topics`, `PATCH/DELETE /api/admin/topics/:id`, `POST /api/admin/topics/import`, `POST /api/admin/topics/:id/ai/generate-questions` | Admin |
| AI tooling | `POST /api/admin/ai/generate-quiz`, `GET /api/admin/ai/tasks`, `GET /api/admin/ai/tasks/:id` | Admin |

Full breakdown lives in `docs/API_REFERENCE.md`; quick commands in `docs/API_QUICK_REFERENCE.md`.

---

## 🧰 Everyday Commands

```bash
npm run lint                   # ESLint (strict, zero warnings)
npm test                       # Jest + Supertest suite
npm run test:watch             # Watch mode
npm run prisma:studio          # Inspect database
npm run scripts:backfill:emojis  # Populate topic emoji defaults
```

---

## 📝 Conventions & Tips

- Use `requireAuth` and `requireAdmin` helpers in APIs for consistent responses.
- DTOs live under `lib/dto/`; reuse them for validation and pagination.
- Service logic sits in `lib/services/**`—keep route handlers thin.
- `components/showcase/**` contains the marketing/presentation layer; `components/quiz/**` powers gameplay.
- Keep docs current—update `docs/LATEST_UPDATES.md` after meaningful changes.

Need a deeper dive? Start with:
- `docs/CURRENT_PROJECT_STATUS.md`
- `docs/FEATURE_IMPLEMENTATION_STATUS.md`
- `docs/API_REFERENCE.md`
- `docs/LATEST_UPDATES.md`

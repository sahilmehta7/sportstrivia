# Sports Trivia API Reference

**Last Updated**: February 2025  
**Status**: Production-ready (70 Next.js route handlers)

All endpoints return a JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional human-readable context"
}
```

Errors bubble through `handleError` and follow the same shape with `success: false` and an `error` payload. Request validation uses Zod DTOs; expect 400-series errors for invalid input, 401/403 for auth issues, and 404 for missing resources.

Authentication is session-based via NextAuth. Include the browser session cookie (or `next-auth.session-token` in integration tests). Use `requireAdmin` protected routes for elevated operations.

---

## 🔓 Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quizzes` | List published quizzes with filtering, sorting, pagination |
| GET | `/api/quizzes/[slug]` | Fetch published quiz detail (metadata, counts, featured info) |
| GET | `/api/quizzes/[slug]/reviews` | Paginated reviews with sort and rating filters |
| GET | `/api/topics` | Hierarchical topic tree with quiz/question counts |
| GET | `/api/topics/top` | Trending topics snapshot |
| GET | `/api/leaderboards/global` | Global leaderboard (supports `period=daily\|weekly\|monthly\|all-time`, `limit`) |
| GET | `/api/leaderboards/quiz/[id]` | Leaderboard for a single quiz |
| GET | `/api/leaderboards/topic/[id]` | Leaderboard filtered by topic |
| GET | `/api/badges` | Public badge catalog |
| GET | `/api/search/suggestions` | Search term suggestions (trending & personalized) |
| GET | `/api/users/[id]` | Public profile information |
| GET | `/api/users/[id]/stats` | Public aggregate player stats |
| GET | `/api/users/[id]/badges` | Earned and available badges for a player |

### Quiz Listing Filters (`GET /api/quizzes`)

| Query | Description |
|-------|-------------|
| `page`, `limit` | Pagination (limit capped at 50) |
| `search` | Title/description search |
| `sport`, `difficulty`, `tag`, `topic` | Structured filters |
| `minDuration`, `maxDuration` | Minutes (converted to seconds server-side) |
| `minRating` | Minimum average rating |
| `featured`, `comingSoon` | Flags |
| `sortBy` | `createdAt`, `rating`, `popularity` |
| `sortOrder` | `asc` or `desc` |

---

## 🙋 Player (Authenticated) Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/attempts` | Start a quiz attempt (returns questions, config, attempt id) |
| GET | `/api/attempts/[id]` | Fetch attempt state/results |
| GET | `/api/attempts/[id]/next` | Fetch next question payload |
| PUT | `/api/attempts/[id]/answer` | Submit an answer (tracks skips, time spent) |
| POST | `/api/attempts/[id]/complete` | Complete an attempt, final scoring |
| GET | `/api/quizzes/[slug]/reviews` | Public listing (auth optional) |
| POST | `/api/quizzes/[slug]/reviews` | Submit first review (requires completed attempt) |
| PATCH | `/api/reviews/[id]` | Update an existing review |
| DELETE | `/api/reviews/[id]` | Remove review |
| GET | `/api/users/me` | Current user profile |
| PATCH | `/api/users/me` | Update profile metadata (bio, favorite teams, etc.) |
| GET | `/api/users/me/stats` | Comprehensive player stats (attempts, accuracy, streaks) |
| GET | `/api/users/me/topic-stats` | Topic-specific performance |
| GET | `/api/users/me/badges` | Earned badges and progress towards locked badges |
| GET | `/api/users/me/gamification` | Level, tier, and completion bonus summaries |
| GET | `/api/friends` | Friend dashboard (friends, sent, received requests) |
| POST | `/api/friends` | Send friend request (by email) |
| GET | `/api/friends/[id]` | Fetch a single friendship/request |
| PATCH | `/api/friends/[id]` | Accept/decline friend requests |
| DELETE | `/api/friends/[id]` | Remove friend / cancel request |
| GET | `/api/challenges` | Challenge dashboard (active, received, sent) |
| POST | `/api/challenges` | Create a challenge (friend + quiz) |
| GET | `/api/challenges/[id]` | Fetch challenge detail |
| POST | `/api/challenges/[id]/accept` | Accept challenge |
| POST | `/api/challenges/[id]/decline` | Decline challenge |
| DELETE | `/api/challenges/[id]` | Cancel challenge (owner) |
| GET | `/api/notifications` | Paginated notification feed |
| PATCH | `/api/notifications/[id]` | Mark notification as read |
| DELETE | `/api/notifications/[id]` | Delete notification |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |
| GET | `/api/daily-quizzes/user-ranks` | Recurring daily quiz standings for current user |
| POST | `/api/questions/[id]/report` | File a content report (duplicates, errors, etc.) |

---

## 🛠️ Admin Endpoints

All require `role === ADMIN`. These routes live under `/api/admin/**`.

### Quizzes & Pools

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/quizzes` | List quizzes with filters/search |
| POST | `/api/admin/quizzes` | Create quiz (full configuration DTO) |
| GET | `/api/admin/quizzes/[id]` | Fetch quiz detail |
| PUT | `/api/admin/quizzes/[id]` | Update quiz |
| DELETE | `/api/admin/quizzes/[id]` | Archive quiz |
| POST | `/api/admin/quizzes/import` | JSON bulk import |
| PATCH | `/api/admin/quizzes/[id]/featured` | Toggle featured flag |
| POST | `/api/admin/quizzes/[id]/ai/metadata` | Generate SEO metadata |
| POST | `/api/admin/quizzes/[id]/ai/cover` | Generate cover image prompt/data |
| GET | `/api/admin/quizzes/[id]/questions` | List pool questions (order, points) |
| POST | `/api/admin/quizzes/[id]/questions` | Add question to pool |
| PATCH | `/api/admin/quizzes/[id]/questions` | Reorder/adjust points |
| DELETE | `/api/admin/quizzes/[id]/questions` | Remove question (query `questionId`) |
| PATCH | `/api/admin/quizzes/[id]/questions/[poolId]` | Update single pool entry |
| DELETE | `/api/admin/quizzes/[id]/questions/[poolId]` | Delete pool entry |
| GET | `/api/admin/quizzes/[id]/topics` | Linked topics |
| POST | `/api/admin/quizzes/[id]/topics` | Attach topic |
| PATCH | `/api/admin/quizzes/[id]/topics` | Reorder topics |
| DELETE | `/api/admin/quizzes/[id]/topics` | Remove topic link |

### Questions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/questions` | List/Search questions with filters |
| POST | `/api/admin/questions` | Create question (supports media, answers) |
| GET | `/api/admin/questions/[id]` | Fetch question details |
| PUT | `/api/admin/questions/[id]` | Update question |
| DELETE | `/api/admin/questions/[id]` | Delete question |

### Topics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/topics` | List topics (search, pagination, hierarchy) |
| POST | `/api/admin/topics` | Create topic |
| GET | `/api/admin/topics/[id]` | Fetch topic detail |
| PATCH/PUT | `/api/admin/topics/[id]` | Update topic |
| DELETE | `/api/admin/topics/[id]` | Delete topic (with safeguards) |
| POST | `/api/admin/topics/import` | Bulk import JSON structure |
| POST | `/api/admin/topics/[id]/ai/generate-questions` | Suggest questions via AI |

### Users & Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/users` | List users with role & activity info |
| GET | `/api/admin/users/[id]` | Fetch user detail |
| PATCH | `/api/admin/users/[id]` | Update role/profile |
| DELETE | `/api/admin/users/[id]` | Delete/deactivate user |
| GET | `/api/admin/reports` | List content reports |
| GET | `/api/admin/reports/[id]` | Fetch report detail |
| PATCH | `/api/admin/reports/[id]` | Resolve/update report |
| DELETE | `/api/admin/reports/[id]` | Dismiss report |

### Gamification & Settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/settings` | Platform settings |
| PUT | `/api/admin/settings` | Update settings |
| DELETE | `/api/admin/settings` | Reset/clear |
| GET | `/api/admin/levels` | List level tiers |
| POST | `/api/admin/levels` | Create level |
| GET | `/api/admin/levels/[level]` | Fetch level info |
| PUT | `/api/admin/levels/[level]` | Update level |
| DELETE | `/api/admin/levels/[level]` | Remove level |
| GET | `/api/admin/tiers` | List gamification tiers |
| POST | `/api/admin/tiers` | Create tier |
| GET | `/api/admin/tiers/[id]` | Fetch tier |
| PUT | `/api/admin/tiers/[id]` | Update tier |
| DELETE | `/api/admin/tiers/[id]` | Delete tier |
| GET | `/api/admin/gamification/preview` | Preview user progression |
| POST | `/api/admin/gamification/recompute` | Recompute levels/tiers for users |

### AI & Utilities

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/ai/generate-quiz` | Kick off AI quiz generation task |
| GET | `/api/admin/ai/tasks` | List background AI tasks |
| GET | `/api/admin/ai/tasks/[id]` | Fetch task detail/status |
| POST | `/api/admin/sitemap` | Generate sitemap |
| POST | `/api/admin/upload/image` | Upload image (Supabase storage) |
| DELETE | `/api/admin/upload/image` | Remove uploaded image |

---

## 🤖 AI / Utility Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/suggest-quiz` | Player-facing AI suggestions for quiz ideas |
| GET | `/api/test-auth` | Simple authenticated ping (debugging) |
| GET | `/api/auth/[...nextauth]` | NextAuth handler (do not call directly; use `/auth/signin`) |

---

## Testing Notes

- Use `test-api-practical.sh` and `test-questions-api.sh` for smoke testing.
- Supertest suites live in `__tests__/api/**`, mirroring the groupings above.
- For admin requests in tests, seed a user with `role: "ADMIN"` and authenticate via NextAuth helpers.

Refer back to this document whenever endpoint behavior changes—keep the tables in sync with `app/api/**/route.ts`.

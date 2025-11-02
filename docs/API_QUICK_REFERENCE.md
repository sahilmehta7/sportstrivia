# API Quick Reference

**Last Updated**: February 2025  
Use this cheat sheet for common operations. See `docs/API_REFERENCE.md` for exhaustive detail.

---

## 🎯 Quizzes & Discovery

| Action | HTTP |
|--------|------|
| List published quizzes | `GET /api/quizzes?search=f1&difficulty=HARD&sortBy=rating` |
| Get quiz detail | `GET /api/quizzes/cricket-basics` |
| Get quiz reviews | `GET /api/quizzes/cricket-basics/reviews?page=2&rating=5` |
| Submit review | `POST /api/quizzes/cricket-basics/reviews` → `{ "rating": 5, "comment": "Loved it" }` |
| Topic taxonomy | `GET /api/topics` |
| Search suggestions | `GET /api/search/suggestions?q=champ` |

---

## 🕹️ Attempt Lifecycle (player session required)

```bash
# Start attempt
POST /api/attempts
{
  "quizId": "clv9..."
}

# Submit answer
PUT /api/attempts/attempt-id/answer
{
  "questionId": "clv9q...",
  "answerId": "clv9a...",
  "timeSpent": 18
}

# Complete attempt
POST /api/attempts/attempt-id/complete
```

Retrieve attempt state: `GET /api/attempts/attempt-id`  
Next question (progressive mode): `GET /api/attempts/attempt-id/next`

---

## 🤝 Friends & Challenges

| Action | HTTP |
|--------|------|
| Dashboard snapshot | `GET /api/friends` |
| Send friend request | `POST /api/friends` → `{ "friendEmail": "alex@example.com" }` |
| Accept request | `PATCH /api/friends/friendship-id` → `{ "action": "accept" }` |
| Remove friend | `DELETE /api/friends/friendship-id` |
| List challenges | `GET /api/challenges` |
| Create challenge | `POST /api/challenges` → `{ "friendId": "...", "quizId": "..." }` |
| Accept/Decline | `POST /api/challenges/challenge-id/accept` / `.../decline` |

---

## 🔔 Notifications & Gamification

| Action | HTTP |
|--------|------|
| Notification center | `GET /api/notifications?limit=50` |
| Mark single read | `PATCH /api/notifications/notification-id` |
| Mark all read | `PATCH /api/notifications/read-all` |
| Delete notification | `DELETE /api/notifications/notification-id` |
| Player stats | `GET /api/users/me/stats` |
| Topic stats | `GET /api/users/me/topic-stats` |
| Badge progress | `GET /api/users/me/badges` |
| Gamification snapshot | `GET /api/users/me/gamification` |

---

## 👑 Admin Essentials

### Quizzes
```bash
# List
GET /api/admin/quizzes?status=PUBLISHED&sport=Cricket

# Create
POST /api/admin/quizzes
{
  "title": "F1 Legends",
  "slug": "f1-legends",
  "sport": "Formula 1",
  "difficulty": "HARD",
  "status": "PUBLISHED",
  "randomizeQuestionOrder": true,
  "maxAttemptsPerUser": 3,
  "attemptResetPeriod": "WEEKLY"
}

# Import
POST /api/admin/quizzes/import  (multipart/form-data or JSON body)
```

Manage pools:  
- `GET /api/admin/quizzes/{id}/questions`  
- `POST /api/admin/quizzes/{id}/questions` → `{ "questionId": "...", "displayOrder": 3 }`  
- `PATCH /api/admin/quizzes/{id}/questions` → reorder/update points  
- `DELETE /api/admin/quizzes/{id}/questions?questionId=...`

### Questions & Topics

| Action | HTTP |
|--------|------|
| Search questions | `GET /api/admin/questions?topicId=...&difficulty=EASY&search=finals` |
| Create question | `POST /api/admin/questions` |
| Update question | `PUT /api/admin/questions/question-id` |
| Delete question | `DELETE /api/admin/questions/question-id` |
| Manage topics | `GET/POST/PATCH/DELETE /api/admin/topics[...]` |
| Import topics | `POST /api/admin/topics/import` |
| AI topic questions | `POST /api/admin/topics/topic-id/ai/generate-questions` |

### Users, Reports, Settings

| Action | HTTP |
|--------|------|
| List users | `GET /api/admin/users?role=USER&search=alex` |
| Update role | `PATCH /api/admin/users/user-id` → `{ "role": "ADMIN" }` |
| Resolve report | `PATCH /api/admin/reports/report-id` → `{ "status": "RESOLVED" }` |
| Update settings | `PUT /api/admin/settings` |
| Preview gamification | `GET /api/admin/gamification/preview?userId=...` |
| Recompute levels/tiers | `POST /api/admin/gamification/recompute` |

### AI & Utilities
- Generate quiz draft: `POST /api/admin/ai/generate-quiz`
- Track AI jobs: `GET /api/admin/ai/tasks` / `GET /api/admin/ai/tasks/task-id`
- Upload image: `POST /api/admin/upload/image` (form-data: `file`)
- Delete image: `DELETE /api/admin/upload/image?path=...`
- Build sitemap: `POST /api/admin/sitemap`

---

## 📈 Leaderboards & Daily Challenges

| Action | HTTP |
|--------|------|
| Global leaderboard | `GET /api/leaderboards/global?period=daily&limit=10` |
| Quiz leaderboard | `GET /api/leaderboards/quiz/quiz-id` |
| Topic leaderboard | `GET /api/leaderboards/topic/topic-id` |
| Player daily ranks | `GET /api/daily-quizzes/user-ranks` |

---

## 🧪 Handy Utilities

| Purpose | HTTP |
|---------|------|
| Auth smoke-test | `GET /api/test-auth` (returns 401 when unauthenticated) |
| Player quiz idea | `POST /api/ai/suggest-quiz` |
| Report problematic question | `POST /api/questions/question-id/report` |

---

Always authenticate requests with the NextAuth session cookie (or set the `Authorization` header with `Bearer` for test helpers that proxy session tokens). Update this sheet when routes change to keep a consistent single source of truth.

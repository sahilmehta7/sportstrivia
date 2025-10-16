# API Quick Reference Card

## 📋 All Endpoints at a Glance

---

## Quizzes

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **POST** | `/api/admin/quizzes` | Admin | Create quiz |
| **GET** | `/api/admin/quizzes` | Admin | List all quizzes |
| **GET** | `/api/admin/quizzes/[id]` | Admin | Get single quiz |
| **PUT** | `/api/admin/quizzes/[id]` | Admin | Update quiz |
| **DELETE** | `/api/admin/quizzes/[id]` | Admin | Archive quiz |
| **POST** | `/api/admin/quizzes/import` | Admin | Bulk import JSON |
| **GET** | `/api/quizzes` | Public | List published |
| **GET** | `/api/quizzes/[slug]` | Public | Get quiz details |

**Key Filters**: `?sport=X&difficulty=Y&minDuration=Z&sortBy=popularity&featured=true`

---

## Questions

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **POST** | `/api/admin/questions` | Admin | Create question |
| **GET** | `/api/admin/questions` | Admin | List with filters |
| **GET** | `/api/admin/questions/[id]` | Admin | Get single |
| **PUT** | `/api/admin/questions/[id]` | Admin | Update question |
| **DELETE** | `/api/admin/questions/[id]` | Admin | Delete question |

**Key Filters**: `?topicId=X&difficulty=Y&search=Z`

---

## Topics

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **POST** | `/api/admin/topics` | Admin | Create topic |
| **GET** | `/api/topics` | Public | List all |
| **GET** | `/api/admin/topics` | Admin | List with filters |
| **GET** | `/api/admin/topics/[id]` | Admin | Get single |
| **PATCH** | `/api/admin/topics/[id]` | Admin | Update topic |
| **PUT** | `/api/admin/topics/[id]` | Admin | Update (alias) |
| **DELETE** | `/api/admin/topics/[id]` | Admin | Delete topic |

**Key Filters**: `?parentId=X&hierarchy=true&search=Y`

---

## Quiz Attempts

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **POST** | `/api/attempts` | User | Start quiz |
| **PUT** | `/api/attempts/[id]/answer` | User | Submit answer |
| **POST** | `/api/attempts/[id]/complete` | User | Complete quiz |
| **GET** | `/api/attempts/[id]` | User | Get results |

---

## Authentication

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| **GET** | `/api/auth/signin/google` | Public | Google OAuth |
| **GET/POST** | `/api/auth/[...nextauth]` | Public | NextAuth routes |

---

## Admin Panel URLs

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin/dashboard` | Metrics overview |
| Quiz List | `/admin/quizzes` | Browse quizzes |
| Create Quiz | `/admin/quizzes/new` | New quiz form |
| Edit Quiz | `/admin/quizzes/[id]/edit` | Edit form |
| Question List | `/admin/questions` | Browse questions |
| Create Question | `/admin/questions/new` | New question form |
| Edit Question | `/admin/questions/[id]/edit` | Edit form |
| Import | `/admin/import` | JSON bulk import |

---

## Quick Examples

### Create Quiz
```bash
POST /api/admin/quizzes
{
  "title": "NBA Quiz",
  "difficulty": "MEDIUM",
  "passingScore": 70,
  "randomizeQuestionOrder": true
}
```

### Create Question
```bash
POST /api/admin/questions
{
  "topicId": "{id}",
  "questionText": "Who won 2023 NBA Championship?",
  "difficulty": "EASY",
  "randomizeAnswerOrder": true,
  "answers": [
    {"answerText": "Denver Nuggets", "isCorrect": true},
    {"answerText": "Miami Heat", "isCorrect": false}
  ]
}
```

### Create Topic
```bash
POST /api/admin/topics
{
  "name": "NFL",
  "slug": "nfl",
  "parentId": null
}
```

### Start Quiz
```bash
POST /api/attempts
{
  "quizId": "{id}",
  "isPracticeMode": false
}
```

### Filter Quizzes
```bash
GET /api/quizzes?sport=Basketball&difficulty=MEDIUM&sortBy=popularity
```

### Search Questions
```bash
GET /api/admin/questions?search=championship&difficulty=HARD
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Server Error

---

## Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🎯 Most Used Endpoints

**Admin:**
1. `POST /api/admin/quizzes` - Create quiz
2. `POST /api/admin/questions` - Create question
3. `GET /api/admin/quizzes` - List quizzes
4. `GET /api/admin/questions` - List questions
5. `POST /api/admin/quizzes/import` - Bulk import

**Public:**
1. `GET /api/quizzes` - Browse quizzes
2. `GET /api/quizzes/[slug]` - Quiz details
3. `POST /api/attempts` - Start quiz
4. `GET /api/topics` - List topics

---

Print this for quick reference during development! 📌


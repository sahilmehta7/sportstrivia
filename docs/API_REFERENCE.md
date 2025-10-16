# Sports Trivia API Reference

## Quiz Listing API

### GET /api/quizzes

Retrieve a paginated list of quizzes with advanced filtering, sorting, and search capabilities.

#### Base URL
```
GET http://localhost:3000/api/quizzes
```

---

## Query Parameters

### Pagination

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number for pagination |
| `limit` | integer | `12` | Number of quizzes per page |

### Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in quiz title and description | `?search=nba` |
| `sport` | string | Filter by sport | `?sport=Basketball` |
| `difficulty` | string | Filter by difficulty level | `?difficulty=EASY` |
| `tag` | string | Filter by tag slug | `?tag=champions` |
| `topic` | string | Filter by topic slug | `?topic=cricket` |
| `featured` | boolean | Show only featured quizzes | `?featured=true` |
| `comingSoon` | boolean | Show only upcoming quizzes | `?comingSoon=true` |
| `minDuration` | integer | Minimum duration in minutes | `?minDuration=5` |
| `maxDuration` | integer | Maximum duration in minutes | `?maxDuration=30` |
| `minRating` | float | Minimum average rating (0-5) | `?minRating=4.0` |

### Sorting

| Parameter | Type | Options | Default |
|-----------|------|---------|---------|
| `sortBy` | string | `popularity`, `rating`, `createdAt` | `createdAt` |
| `sortOrder` | string | `asc`, `desc` | `desc` |

---

## Usage Examples

### 1. Get Paginated Quiz List (Default)
```bash
GET /api/quizzes
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "cm...",
        "title": "Cricket Basics Quiz",
        "slug": "cricket-basics",
        "description": "Test your cricket knowledge",
        "descriptionImageUrl": null,
        "sport": "Cricket",
        "difficulty": "EASY",
        "duration": 600,
        "passingScore": 70,
        "averageRating": 0,
        "totalReviews": 0,
        "isFeatured": false,
        "startTime": null,
        "endTime": null,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "_count": {
          "questionPool": 3,
          "attempts": 0
        },
        "tags": [
          {
            "tag": {
              "name": "Trivia",
              "slug": "trivia"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "pages": 1
    },
    "filters": {
      "sport": "",
      "difficulty": "",
      "tag": "",
      "topic": "",
      "isFeatured": false,
      "comingSoon": false,
      "minDuration": null,
      "maxDuration": null,
      "minRating": null,
      "sortBy": "createdAt",
      "sortOrder": "desc"
    }
  }
}
```

### 2. Get Featured Quizzes
```bash
GET /api/quizzes?featured=true
```
Returns only quizzes marked as featured.

### 3. Get Coming Soon Quizzes
```bash
GET /api/quizzes?comingSoon=true
```
Returns quizzes whose `startTime` is in the future.

### 4. Sort by Popularity
```bash
GET /api/quizzes?sortBy=popularity&sortOrder=desc
```
Returns quizzes sorted by number of attempts (most popular first).

### 5. Sort by Rating
```bash
GET /api/quizzes?sortBy=rating&sortOrder=desc
```
Returns quizzes sorted by average rating (highest rated first).

### 6. Filter by Duration Range
```bash
GET /api/quizzes?minDuration=5&maxDuration=15
```
Returns quizzes that take between 5-15 minutes.

### 7. Filter by Rating
```bash
GET /api/quizzes?minRating=4.0
```
Returns quizzes with rating of 4.0 or higher.

### 8. Get Quizzes by Topic
```bash
GET /api/quizzes?topic=cricket
```
Returns quizzes related to cricket topic.

### 9. Get Quizzes by Tag
```bash
GET /api/quizzes?tag=champions
```
Returns quizzes tagged with "champions".

### 10. Filter by Difficulty
```bash
GET /api/quizzes?difficulty=MEDIUM
```
Options: `EASY`, `MEDIUM`, `HARD`

### 11. Combined Filters
```bash
GET /api/quizzes?sport=Basketball&difficulty=MEDIUM&sortBy=popularity&page=1&limit=20
```
Returns medium difficulty Basketball quizzes, sorted by popularity, page 1 with 20 results.

### 12. Search Quizzes
```bash
GET /api/quizzes?search=championship&sortBy=rating
```
Searches for "championship" in title and description, sorted by rating.

---

## Quiz Detail API

### GET /api/quizzes/[slug]

Get detailed information about a specific quiz.

#### Example Request
```bash
GET /api/quizzes/cricket-basics
```

#### Response
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "cm...",
      "title": "Cricket Basics Quiz",
      "slug": "cricket-basics",
      "description": "Test your cricket knowledge",
      "descriptionImageUrl": null,
      "descriptionVideoUrl": null,
      "sport": "Cricket",
      "difficulty": "EASY",
      "duration": 600,
      "timePerQuestion": null,
      "passingScore": 70,
      "questionCount": 3,
      "questionSelectionMode": "FIXED",
      "showHints": true,
      "negativeMarkingEnabled": false,
      "penaltyPercentage": 25,
      "timeBonusEnabled": false,
      "averageRating": 0,
      "totalReviews": 0,
      "totalAttempts": 0,
      "tags": [
        {
          "name": "Trivia",
          "slug": "trivia"
        }
      ],
      "startTime": null,
      "endTime": null
    },
    "available": true,
    "userAttempts": null,
    "leaderboard": []
  }
}
```

### Quiz Availability States

**Available Quiz:**
- `available: true` - Quiz can be started
- No `startTime` or `startTime <= now`
- No `endTime` or `endTime >= now`

**Not Started:**
```json
{
  "quiz": { "id": "...", "title": "...", "startTime": "2025-02-01T00:00:00.000Z" },
  "available": false,
  "message": "Quiz has not started yet"
}
```

**Ended:**
```json
{
  "quiz": { "id": "...", "title": "...", "endTime": "2025-01-10T00:00:00.000Z" },
  "available": false,
  "message": "Quiz has ended"
}
```

---

## Use Cases

### Homepage Sections

#### 1. Featured Quizzes Section
```javascript
// Get 4 featured quizzes sorted by rating
fetch('/api/quizzes?featured=true&sortBy=rating&limit=4')
```

#### 2. Popular Quizzes Section
```javascript
// Get 6 most popular quizzes
fetch('/api/quizzes?sortBy=popularity&limit=6')
```

#### 3. Coming Soon Section
```javascript
// Get upcoming quizzes
fetch('/api/quizzes?comingSoon=true&sortBy=createdAt&limit=3')
```

#### 4. Recently Added Section
```javascript
// Get latest quizzes
fetch('/api/quizzes?sortBy=createdAt&sortOrder=desc&limit=6')
```

### Quiz Listing Page

#### With Multiple Filters
```javascript
// User selects: Basketball, Medium difficulty, 10-20 mins, rated 4+
fetch('/api/quizzes?' + new URLSearchParams({
  sport: 'Basketball',
  difficulty: 'MEDIUM',
  minDuration: '10',
  maxDuration: '20',
  minRating: '4',
  sortBy: 'popularity',
  page: '1',
  limit: '12'
}))
```

### Topic-Based Browse
```javascript
// Cricket topic page
fetch('/api/quizzes?topic=cricket&sortBy=rating&limit=20')
```

### Tag-Based Browse
```javascript
// Champions category
fetch('/api/quizzes?tag=champions&sortBy=popularity')
```

---

## Advanced Filtering Examples

### 1. Short Quizzes (Quick Play)
```bash
GET /api/quizzes?maxDuration=5&sortBy=popularity
```
Shows quizzes under 5 minutes, most popular first.

### 2. Long Challenge Quizzes
```bash
GET /api/quizzes?minDuration=20&difficulty=HARD&sortBy=rating
```
Shows challenging long quizzes, best rated first.

### 3. Beginner-Friendly Section
```bash
GET /api/quizzes?difficulty=EASY&minRating=4&maxDuration=10
```
Easy, highly-rated, short quizzes for beginners.

### 4. Expert Challenge
```bash
GET /api/quizzes?difficulty=HARD&minDuration=15&sortBy=popularity
```
Difficult quizzes that take time, sorted by popularity.

---

## Response Fields Explained

### Quiz Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique quiz identifier |
| `title` | string | Quiz title |
| `slug` | string | URL-friendly identifier |
| `description` | string | Quiz description |
| `descriptionImageUrl` | string? | Banner/cover image |
| `sport` | string | Sport category |
| `difficulty` | enum | EASY, MEDIUM, or HARD |
| `duration` | integer | Total quiz duration in seconds |
| `passingScore` | integer | Percentage needed to pass (0-100) |
| `averageRating` | float | Average rating (0-5) |
| `totalReviews` | integer | Number of reviews |
| `isFeatured` | boolean | Is this quiz featured? |
| `startTime` | datetime? | When quiz becomes available |
| `endTime` | datetime? | When quiz becomes unavailable |
| `createdAt` | datetime | When quiz was created |
| `_count.questionPool` | integer | Number of questions |
| `_count.attempts` | integer | Number of attempts (popularity) |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR"
}
```

### 404 Not Found
```json
{
  "error": "Quiz not found",
  "code": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

---

## Notes

### Performance
- All queries use database indexes for optimal performance
- Pagination limits are capped to prevent excessive data transfer
- Complex filters may require additional processing time

### Caching
- Consider caching popular quiz lists on the client
- Featured and coming soon lists can be cached for several minutes
- Individual quiz details can be cached until updated

### Best Practices
1. Always use pagination for large result sets
2. Combine filters to narrow results effectively
3. Use `featured=true` for homepage highlights
4. Use `sortBy=popularity` for trending sections
5. Use `sortBy=rating` for quality-focused sections
6. Use `comingSoon=true` for upcoming events

---

---

## Quiz Reviews & Ratings APIs

### POST /api/quizzes/[slug]/reviews

Submit a review for a quiz.

**Auth:** Required

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent quiz! Very challenging and educational."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "cm...",
      "rating": 5,
      "comment": "Excellent quiz!...",
      "userId": "cm...",
      "quizId": "cm...",
      "createdAt": "2025-01-16T10:00:00.000Z"
    }
  }
}
```

### GET /api/quizzes/[slug]/reviews

List reviews for a quiz with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "cm...",
        "rating": 5,
        "comment": "Great quiz!",
        "createdAt": "2025-01-16T10:00:00.000Z",
        "user": {
          "id": "cm...",
          "name": "John Doe",
          "image": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### PATCH /api/reviews/[id]

Update your own review.

**Auth:** Required (must be review owner)

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated my thoughts..."
}
```

### DELETE /api/reviews/[id]

Delete your own review.

**Auth:** Required (must be review owner)

---

## Friend Management APIs

### GET /api/friends

List friends or friend requests.

**Auth:** Required

**Query Parameters:**
- `type`: `friends` | `received` | `sent`
- `page`, `limit` for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "friendships": [
      {
        "id": "cm...",
        "status": "ACCEPTED",
        "friend": {
          "id": "cm...",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "image": "https://...",
          "currentStreak": 5,
          "longestStreak": 10
        },
        "createdAt": "2025-01-10T10:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

### POST /api/friends

Send a friend request.

**Auth:** Required

**Request Body:**
```json
{
  "friendEmail": "friend@example.com"
}
```

### PATCH /api/friends/[id]

Accept or decline a friend request.

**Auth:** Required

**Request Body:**
```json
{
  "action": "accept" | "decline"
}
```

### DELETE /api/friends/[id]

Remove a friend or cancel sent request.

**Auth:** Required

---

## Challenge System APIs

### POST /api/challenges

Create a new challenge.

**Auth:** Required

**Request Body:**
```json
{
  "challengedId": "cm...",
  "quizId": "cm...",
  "expiresInHours": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "cm...",
      "status": "PENDING",
      "expiresAt": "2025-01-17T10:00:00.000Z",
      "quiz": {...},
      "challenger": {...},
      "challenged": {...}
    }
  }
}
```

### GET /api/challenges

List challenges with filters.

**Auth:** Required

**Query Parameters:**
- `type`: `sent` | `received` (filter by your role)
- `status`: `PENDING` | `ACCEPTED` | `COMPLETED` | `DECLINED` | `EXPIRED`
- `page`, `limit` for pagination

### GET /api/challenges/[id]

Get challenge details.

**Auth:** Required (must be participant)

**Response:**
```json
{
  "success": true,
  "data": {
    "challenge": {
      "id": "cm...",
      "status": "COMPLETED",
      "challengerScore": 85.5,
      "challengedScore": 92.0,
      "expiresAt": "2025-01-17T10:00:00.000Z",
      "quiz": {...},
      "challenger": {...},
      "challenged": {...}
    },
    "winner": "challenged"
  }
}
```

### PATCH /api/challenges/[id]/accept

Accept a challenge.

**Auth:** Required (must be challenged user)

**Validation:**
- Challenge must be PENDING
- Must not be expired
- Only challenged user can accept

### PATCH /api/challenges/[id]/decline

Decline a challenge.

**Auth:** Required (must be challenged user)

### DELETE /api/challenges/[id]

Cancel a challenge (sent challenges only).

**Auth:** Required (must be challenger)

---

## Notification APIs

### GET /api/notifications

List user notifications.

**Auth:** Required

**Query Parameters:**
- `unreadOnly`: true | false
- `limit` (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "cm...",
        "type": "FRIEND_REQUEST",
        "content": "{\"title\":\"New friend request\",\"fromUserId\":\"cm...\"}",
        "read": false,
        "createdAt": "2025-01-16T10:00:00.000Z"
      }
    ],
    "unreadCount": 5
  }
}
```

**Notification Types:**
- `FRIEND_REQUEST` - New friend request received
- `FRIEND_ACCEPTED` - Friend request accepted
- `CHALLENGE_RECEIVED` - New challenge received
- `CHALLENGE_ACCEPTED` - Challenge accepted
- `CHALLENGE_COMPLETED` - Challenge completed
- `BADGE_EARNED` - New badge unlocked
- `QUIZ_REMINDER` - Quiz reminder
- `LEADERBOARD_POSITION` - Leaderboard update

### PATCH /api/notifications/[id]

Mark notification as read.

**Auth:** Required (must be notification owner)

### DELETE /api/notifications/[id]

Delete a notification.

**Auth:** Required (must be notification owner)

### PATCH /api/notifications/read-all

Mark all notifications as read.

**Auth:** Required

---

## User Profile APIs

### GET /api/users/me

Get current user's full profile.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...",
      "email": "user@example.com",
      "name": "John Doe",
      "image": "https://...",
      "bio": "Sports enthusiast",
      "favoriteTeams": ["Lakers", "Patriots"],
      "currentStreak": 5,
      "longestStreak": 10,
      "totalPoints": 1500,
      "role": "USER",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

### PATCH /api/users/me

Update current user's profile.

**Auth:** Required

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio",
  "favoriteTeams": ["Lakers", "Patriots", "Yankees"]
}
```

### GET /api/users/[id]

Get public profile of any user.

**Auth:** Optional

### GET /api/users/me/stats

Get detailed statistics for current user.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalAttempts": 25,
      "averageScore": 78.5,
      "passedQuizzes": 18,
      "passRate": 72,
      "currentStreak": 5,
      "longestStreak": 10
    },
    "topTopics": [...],
    "recentAttempts": [...],
    "leaderboardPositions": [...]
  }
}
```

### GET /api/users/[id]/stats

Get public statistics for a user.

**Auth:** Optional

### GET /api/users/me/badges

Get current user's badge progress.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "earnedBadges": [...],
    "availableBadges": [...],
    "totalEarned": 3,
    "totalAvailable": 8
  }
}
```

### GET /api/users/[id]/badges

Get badge progress for any user.

**Auth:** Optional

---

## Badge APIs

### GET /api/badges

List all available badges.

**Auth:** Optional

**Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "cm...",
        "name": "Early Bird",
        "description": "Complete your first quiz",
        "imageUrl": "/badges/early-bird.png",
        "criteria": {"type": "quiz_complete", "count": 1},
        "_count": {
          "userBadges": 150
        }
      }
    ]
  }
}
```

---

## Leaderboard APIs

### GET /api/leaderboards/global

Global leaderboard across all quizzes.

**Auth:** Optional

**Query Parameters:**
- `timeframe`: `allTime` | `monthly` | `weekly`
- `limit` (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "cm...",
          "name": "Top Player",
          "image": "https://..."
        },
        "totalPoints": 5000,
        "quizzesCompleted": 50,
        "averageScore": 92.5
      }
    ],
    "timeframe": "allTime"
  }
}
```

### GET /api/leaderboards/quiz/[id]

Leaderboard for a specific quiz.

**Query Parameters:**
- `limit` (default: 100)

### GET /api/leaderboards/topic/[id]

Leaderboard for a topic.

**Query Parameters:**
- `limit` (default: 100)

### GET /api/leaderboards/friends

Leaderboard of your friends.

**Auth:** Required

---

## Quiz Attempt APIs

### POST /api/attempts

Start a new quiz attempt.

**Auth:** Required

**Request Body:**
```json
{
  "quizId": "cm...",
  "isPracticeMode": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "cm...",
    "quizConfig": {...}
  }
}
```

### GET /api/attempts/[id]/next

Get next question in attempt.

**Auth:** Required

### POST /api/attempts/[id]/answer

Submit answer for current question.

**Auth:** Required

**Request Body:**
```json
{
  "questionId": "cm...",
  "answerId": "cm...",
  "timeSpent": 15
}
```

### POST /api/attempts/[id]/complete

Complete the quiz attempt.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "score": 85.5,
      "passed": true,
      "correctAnswers": 8,
      "totalQuestions": 10
    },
    "awardedBadges": ["Early Bird"],
    "progression": {...},
    "answers": [...]
  }
}
```

---

## Content Moderation APIs

### POST /api/questions/[id]/report

Report a question.

**Auth:** Required

**Request Body:**
```json
{
  "reason": "INCORRECT" | "INAPPROPRIATE" | "OFFENSIVE" | "DUPLICATE" | "OTHER",
  "description": "Detailed explanation of the issue"
}
```

### GET /api/admin/reports

List all reports (admin only).

**Auth:** Admin required

**Query Parameters:**
- `status`: `PENDING` | `REVIEWED` | `RESOLVED` | `DISMISSED`
- `page`, `limit`

### PATCH /api/admin/reports/[id]

Update report status (admin only).

**Auth:** Admin required

**Request Body:**
```json
{
  "status": "RESOLVED"
}
```

---

## Admin APIs

### Quiz Management

**GET /api/admin/quizzes** - List all quizzes with filters
**GET /api/admin/quizzes/[id]** - Get quiz details
**POST /api/admin/quizzes** - Create new quiz
**PATCH /api/admin/quizzes/[id]** - Update quiz
**DELETE /api/admin/quizzes/[id]** - Delete quiz
**POST /api/admin/quizzes/import** - Import quiz with questions
**GET /api/admin/quizzes/[id]/questions** - List quiz questions
**PATCH /api/admin/quizzes/[id]/questions** - Update question order
**DELETE /api/admin/quizzes/[quizId]/questions/[poolId]** - Remove question from pool
**PATCH /api/admin/quizzes/[quizId]/questions/[poolId]** - Update question points

### Question Management

**GET /api/admin/questions** - List all questions with filters
**GET /api/admin/questions/[id]** - Get question details
**POST /api/admin/questions** - Create new question
**PATCH /api/admin/questions/[id]** - Update question
**DELETE /api/admin/questions/[id]** - Delete question

### Topic Management

**GET /api/admin/topics** - List all topics
**GET /api/admin/topics/[id]** - Get topic details
**POST /api/admin/topics** - Create new topic
**PATCH /api/admin/topics/[id]** - Update topic
**DELETE /api/admin/topics/[id]** - Delete topic (if no dependencies)

### User Management

**GET /api/admin/users** - List all users with filters
**GET /api/admin/users/[id]** - Get user details
**PATCH /api/admin/users/[id]** - Update user (role, status)
**DELETE /api/admin/users/[id]** - Delete user account

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate) |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication

Most endpoints require authentication via NextAuth session cookies.

**Public Endpoints** (no auth required):
- GET /api/quizzes
- GET /api/quizzes/[slug]
- GET /api/badges
- GET /api/users/[id]
- GET /api/users/[id]/stats
- GET /api/users/[id]/badges
- GET /api/leaderboards/*

**Protected Endpoints** (auth required):
- All POST, PATCH, DELETE requests
- /api/users/me/*
- /api/friends/*
- /api/challenges/*
- /api/notifications/*
- /api/attempts/*

**Admin Only Endpoints:**
- /api/admin/**

---

## Rate Limiting

Current implementation: No rate limiting (add in production)

Recommended limits:
- Public endpoints: 100 req/min
- Authenticated: 300 req/min
- Admin: 1000 req/min

---

## Best Practices

1. **Always paginate** - Use `page` and `limit` for large datasets
2. **Handle errors gracefully** - Check `success` field in responses
3. **Use appropriate filters** - Combine filters to reduce data transfer
4. **Respect auth requirements** - Include session cookies
5. **Validate input** - All endpoints use Zod validation
6. **Optimize queries** - Use specific fields when possible

---

## Future Enhancements

Planned features:
- [ ] Multiple topic filtering (`topics=cricket,basketball`)
- [ ] Multiple tag filtering (`tags=champions,playoffs`)
- [ ] Date range filters (created between X and Y)
- [ ] Attempted vs not-attempted filter (for logged-in users)
- [ ] Personalized recommendations
- [ ] Saved/bookmarked quizzes filter
- [ ] GraphQL API alternative
- [ ] WebSocket support for real-time updates
- [ ] Rate limiting implementation
- [ ] API versioning (v2)


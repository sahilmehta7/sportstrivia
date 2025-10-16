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

## Future Enhancements

Planned features:
- [ ] Multiple topic filtering (`topics=cricket,basketball`)
- [ ] Multiple tag filtering (`tags=champions,playoffs`)
- [ ] Date range filters (created between X and Y)
- [ ] Attempted vs not-attempted filter (for logged-in users)
- [ ] Personalized recommendations
- [ ] Saved/bookmarked quizzes filter


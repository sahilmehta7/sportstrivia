# Question API Testing Guide

## ✅ Available Question Features

All the features you requested are already implemented! Here's how they work:

---

## 1. Get Question by ID ✅

**Endpoint**: `GET /api/admin/questions/[id]`

### Example
```bash
# Replace {question-id} with actual question ID
curl http://localhost:3000/api/admin/questions/{question-id}
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "cm...",
    "type": "MULTIPLE_CHOICE",
    "topicId": "cm...",
    "difficulty": "EASY",
    "questionText": "How many players are there in a cricket team?",
    "hint": "Think of a standard team size",
    "explanation": "A cricket team consists of 11 players",
    "randomizeAnswerOrder": false,
    "timeLimit": null,
    "topic": {
      "id": "cm...",
      "name": "Cricket",
      "slug": "cricket"
    },
    "answers": [
      {
        "id": "cm...",
        "answerText": "11",
        "isCorrect": true,
        "displayOrder": 0
      },
      {
        "id": "cm...",
        "answerText": "10",
        "isCorrect": false,
        "displayOrder": 1
      }
    ],
    "quizPools": [
      {
        "quiz": {
          "id": "cm...",
          "title": "Cricket Basics",
          "slug": "cricket-basics"
        }
      }
    ]
  }
}
```

---

## 2. Get Questions by Topic and Difficulty ✅

**Endpoint**: `GET /api/admin/questions`

### Supported Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `topicId` | string | Filter by topic ID | `?topicId=cm...` |
| `difficulty` | enum | EASY, MEDIUM, or HARD | `?difficulty=EASY` |
| `type` | enum | Question type | `?type=MULTIPLE_CHOICE` |
| `search` | string | Search in question text | `?search=cricket` |
| `page` | integer | Page number | `?page=1` |
| `limit` | integer | Results per page | `?limit=20` |

### Examples

#### Get all EASY Cricket questions
```bash
curl 'http://localhost:3000/api/admin/questions?topicId={cricket-topic-id}&difficulty=EASY'
```

#### Get HARD questions from any topic
```bash
curl 'http://localhost:3000/api/admin/questions?difficulty=HARD&limit=10'
```

#### Search for specific questions
```bash
curl 'http://localhost:3000/api/admin/questions?search=championship&difficulty=MEDIUM'
```

#### Combined filters
```bash
curl 'http://localhost:3000/api/admin/questions?topicId={id}&difficulty=MEDIUM&type=MULTIPLE_CHOICE&page=1&limit=20'
```

### Response
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "cm...",
        "questionText": "...",
        "difficulty": "EASY",
        "topic": {
          "id": "cm...",
          "name": "Cricket",
          "slug": "cricket"
        },
        "answers": [...]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

## 3. Randomize Question Order ✅

**How It Works**: Controlled by the `randomizeQuestionOrder` field in the Quiz model.

### Configuration

When creating/editing a quiz, set:
```json
{
  "randomizeQuestionOrder": true
}
```

### Implementation

When a user starts a quiz attempt (`POST /api/attempts`):

1. Questions are selected based on quiz mode
2. **IF** `randomizeQuestionOrder` is `true`:
   - Questions are shuffled using `Math.random()`
   - Each user gets questions in a different order
3. The shuffled order is saved in the attempt

### Code Location
```typescript
// app/api/attempts/route.ts lines 106-109
if (quiz.randomizeQuestionOrder) {
  selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
}
```

### Testing

```bash
# 1. Create a quiz with randomizeQuestionOrder: true
curl -X POST http://localhost:3000/api/admin/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Randomized Quiz",
    "randomizeQuestionOrder": true,
    ...
  }'

# 2. Start quiz attempt multiple times
curl -X POST http://localhost:3000/api/attempts \
  -H "Content-Type: application/json" \
  -d '{"quizId": "..."}'

# 3. Each attempt will have questions in different order
```

---

## 4. Randomize Answer Options Order ✅

**How It Works**: Controlled by the `randomizeAnswerOrder` field in the Question model (per question).

### Configuration

When creating/editing a question, set:
```json
{
  "questionText": "What is the capital of France?",
  "randomizeAnswerOrder": true,
  "answers": [...]
}
```

### Implementation

When a user starts a quiz attempt:

1. For each question, check `randomizeAnswerOrder`
2. **IF** `randomizeAnswerOrder` is `true`:
   - Answers are shuffled using `Math.random()`
   - Correct answer appears in random position
3. **ELSE**:
   - Answers are shown in `displayOrder`

### Code Location
```typescript
// app/api/attempts/route.ts lines 146-151
answers: q.answers
  .sort((a: any, b: any) => 
    q.randomizeAnswerOrder 
      ? Math.random() - 0.5 
      : a.displayOrder - b.displayOrder
  )
```

### Benefits

- Prevents users from memorizing answer positions
- Each attempt shows answers in different order
- Configurable per question (some randomized, some not)

### Testing

```bash
# 1. Create question with randomized answers
curl -X POST http://localhost:3000/api/admin/questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Which team won the 2023 NBA Championship?",
    "topicId": "...",
    "difficulty": "EASY",
    "randomizeAnswerOrder": true,
    "answers": [
      {"answerText": "Denver Nuggets", "isCorrect": true},
      {"answerText": "Miami Heat", "isCorrect": false},
      {"answerText": "Lakers", "isCorrect": false}
    ]
  }'

# 2. Start quiz with this question
# Each attempt will show answers in different order
```

---

## Complete Test Workflow

### Setup: Create Test Data

```bash
# 1. Create a topic
curl -X POST http://localhost:3000/api/admin/topics \
  -d '{"name": "NBA", "slug": "nba"}'
# Note the returned topic ID

# 2. Create questions with different settings
curl -X POST http://localhost:3000/api/admin/questions \
  -d '{
    "topicId": "{topic-id}",
    "difficulty": "EASY",
    "questionText": "Who won 2023 NBA Championship?",
    "randomizeAnswerOrder": true,
    "answers": [
      {"answerText": "Denver Nuggets", "isCorrect": true, "displayOrder": 0},
      {"answerText": "Miami Heat", "isCorrect": false, "displayOrder": 1},
      {"answerText": "Lakers", "isCorrect": false, "displayOrder": 2}
    ]
  }'

# 3. Create more questions with different difficulties
curl -X POST http://localhost:3000/api/admin/questions \
  -d '{
    "topicId": "{topic-id}",
    "difficulty": "HARD",
    "questionText": "Most NBA championships?",
    "randomizeAnswerOrder": false,
    "answers": [...]
  }'
```

### Test 1: Filter Questions by Topic and Difficulty

```bash
# Get all EASY NBA questions
curl 'http://localhost:3000/api/admin/questions?topicId={topic-id}&difficulty=EASY'

# Get all HARD questions
curl 'http://localhost:3000/api/admin/questions?difficulty=HARD'
```

### Test 2: Create Quiz with Randomization

```bash
curl -X POST http://localhost:3000/api/admin/quizzes \
  -d '{
    "title": "NBA Quiz with Randomization",
    "slug": "nba-random",
    "difficulty": "MEDIUM",
    "questionSelectionMode": "FIXED",
    "randomizeQuestionOrder": true,
    "passingScore": 70
  }'
# Note the quiz ID
```

### Test 3: Add Questions to Quiz

```bash
# Use the quiz question pool API (when implemented)
# Or import via JSON
```

### Test 4: Start Quiz Attempt (Tests Randomization)

```bash
# First attempt
curl -X POST http://localhost:3000/api/attempts \
  -d '{"quizId": "{quiz-id}"}'
# Note question order and answer order

# Second attempt  
curl -X POST http://localhost:3000/api/attempts \
  -d '{"quizId": "{quiz-id}"}'
# Compare - should be different if randomization is on
```

---

## Advanced Features

### 1. Topic Hierarchy

Questions from parent topics include child topics:

```bash
# If you have: Sports > Cricket > Batting
# Searching for "Cricket" will also return "Batting" questions
```

### 2. Question Statistics

Each question tracks:
- `timesAnswered` - How many times attempted
- `timesCorrect` - How many times answered correctly

### 3. Question Types

Currently supported (extensible):
- `MULTIPLE_CHOICE` ✅
- `FILL_BLANK` (schema ready)
- `FLASHCARD` (schema ready)
- `IMAGE_BASED` (schema ready)

### 4. Per-Question Time Limits

```json
{
  "questionText": "Quick thinking question",
  "timeLimit": 30  // 30 seconds for this question
}
```

---

## Summary Table

| Feature | Status | Configuration | API Endpoint |
|---------|--------|---------------|--------------|
| Get by ID | ✅ | N/A | `GET /api/admin/questions/[id]` |
| Filter by Topic | ✅ | `?topicId=...` | `GET /api/admin/questions` |
| Filter by Difficulty | ✅ | `?difficulty=EASY` | `GET /api/admin/questions` |
| Search Questions | ✅ | `?search=...` | `GET /api/admin/questions` |
| Randomize Questions | ✅ | `quiz.randomizeQuestionOrder` | `POST /api/attempts` |
| Randomize Answers | ✅ | `question.randomizeAnswerOrder` | `POST /api/attempts` |
| Pagination | ✅ | `?page=1&limit=20` | `GET /api/admin/questions` |
| Question Types | ✅ | `?type=MULTIPLE_CHOICE` | `GET /api/admin/questions` |

---

## Code References

### Question Filtering
- **File**: `app/api/admin/questions/route.ts`
- **Lines**: 8-81

### Question Randomization
- **File**: `app/api/attempts/route.ts`
- **Lines**: 106-109

### Answer Randomization
- **File**: `app/api/attempts/route.ts`
- **Lines**: 146-151

### Topic-based Random Selection
- **File**: `app/api/attempts/route.ts`  
- **Lines**: 70-92

---

## Next Steps

All question features are working! You can now:

1. ✅ Query questions by topic and difficulty
2. ✅ Get individual questions by ID
3. ✅ Create quizzes with randomized question order
4. ✅ Create questions with randomized answer order
5. ✅ Test the complete quiz-taking flow

The randomization ensures each quiz attempt is unique and prevents answer memorization!


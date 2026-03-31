# Question Pool Manager - Complete Guide

## ✅ Question Pool Management System Complete!

You can now add, remove, and reorder questions in any quiz!

---

## 🎯 Features

### Question Pool Management Page (`/admin/quizzes/[id]/questions`)

**Features:**
- ✅ View all questions in quiz
- ✅ Drag-and-drop reordering
- ✅ Add questions from global pool
- ✅ Remove questions from quiz
- ✅ Adjust points per question
- ✅ Search and filter available questions
- ✅ Save order and points
- ✅ Real-time updates

---

## 🎨 User Interface

### Main View (Questions in Quiz)

```
┌─────────────────────────────────────────────────┐
│ Manage Questions: NBA Quiz                     │
│ 5 questions • Drag to reorder • Adjust points  │
│                              [Add Questions] [Save] │
├─────────────────────────────────────────────────┤
│ ☰ Question 1: Who won 2023 NBA Championship?   │
│   NBA • EASY • 4 answers            [1] [🗑️]   │
├─────────────────────────────────────────────────┤
│ ☰ Question 2: How many players on court?       │
│   Basketball • MEDIUM • 4 answers   [2] [🗑️]   │
├─────────────────────────────────────────────────┤
│ ☰ Question 3: What is a slam dunk?             │
│   NBA • EASY • 3 answers            [1] [🗑️]   │
└─────────────────────────────────────────────────┘
```

### Add Questions Dialog

```
┌─────────────────────────────────────────────────┐
│ Add Questions to Quiz                           │
├─────────────────────────────────────────────────┤
│ [Search] [Topic ▼] [Difficulty ▼]             │
├─────────────────────────────────────────────────┤
│ Available Questions:                            │
│                                                 │
│ Question: What is LBW in cricket?              │
│ Cricket • MEDIUM • 4 answers         [+ Add]   │
│                                                 │
│ Question: How many balls in an over?           │
│ Bowling • HARD • 4 answers           [+ Add]   │
└─────────────────────────────────────────────────┘
```

---

## 🔌 API Integration

### New Endpoints Created

#### 1. Get Quiz Questions
```
GET /api/admin/quizzes/[id]/questions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "cm...",
      "title": "NBA Quiz"
    },
    "questions": [
      {
        "poolId": "cm...",
        "questionId": "cm...",
        "order": 1,
        "points": 1,
        "question": {
          "id": "cm...",
          "questionText": "Who won 2023 NBA Championship?",
          "difficulty": "EASY",
          "topic": { "name": "NBA" },
          "answers": [...]
        }
      }
    ]
  }
}
```

#### 2. Add Question to Quiz
```
POST /api/admin/quizzes/[id]/questions
```

**Request:**
```json
{
  "questionId": "cm...",
  "order": 3,      // Optional - auto-calculated if not provided
  "points": 2      // Optional - defaults to 1
}
```

**Features:**
- ✅ Validates question exists
- ✅ Prevents duplicate additions
- ✅ Auto-calculates order if not specified
- ✅ Returns complete question data

#### 3. Update Question Order/Points
```
PATCH /api/admin/quizzes/[id]/questions
```

**Request:**
```json
{
  "questions": [
    { "questionId": "cm...", "order": 1, "points": 1 },
    { "questionId": "cm...", "order": 2, "points": 2 },
    { "questionId": "cm...", "order": 3, "points": 1 }
  ]
}
```

**Features:**
- ✅ Batch update all questions at once
- ✅ Atomic transaction
- ✅ Updates order and points simultaneously

#### 4. Remove Question from Quiz
```
DELETE /api/admin/quizzes/[id]/questions?questionId={question-id}
```

**Features:**
- ✅ Removes from quiz pool
- ✅ Question remains in global pool
- ✅ Can be re-added later

---

## 🎮 User Workflows

### Workflow 1: Add Questions to New Quiz

1. Create quiz at `/admin/quizzes/new`
2. Click "Create Quiz"
3. Redirected to edit page
4. Click "Manage Questions" button
5. Click "Add Questions"
6. Search/filter for questions
7. Click "+" to add each question
8. Click "Save Order & Points"

### Workflow 2: Reorder Questions (FIXED Mode)

1. Go to quiz questions page
2. Drag question by the grip handle (☰)
3. Drop in new position
4. Questions automatically renumber
5. Click "Save Order & Points"
6. Order saved!

### Workflow 3: Adjust Question Points

1. Go to quiz questions page
2. See points input for each question
3. Change points (e.g., from 1 to 2)
4. Points update in real-time
5. Click "Save Order & Points"
6. Weighted scoring applied!

### Workflow 4: Remove Questions

1. Go to quiz questions page
2. Click trash icon on question
3. Question removed from quiz
4. Question still exists in global pool
5. Can be re-added if needed

### Workflow 5: Build Quiz from Scratch

1. Create quiz with basic info
2. Click "Manage Questions"
3. Add questions by:
   - Searching by keyword
   - Filtering by topic
   - Filtering by difficulty
4. Drag to desired order
5. Adjust points for harder questions
6. Save!

---

## 🎨 UI Features

### Drag-and-Drop

**Visual Feedback:**
- Grip handle (☰) shows draggable
- Opacity changes while dragging
- Smooth animations
- Drop zones highlighted

**How It Works:**
- Click and hold grip handle
- Drag question up or down
- Drop in new position
- Order numbers update automatically

**Library:** @dnd-kit (lightweight, accessible)

### Points Adjustment

**Features:**
- Number input for each question
- Min value: 1
- Real-time update
- Saves with order

**Use Cases:**
- Harder questions worth more points
- Bonus questions
- Weighted scoring
- Fine-tune difficulty balance

### Search & Filter

**In Add Dialog:**
- Search by question text
- Filter by topic
- Filter by difficulty
- Combine filters
- Real-time results

**Smart Filtering:**
- Only shows questions NOT in quiz
- Updates as you add questions
- Shows relevant metadata

---

## 💡 Smart Features

### Auto-Order Calculation

When adding a question without specifying order:
```typescript
// Automatically appends to end
const maxOrder = currentMax || 0;
newOrder = maxOrder + 1;
```

### Duplicate Prevention

```typescript
// Cannot add same question twice
if (questionAlreadyInQuiz) {
  throw new Error("Question is already in this quiz");
}
```

### Empty State Handling

```
No questions in quiz yet:
┌─────────────────────────────┐
│  No questions in this quiz  │
│                             │
│     [Add Questions]         │
└─────────────────────────────┘
```

### Usage Information

Each question shows:
- Question text (truncated)
- Topic badge
- Difficulty badge
- Answer count
- Current points
- Order number

---

## 🔗 Integration

### Quiz List Page

**Enhanced:**
- Added "Questions (3)" button
- Quick access to question management
- Shows question count

**Before:**
```
[Edit]
```

**After:**
```
[Questions (3)] [Edit]
```

### Quiz Edit Page

**Enhanced:**
- Added "Manage Questions" button in header
- Click to go directly to question pool
- Return to edit after managing

**Navigation Flow:**
```
Edit Quiz → Manage Questions → Edit Quiz
```

---

## 🧪 Testing Guide

### Test 1: Add Questions to Quiz

```bash
# 1. Create a quiz (note the ID)
POST /api/admin/quizzes
{ "title": "Test Quiz" }

# 2. Get quiz ID from response

# 3. Add a question
POST /api/admin/quizzes/{quiz-id}/questions
{ "questionId": "{question-id}" }

# 4. Verify added
GET /api/admin/quizzes/{quiz-id}/questions
```

### Test 2: Reorder Questions

```bash
# Get current order
GET /api/admin/quizzes/{quiz-id}/questions

# Update order
PATCH /api/admin/quizzes/{quiz-id}/questions
{
  "questions": [
    { "questionId": "q1", "order": 3, "points": 1 },
    { "questionId": "q2", "order": 1, "points": 1 },
    { "questionId": "q3", "order": 2, "points": 2 }
  ]
}
```

### Test 3: Remove Question

```bash
DELETE /api/admin/quizzes/{quiz-id}/questions?questionId={question-id}
```

---

## 🎯 Use Cases

### Use Case 1: Build Beginner Quiz

1. Create quiz: "Basketball Basics"
2. Manage Questions
3. Filter: Topic = Basketball, Difficulty = EASY
4. Add 10 questions
5. All worth 1 point
6. Save!

### Use Case 2: Create Challenge Quiz

1. Create quiz: "NBA Expert Challenge"
2. Manage Questions
3. Add 5 EASY questions (1 point each)
4. Add 5 MEDIUM questions (2 points each)
5. Add 5 HARD questions (3 points each)
6. Reorder to mix difficulties
7. Save!

### Use Case 3: Update Existing Quiz

1. Edit quiz
2. Manage Questions
3. Remove outdated questions
4. Add new questions
5. Reorder for better flow
6. Adjust points
7. Save!

---

## 📊 Question Pool Data

### QuizQuestionPool Model

```prisma
model QuizQuestionPool {
  id         String   @id @default(cuid())
  quizId     String
  questionId String
  order      Int?     // For FIXED mode
  points     Int      @default(1)  // Point weighting
  
  quiz     Quiz     @relation(...)
  question Question @relation(...)
  
  @@unique([quizId, questionId])
}
```

**Fields:**
- `order` - Position in quiz (null for random modes)
- `points` - How much this question is worth
- Unique constraint prevents duplicates

---

## 🔒 Safety Features

### Validation

**Adding Questions:**
- ✅ Quiz must exist
- ✅ Question must exist
- ✅ Cannot add duplicate
- ✅ Order auto-calculated

**Removing Questions:**
- ✅ Question must be in quiz
- ✅ Removes from pool only
- ✅ Question stays in global pool
- ✅ Can be re-added later

**Updating Order:**
- ✅ Atomic transaction
- ✅ All questions update together
- ✅ Rollback on error

### Data Integrity

- ✅ Foreign key constraints
- ✅ Unique constraints
- ✅ Validation before save
- ✅ Error messages

---

## 📱 Responsive Design

**Desktop:**
- Full drag-and-drop
- All columns visible
- Side-by-side layout

**Tablet:**
- Vertical scrolling
- Touch-friendly drag
- Simplified view

**Mobile:**
- Stacked questions
- Touch drag support
- Essential info only

---

## 🎨 Visual Design

### Question Cards

```
┌─────────────────────────────────────────────┐
│ ☰  Question text truncated...               │
│    [Topic Badge] [Difficulty] 4 answers     │
│                              [1 pts] [🗑️]   │
└─────────────────────────────────────────────┘
```

### Add Dialog

```
┌────────────────────────────────────────┐
│ Add Questions to Quiz            [×]   │
├────────────────────────────────────────┤
│ [🔍 Search] [Topic ▼] [Difficulty ▼] │
├────────────────────────────────────────┤
│ Available Questions (15)               │
│                                        │
│ ┌────────────────────────────────┐   │
│ │ Question 1                 [+] │   │
│ │ Topic • Difficulty • Answers   │   │
│ └────────────────────────────────┘   │
│                                        │
│ ┌────────────────────────────────┐   │
│ │ Question 2                 [+] │   │
│ │ Topic • Difficulty • Answers   │   │
│ └────────────────────────────────┘   │
└────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Access Question Manager

**Method 1: From Quiz List**
1. Go to `/admin/quizzes`
2. Click "Questions (3)" button on any quiz
3. Opens question manager

**Method 2: From Quiz Edit**
1. Edit any quiz
2. Click "Manage Questions" in header
3. Opens question manager

### Add Questions

1. Click "Add Questions" button
2. Search or filter for questions
3. Click "+" on questions you want
4. Questions added immediately
5. Close dialog

### Reorder Questions

1. Click and hold grip handle (☰)
2. Drag question up or down
3. Drop in new position
4. Order numbers update
5. Click "Save Order & Points"

### Remove Questions

1. Click trash icon (🗑️)
2. Question removed immediately
3. Still exists in global pool
4. Can be re-added later

### Adjust Points

1. Change number in points input
2. Updates in real-time
3. Click "Save Order & Points"
4. Weighted scoring applied

---

## 📋 Complete Workflow Example

### Build "NBA Legends Quiz"

**Step 1: Create Quiz**
```
/admin/quizzes/new
- Title: "NBA Legends Quiz"
- Difficulty: MEDIUM
- Passing Score: 70%
- Question Selection: FIXED
- Save
```

**Step 2: Manage Questions**
```
Click "Manage Questions"
→ Opens /admin/quizzes/{id}/questions
```

**Step 3: Add EASY Questions**
```
Click "Add Questions"
Filter: Difficulty = EASY
Add 3 questions (1 point each)
```

**Step 4: Add MEDIUM Questions**
```
Filter: Difficulty = MEDIUM
Add 4 questions (2 points each)
```

**Step 5: Add HARD Questions**
```
Filter: Difficulty = HARD
Add 3 questions (3 points each)
```

**Step 6: Organize**
```
Drag to reorder:
- Mix difficulties
- Start easy, get harder
- Or randomize
```

**Step 7: Save**
```
Click "Save Order & Points"
Done!
```

**Result:**
- 10 questions total
- Mixed difficulties
- Weighted scoring (1-3 points)
- Custom order

---

## 🎯 API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/quizzes/[id]/questions` | List questions in quiz |
| POST | `/api/admin/quizzes/[id]/questions` | Add question to quiz |
| PATCH | `/api/admin/quizzes/[id]/questions` | Update order/points |
| DELETE | `/api/admin/quizzes/[id]/questions?questionId=X` | Remove question |

---

## 💡 Advanced Features

### Weighted Scoring

**Example:**
```
Question 1 (EASY): 1 point
Question 2 (MEDIUM): 2 points
Question 3 (HARD): 3 points

User answers Q1 & Q3 correctly:
Score = (1 + 3) / (1 + 2 + 3) × 100 = 66.7%
```

### Auto-Order for Random Modes

For `TOPIC_RANDOM` and `POOL_RANDOM`:
- Order is null (not used)
- Questions selected randomly at quiz start
- Order set here doesn't matter

For `FIXED` mode:
- Order matters!
- Questions appear in specified order
- Use drag-and-drop to arrange

### Question Reusability

**Questions can be in multiple quizzes:**
```
Question "Who won 2023 NBA Championship?"
- Used in "NBA Champions Quiz"
- Used in "2023 Sports Recap"
- Used in "Basketball Trivia"
```

**Each quiz can have:**
- Different order
- Different points
- Different context

---

## 🔍 Search & Filter

### In Add Dialog

**Search:**
- Searches question text
- Case-insensitive
- Partial matches

**Topic Filter:**
- Hierarchical dropdown
- Shows all topics
- Indented by level

**Difficulty Filter:**
- EASY, MEDIUM, HARD
- Quick filtering

**Combined:**
```
Search: "championship"
Topic: Basketball
Difficulty: MEDIUM

→ Shows only MEDIUM Basketball questions about championships
```

---

## 🎨 UI Components

### Drag-and-Drop

**Technology:** @dnd-kit
- Accessible (keyboard support)
- Touch-friendly
- Smooth animations
- Visual feedback

**Features:**
- Vertical list sorting
- Closest center algorithm
- Pointer and keyboard sensors

### Question Cards

**Information Shown:**
- Question text (truncated if long)
- Topic badge
- Difficulty badge
- Answer count
- Points input
- Remove button

**Interactions:**
- Drag by grip handle
- Edit points inline
- Remove with one click

---

## 📊 Benefits

### For Quiz Creators

- ✅ Visual question management
- ✅ Easy to add/remove
- ✅ Intuitive reordering
- ✅ See all questions at once
- ✅ Adjust difficulty balance

### For Quiz Takers

- ✅ Well-organized quizzes
- ✅ Balanced difficulty
- ✅ Fair point distribution
- ✅ Better experience

### For Platform

- ✅ Reusable questions
- ✅ Consistent quality
- ✅ Easy maintenance
- ✅ Flexible organization

---

## 🚀 What This Enables

Now you can:

1. **Build Quizzes Efficiently**
   - Reuse existing questions
   - Mix and match from pool
   - Organize logically

2. **Create Themed Quizzes**
   - Filter by topic
   - Select relevant questions
   - Arrange for flow

3. **Balance Difficulty**
   - Mix easy, medium, hard
   - Adjust points per difficulty
   - Create fair challenges

4. **Maintain Content**
   - Update quizzes easily
   - Swap out questions
   - Keep content fresh

---

## ✅ Implementation Complete

**Files Created:**
- `app/api/admin/quizzes/[id]/questions/route.ts` - API endpoints
- `app/admin/quizzes/[id]/questions/page.tsx` - UI page

**Files Updated:**
- `app/admin/quizzes/[id]/edit/page.tsx` - Added "Manage Questions" button
- `app/admin/quizzes/page.tsx` - Added "Questions (N)" quick link

**Features:**
- ✅ Add questions to quiz
- ✅ Remove questions from quiz
- ✅ Reorder questions (drag-and-drop)
- ✅ Adjust points per question
- ✅ Search and filter questions
- ✅ Save order and points
- ✅ Complete API integration

---

## 🎉 Quiz Management Now Complete!

You can now:
- ✅ Create quizzes
- ✅ Edit quiz settings
- ✅ **Add/remove questions** 🆕
- ✅ **Reorder questions** 🆕
- ✅ **Adjust question points** 🆕
- ✅ Delete quizzes
- ✅ Import from JSON

**Full quiz content management system ready!** 🚀


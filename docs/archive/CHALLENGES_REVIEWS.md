# Challenges & Quiz Reviews - Feature Documentation

Complete implementation of social competition and quiz feedback features.

## Overview

Built two major social features that enable users to compete with friends and share feedback on quizzes.

---

## Quiz Reviews & Ratings System

### User Flow

```
Quiz Completion → Results Screen → "Rate this quiz" button →
Review Modal → Submit rating & comment → Review appears on Quiz Detail Page
```

### Components

#### 1. StarRating (`components/ui/star-rating.tsx`)
Reusable star rating component used throughout the app.

**Features:**
- Interactive mode for user input (click to rate)
- Read-only mode for display
- Hover effects with scale animation
- Three sizes: sm (4x4), md (5x5), lg (6x6)
- Optional value display (e.g., "4.5")
- Configurable max stars (default: 5)

**Usage:**
```tsx
// Interactive rating selector
<StarRating value={rating} onChange={setRating} size="lg" />

// Read-only display
<StarRating value={4.5} readonly showValue />
```

#### 2. ReviewModal (`components/quiz/ReviewModal.tsx`)
Modal dialog for submitting and editing quiz reviews.

**Features:**
- Star rating selector (required, 1-5 stars)
- Comment text area (optional, 500 char max)
- Character counter
- Dual mode: Create new or edit existing
- Form validation
- Loading state during submission
- Success/error toast notifications

**API Calls:**
- Create: `POST /api/quizzes/[slug]/reviews`
- Update: `PATCH /api/reviews/[id]`

**Props:**
```typescript
{
  quizSlug: string;        // Quiz identifier
  quizTitle: string;       // Display in header
  isOpen: boolean;         // Modal visibility
  onClose: () => void;     // Close handler
  onSuccess: () => void;   // Success callback
  existingReview?: {       // For editing
    id: string;
    rating: number;
    comment: string | null;
  };
}
```

#### 3. ReviewCard (`components/quiz/ReviewCard.tsx`)
Displays an individual quiz review.

**Features:**
- User avatar (links to profile)
- User name (links to profile)
- Star rating display (read-only)
- Review comment with "Read more" for long text
- Formatted date (e.g., "Jan 15, 2024")
- Edit/Delete buttons (only for own reviews)
- Delete confirmation dialog
- Responsive layout

**Actions:**
- Edit: Opens ReviewModal with existing data
- Delete: Confirms, then calls `DELETE /api/reviews/[id]`

#### 4. ReviewsList (`components/quiz/ReviewsList.tsx`)
Manages review listing with pagination.

**Features:**
- Displays reviews in cards
- Load more button (10 reviews per page)
- Pagination tracking
- Optimistic delete (instant UI update)
- Loading state with spinner
- Empty state when no reviews
- Edit modal integration

**State Management:**
- Tracks reviews array locally
- Updates on delete (optimistic)
- Reloads on edit success
- Fetches more on "Load More"

### Integration Points

#### Quiz Completion Flow (`components/quiz/QuizPlayClient.tsx`)

**Added:**
- `showReviewModal` state
- `hasReviewed` state
- ReviewModal component after results card
- "Rate this quiz" button in results actions
- Button hidden after review submitted

**Location:** Line 543-546 in results view

#### Quiz Detail Page (`app/quizzes/[slug]/page.tsx`)

**Added:**
- Server-side fetch of initial reviews (10)
- Reviews section after quiz details
- Average rating display with stars
- Review count summary
- ReviewsList component
- Empty state for no reviews

**Location:** Lines 376-413 (new reviews section)

**Data Fetching:**
```typescript
const reviews = await prisma.quizReview.findMany({
  where: { quiz: { slug } },
  include: { user: { select: { id, name, image } } },
  orderBy: { createdAt: "desc" },
  take: 10,
});
```

---

## Challenges System

### User Flow

```
User clicks "Challenge" → Modal opens → Selects friend & quiz →
Challenge sent → Friend receives → Accepts → Both take quiz →
Results comparison modal shows winner
```

### Components

#### 1. CreateChallengeModal (`components/challenges/CreateChallengeModal.tsx`)
Modal for creating new challenges.

**Features:**
- Friend selector (from user's friends list)
- Quiz selector (published quizzes with difficulty)
- Expiration dropdown (24h, 48h, 7 days)
- Preselect friend OR quiz (context-aware)
- Loading state while fetching data
- Validation before submit
- Auto-navigation to /challenges after success

**API Calls:**
- Fetch friends: `GET /api/friends?type=friends`
- Fetch quizzes: `GET /api/quizzes?limit=50&status=PUBLISHED`
- Create: `POST /api/challenges`

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedQuizId?: string;   // From quiz page
  preselectedFriendId?: string; // From friend card
}
```

#### 2. ChallengeCard (`components/challenges/ChallengeCard.tsx`)
Displays a challenge with all relevant information.

**Features:**
- VS layout (challenger vs challenged)
- User avatars (link to profiles)
- Quiz title (link to quiz)
- Quiz difficulty badge
- Status badge (Pending/Accepted/Completed/Declined/Expired)
- Score display with checkmarks when completed
- Context-aware action buttons
- Timestamp with relative date

**Actions Based on State:**
- **Pending (received):** Accept, Decline buttons
- **Accepted (not completed):** Take Quiz button
- **Accepted (both completed):** View Results button

**Layout:**
```
┌─────────────────────────────────┐
│ Challenge    [Status Badge]     │
│                                 │
│ [Quiz Title - Click to view]   │
│                                 │
│  [Avatar]   VS   [Avatar]      │
│  Challenger      Challenged     │
│  Score: 85%      Score: 92%     │
│                                 │
│ Jan 15 • 2:30 PM  [Actions]    │
└─────────────────────────────────┘
```

#### 3. ChallengeResultsModal (`components/challenges/ChallengeResultsModal.tsx`)
Shows detailed challenge results comparison.

**Features:**
- Winner announcement with trophy icon
- Gradient background for winner card
- Side-by-side score comparison
- Score difference calculation
- Tie handling (special UI)
- User avatars and names
- Actions: View Quiz, Take Quiz Again

**Winner Logic:**
- Challenger wins if score > challenged score
- Challenged wins if score > challenger score
- Tie if scores are exactly equal
- Visual winner indicator (border/background)

#### 4. ChallengesPage (`app/challenges/page.tsx`)
Main challenges dashboard with tabbed interface.

**Tabs:**

**Active Challenges:**
- Accepted challenges (in progress or completed)
- Shows both users' scores
- "View Results" for completed
- "Take Quiz" for incomplete
- Badge count for active challenges

**Received Requests:**
- Pending challenges from friends
- Accept/Decline actions
- Badge count (unread style)
- Empty state when none

**Sent Requests:**
- Challenges you initiated
- Waiting for friend to accept
- Cancel option
- Shows friend who was challenged

**Features:**
- Create New Challenge button (top right)
- Auto-refresh after actions
- Loading spinner during fetch
- Toast notifications for all actions
- Empty states with helpful messages

### Integration Points

#### Friend Card (`components/friends/FriendCard.tsx`)
**Added:**
- Challenge button (Swords icon)
- Opens CreateChallengeModal with friend preselected
- Click handler with modal state

#### Quiz Detail Page (`app/quizzes/[slug]/page.tsx`)
**Added:**
- ChallengeButton component (client wrapper)
- Positioned next to "Start Quiz" button
- Disabled when quiz not live
- Opens modal with quiz preselected

**File:** `app/quizzes/[slug]/challenge-button.tsx`

#### Main Navigation (`components/shared/MainNavigation.tsx`)
**Added:**
- Challenges link in nav bar
- Positioned between Leaderboard and Friends
- Active state highlighting

---

## API Integration Summary

### Reviews API

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/quizzes/[slug]/reviews` | GET | List reviews | Query: page, limit |
| `/api/quizzes/[slug]/reviews` | POST | Submit review | `{ rating, comment? }` |
| `/api/reviews/[id]` | PATCH | Update review | `{ rating, comment? }` |
| `/api/reviews/[id]` | DELETE | Delete review | - |

### Challenges API

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/challenges` | GET | List challenges | Query: type, status |
| `/api/challenges` | POST | Create challenge | `{ challengedId, quizId, expiresInHours }` |
| `/api/challenges/[id]` | GET | Get details | - |
| `/api/challenges/[id]/accept` | PATCH | Accept challenge | - |
| `/api/challenges/[id]/decline` | PATCH | Decline challenge | - |
| `/api/challenges/[id]` | DELETE | Cancel challenge | - |

---

## Testing Guide

### Review System Testing

**Test as:** `user@sportstrivia.com`

1. **Submit a Review**
   - Complete "Cricket Basics Quiz"
   - See "Rate this quiz" button in results
   - Click button, modal opens
   - Select 5 stars
   - Write comment: "Great quiz!"
   - Submit review
   - See success toast

2. **View Reviews**
   - Navigate to /quizzes/cricket-basics-quiz
   - Scroll to Reviews section
   - See your review listed
   - See average rating updated

3. **Edit Review**
   - Click Edit button on your review
   - Modal opens with existing data
   - Change rating to 4 stars
   - Update comment
   - Submit changes

4. **Delete Review**
   - Click Delete button
   - Confirm in dialog
   - See review removed
   - See total count updated

5. **Pagination**
   - If > 10 reviews exist
   - Click "Load More Reviews"
   - See next 10 reviews load

### Challenges System Testing

**Test as:** `user@sportstrivia.com` and `john@example.com`

1. **Create Challenge from Friend Card**
   - Go to /friends
   - Click Swords icon on John Doe's card
   - Modal opens with John preselected
   - Select "Cricket Basics Quiz"
   - Choose "24 hours" expiration
   - Submit challenge
   - Redirected to /challenges

2. **Create Challenge from Quiz Page**
   - Go to /quizzes/cricket-basics-quiz
   - Click "Challenge a Friend"
   - Modal opens with quiz preselected
   - Select friend
   - Submit challenge

3. **Receive and Accept Challenge** (as john@example.com)
   - Go to /challenges
   - Switch to "Received" tab
   - See pending challenge from Sample User
   - Click "Accept"
   - Challenge moves to Active tab

4. **Take Challenge Quiz**
   - In Active tab, find accepted challenge
   - Click "Take Quiz"
   - Complete quiz
   - Your score recorded

5. **View Results** (after both complete)
   - Go to /challenges → Active tab
   - Find completed challenge
   - Click "View Results"
   - Modal shows comparison
   - Winner highlighted
   - Score difference displayed

6. **Decline Challenge**
   - In Received tab
   - Click "Decline"
   - Challenge removed

7. **Cancel Sent Challenge**
   - Create challenge, don't let friend accept
   - Go to Sent tab
   - Click "Decline" to cancel
   - Challenge removed

---

## Edge Cases Handled

### Reviews
- ✓ User can only review once per quiz
- ✓ Button hidden after review submitted
- ✓ Can edit review multiple times
- ✓ Delete requires confirmation
- ✓ Long comments truncated with expand
- ✓ Empty state when no reviews
- ✓ Graceful error handling
- ✓ Character limit enforced (500)

### Challenges
- ✓ Can't challenge same friend twice for same quiz
- ✓ Both users must be friends
- ✓ Quiz must be published and live
- ✓ Expired challenges can't be accepted
- ✓ Can't accept own challenges
- ✓ Can't view results until both complete
- ✓ Empty states for all tabs
- ✓ Optimistic updates with error recovery

---

## Performance Optimizations

### Reviews
- Initial 10 reviews fetched server-side
- Pagination reduces initial load
- Optimistic delete (instant feedback)
- Client-side state management

### Challenges
- Parallel API calls for tabs
- Separate queries for each status
- Optimistic status updates
- Minimal re-fetching

---

## UI/UX Highlights

### Design Patterns
- Consistent card-based layouts
- Color-coded status badges
- Icon-based actions
- Responsive grids
- Empty states with CTAs

### Interactions
- Smooth modal transitions
- Toast notifications
- Loading spinners
- Hover effects
- Confirmation dialogs

### Accessibility
- ARIA labels on star buttons
- Keyboard navigation support
- Focus management in modals
- Semantic HTML structure

---

## Future Enhancements

### Reviews
- [ ] Sort options (newest, highest rated, most helpful)
- [ ] Filter by rating (1-5 stars)
- [ ] "Helpful" voting system
- [ ] Report inappropriate reviews
- [ ] Verified purchase badge
- [ ] Image uploads in reviews

### Challenges
- [ ] Real-time updates (WebSocket)
- [ ] Challenge leaderboard
- [ ] Multi-user tournaments
- [ ] Betting/wagering system
- [ ] Rematch quick action
- [ ] Challenge history view
- [ ] Shareable challenge links

---

## Database Schema Usage

### Reviews
```prisma
model QuizReview {
  id        String   @id @default(cuid())
  userId    String
  quizId    String
  rating    Int      // 1-5
  comment   String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(...)
  quiz Quiz @relation(...)
  
  @@unique([userId, quizId]) // One review per user per quiz
}
```

### Challenges
```prisma
model Challenge {
  id             String          @id @default(cuid())
  challengerId   String
  challengedId   String
  quizId         String
  challengerScore Float?
  challengedScore Float?
  status         ChallengeStatus @default(PENDING)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  challenger User @relation("Challenger", ...)
  challenged User @relation("Challenged", ...)
  quiz       Quiz @relation(...)
}

enum ChallengeStatus {
  PENDING   // Waiting for acceptance
  ACCEPTED  // Both can take quiz
  COMPLETED // Both finished
  DECLINED  // Rejected by challenged user
  EXPIRED   // Time limit passed
}
```

---

## Component Hierarchy

### Reviews
```
QuizDetailPage (server)
  └─ ReviewsList (client)
       ├─ ReviewCard (client)
       │    ├─ UserAvatar
       │    ├─ StarRating (readonly)
       │    └─ AlertDialog (delete confirm)
       └─ ReviewModal (client)
            └─ StarRating (interactive)

QuizPlayClient (results view)
  └─ ReviewModal (client)
       └─ StarRating (interactive)
```

### Challenges
```
ChallengesPage (client)
  ├─ CreateChallengeModal
  │    ├─ Friend Select
  │    ├─ Quiz Select
  │    └─ Expiration Select
  ├─ ChallengeCard (3 tabs)
  │    ├─ UserAvatar (2x)
  │    ├─ Quiz Link
  │    └─ Action Buttons
  └─ ChallengeResultsModal
       ├─ Winner Card
       ├─ Score Comparison
       └─ Action Buttons

FriendCard (client)
  └─ CreateChallengeModal
       (preselectedFriendId)

QuizDetailPage (server)
  └─ ChallengeButton (client)
       └─ CreateChallengeModal
            (preselectedQuizId)
```

---

## Success Metrics

### Reviews
- ✓ Users can rate quizzes (1-5 stars)
- ✓ Users can write text reviews (optional)
- ✓ Users can edit their reviews
- ✓ Users can delete their reviews
- ✓ Reviews display on quiz detail pages
- ✓ Average rating calculates correctly
- ✓ Review count updates in real-time
- ✓ Pagination handles large review lists

### Challenges
- ✓ Users can challenge friends
- ✓ Users can accept/decline challenges
- ✓ Both users can take the quiz
- ✓ Scores are tracked separately
- ✓ Winner determined correctly
- ✓ Tie handling works
- ✓ Results modal shows comparison
- ✓ Multiple challenges supported
- ✓ Status updates properly

### Integration
- ✓ Review prompt after quiz completion
- ✓ Challenge button on friend cards
- ✓ Challenge button on quiz pages
- ✓ Navigation link to challenges
- ✓ All flows are responsive
- ✓ All flows handle errors gracefully

---

## Error Handling

### Reviews
- Rating required validation
- Character limit enforcement
- Duplicate review prevention (API)
- Network error recovery
- Optimistic update revert on failure

### Challenges
- Friend selection required
- Quiz selection required
- Duplicate challenge prevention (API)
- Expired challenge rejection
- Permission validation (only challenged can accept)
- Network error recovery
- Loading states prevent double-submit

---

## Notifications Integration

### Challenge Notifications Created

When a challenge is created:
```typescript
await createNotification(challengedId, "CHALLENGE_RECEIVED", {
  challengerId: user.id,
  challengerName: user.name,
  quizTitle: quiz.title,
});
```

When accepted:
```typescript
await createNotification(challengerId, "CHALLENGE_ACCEPTED", {
  challengedId: user.id,
  challengedName: user.name,
  quizTitle: quiz.title,
});
```

Users receive notifications for:
- New challenges received
- Challenges accepted
- Challenges completed (both users)

---

## File Summary

### New Files (13)
```
components/ui/
  star-rating.tsx              (98 lines)
  alert-dialog.tsx             (145 lines)

components/quiz/
  ReviewModal.tsx              (167 lines)
  ReviewCard.tsx               (147 lines)
  ReviewsList.tsx              (142 lines)

components/challenges/
  CreateChallengeModal.tsx     (247 lines)
  ChallengeCard.tsx            (178 lines)
  ChallengeResultsModal.tsx    (147 lines)

app/challenges/
  page.tsx                     (298 lines)

app/quizzes/[slug]/
  challenge-button.tsx         (35 lines)
```

### Modified Files (11)
```
components/quiz/
  QuizPlayClient.tsx           (+15 lines - review integration)

components/friends/
  FriendCard.tsx               (+25 lines - challenge button)

components/shared/
  MainNavigation.tsx           (+1 line - challenges link)

app/quizzes/[slug]/
  page.tsx                     (+60 lines - reviews section)

app/admin/ (various)
  [Multiple files with linting fixes]
```

### Dependencies Added
```json
{
  "@radix-ui/react-alert-dialog": "latest"
}
```

---

## Deployment Notes

- ✓ All components TypeScript compliant
- ✓ No linting errors
- ✓ Production build successful (42 pages)
- ✓ Server/client component split correct
- ✓ API routes already deployed
- ✓ Database schema supports features
- ✓ Seed data includes sample reviews

**Build Output:**
```
✓ Compiled successfully in 6.4s
✓ Generating static pages (42/42)
Route (app)
  ├ /challenges              New route
  ├ /quizzes/[slug]          Updated with reviews
  └ ... (40 other routes)
```

---

## Conclusion

Complete social features implementation with:
- ✓ 9 new UI components
- ✓ 2 new feature pages
- ✓ Full quiz review system
- ✓ Complete challenges system
- ✓ Seamless integrations
- ✓ Production-ready code
- ✓ Comprehensive error handling
- ✓ Responsive design

Users can now:
- Rate and review quizzes
- Challenge friends to compete
- View detailed results comparisons
- Track active challenges
- Manage challenge requests

Ready for production deployment and user testing!


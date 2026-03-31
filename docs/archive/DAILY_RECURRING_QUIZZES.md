# Daily Recurring Quizzes Feature

## Overview
The Daily Recurring Quizzes feature displays quizzes that refresh daily, encouraging users to return and maintain streaks.

## Backend Implementation

### Database Schema
The `Quiz` model already includes:
- `recurringType: RecurringType` - Can be NONE, HOURLY, DAILY, or WEEKLY
- `lastRefreshedAt: DateTime?` - Tracks when the quiz was last refreshed

### Service Layer (`lib/services/public-quiz.service.ts`)

#### `getDailyRecurringQuizzes(userId?: string)`
Fetches all published quizzes with `recurringType = DAILY` and enriches them with user-specific data:

**Returns:**
```typescript
interface DailyQuizItem {
  id: string;
  slug: string;
  title: string;
  sport: string | null;
  difficulty: Difficulty;
  duration: number | null;
  descriptionImageUrl: string | null;
  description: string | null;
  completedToday: boolean;    // Has user completed today?
  streakCount: number;          // Consecutive days completed
}
```

**Features:**
- Fetches up to 5 daily quizzes (featured first)
- Checks if user completed quiz today
- Calculates consecutive day streak (up to 30 days back)
- Works for both authenticated and guest users

### Streak Calculation Logic
- Looks back 30 days at user's quiz attempts
- Counts consecutive days starting from today or yesterday
- Handles multiple attempts on same day (counts as one)
- Resets if user misses a day

## Frontend Implementation

### Components

#### `DailyQuizWidget` (`components/quizzes/daily-quiz-widget.tsx`)
Displays daily quizzes with:
- **Countdown timer** showing hours until reset
- **Main challenge** (first quiz) - Large, prominent card
- **Additional dailies** - Smaller cards
- **Completion badges** for completed quizzes
- **Streak indicators** with flame icon 🔥
- **Responsive layout** adapts to screen size

**Visual States:**
- Not completed: Primary CTA button
- Completed: Green completion badge + "Play Again" button
- Active streak: Orange flame icon with day count

### Integration (`app/quizzes/page.tsx`)
- Fetches daily quizzes with user session
- Passes real data to `DailyQuizWidget`
- Displays between Featured Hero and Coming Soon sections

## Admin Configuration

### Setting Up Daily Quizzes
1. Navigate to **Admin → Quizzes → Edit Quiz**
2. Scroll to **"Scheduling & Recurrence"** section
3. Set **Recurring Type** to "Daily"
4. Publish the quiz

**Important:**
- Quiz must be **Published** and have `status = PUBLISHED`
- Quiz must have `recurringType = DAILY`
- Featured daily quizzes appear first

## User Experience Flow

### For Guest Users
- See all daily quizzes
- No completion status or streaks
- Encouraged to sign in to track progress

### For Authenticated Users
1. **View daily challenges** on Quizzes page
2. **See current streak** for each quiz
3. **Complete quiz** to earn points and maintain streak
4. **Track reset countdown** (24 hours)
5. **Build consecutive day streaks**

### Streak Motivation
- Visual flame icon 🔥
- "X day streak!" text
- Resets if day is missed
- Encourages daily engagement

## API Endpoints

No new API endpoints required. Uses existing:
- `getPublicQuizList()` - For featured quizzes
- `getDailyRecurringQuizzes()` - New service function (server-side only)
- Session from `auth()` - For user identification

## Testing

### Creating Test Daily Quizzes
1. Create a quiz via Admin panel
2. Set `recurringType` to "DAILY"
3. Publish the quiz
4. Visit `/quizzes` to see it in Daily Challenge section

### Testing Streaks
1. Complete a daily quiz
2. Mark attempt as completed (ensure `completedAt` is set)
3. Repeat for consecutive days to build streak
4. Miss a day to see streak reset

## Future Enhancements

### Possible Additions
- Push notifications before daily reset
- Weekly/Monthly streak challenges
- Streak recovery tokens (don't break streak if missed 1 day)
- Leaderboard for longest streaks
- Special badges for milestone streaks (7, 30, 100 days)
- Daily quiz question previews
- Hourly and Weekly recurring quiz support

### Performance Optimizations
- Cache daily quizzes (Redis)
- Background job to refresh quiz pools
- Aggregate streak calculations

## Notes

- Dates use server timezone for consistency
- Streak calculation is performant (indexed queries)
- Component handles missing user session gracefully
- Images from Unsplash configured in `next.config.ts`


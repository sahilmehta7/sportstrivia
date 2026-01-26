# Badge System Revamp Design
**Date:** 2026-01-26
**Status:** Approved

## 1. Overview
Revamp the badge system to increase user engagement through variety, visibility, and collection mechanics. The system will support sport-specific tracking, topic mastery, and special event collectibles, displayed prominently across the application.

## 2. Architecture & Data Model

### Database Schema Updates (Prisma)
We will enhance the `Badge` model to support categorization and rarity.

```prisma
model Badge {
  id          String       @id @default(cuid())
  name        String       @unique
  description String
  imageUrl    String
  // New fields
  category    BadgeCategory @default(GENERAL)
  rarity      BadgeRarity   @default(COMMON)
  order       Int           @default(0)      // For sorting in UI
  
  criteria    Json
  createdAt   DateTime     @default(now())
  userBadges  UserBadge[]

  @@index([category])
}

enum BadgeCategory {
  GENERAL
  SPORT       // e.g., Football Fanatic
  TOPIC       // e.g., History Buff
  STREAK      // e.g., 30-Day Warrior
  SPECIAL     // e.g., World Cup 2022
}

enum BadgeRarity {
  COMMON
  RARE
  EPIC
  LEGENDARY
  HIDDEN      // Secret badges
}
```

### Service Layer (`badge.service.ts`)
- **Optimization**: Refactor `checkAndAwardBadges` to accept context (e.g., `quizId`, `topicId`) to only check relevant badges.
- **New Criteria Logic**: Add checkers for:
  - `TOTAL_QUIZZES_IN_CATEGORY`
  - `TOTAL_QUIZZES_IN_TOPIC`
  - `SPECIFIC_QUIZ_COMPLETION`
  - `STREAK_MILESTONES`

## 3. Badge Categories & Definitions

### A. Sport Badges (Category: SPORT)
*Trigger: Completed N quizzes with specific `sport` tag.*
- **Football Fanatic**: 10 Football quizzes
- **Cricket Champion**: 10 Cricket quizzes
- **Basketball Star**: 10 Basketball quizzes
- **Tennis Ace**: 10 Tennis quizzes

### B. Topic Badges (Category: TOPIC)
*Trigger: Completed N quizzes or answered N questions in `Topic`.*
- **History Buff**: 50 History questions correct
- **Stats Savant**: 50 Stat-based questions correct
- **Tactician**: 50 Strategy/Tactics questions correct

### C. Streak & Engagement (Category: STREAK/GENERAL)
- **Weekend Warrior**: Played on 4 consecutive weekends
- **Night Owl**: Completed 5 quizzes between 12 AM - 4 AM
- **Early Riser**: Completed 5 quizzes between 5 AM - 8 AM

## 4. Visibility Enhancements

### Quiz Results Page
- **New Component**: `BadgeAwardModal` (or overlay)
- **Behavior**: If badge earned -> Confetti explosion + Badge Card animation.
- **Action**: "Share Achievement" button.

### User Profile
- **Showcase**: Updated `BadgeShowcase` to support tabs/filtering by Category.
- **Rarity**: Visual glow effects based on Rarity (Common = Gray/Blue, Rare = Gold, Epic = Purple/Neon).

### Leaderboard
- **Integration**: Show "Top Badge" icon next to user name in existing leaderboards.

## 5. Implementation Strategy
1.  **Schema Migration**: Add new fields.
2.  **Seed Data Update**: Add new badge definitions.
3.  **Service Update**: Implement new check logic.
4.  **UI Components**: Update Profile and Results page.
5.  **Integration**: Connect Service to UI.

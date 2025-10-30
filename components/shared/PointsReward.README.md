# Points Reward Component

A celebratory, animated component for displaying points earned by users across different contexts. Features glassmorphism styling, smooth animations, and support for multiple display formats.

## Features

- 🎉 **Celebratory Animations**: Scale-up, shimmer, particle burst, and counter animations
- 🎨 **Glassmorphism Design**: Beautiful frosted glass effect with backdrop blur
- 🌓 **Theme Support**: Light and dark mode compatible
- 📱 **Responsive**: Works on all screen sizes
- 🎯 **Multiple Variants**: Toast, Modal, Inline, and Badge formats
- 🏆 **Point Categories**: Supports quiz, answer, streak, time, badge, friend, and challenge rewards
- 🎭 **Breakdown Display**: Shows detailed point breakdown for complex rewards

## Components

### Main Component

**Location**: `components/shared/PointsReward.tsx`

The core component that powers all point reward displays.

```tsx
import { PointsReward } from "@/components/shared/PointsReward";

<PointsReward
  points={1250}
  reason="Quiz completed! Great job!"
  category="quiz"
  variant="inline"
  size="md"
  breakdown={[
    { label: "Base Points", points: 600, icon: "💯" },
    { label: "Accuracy Bonus", points: 400, icon: "🎯" },
    { label: "Time Bonus", points: 250, icon: "⚡" },
  ]}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `points` | number | Yes | - | Total points earned |
| `reason` | string | Yes | - | Description of why points were earned |
| `category` | PointsCategory | Yes | - | Category type (quiz, answer, streak, time, badge, friend, challenge) |
| `variant` | PointsVariant | Yes | - | Display format (toast, modal, inline, badge) |
| `size` | PointsSize | No | "md" | Component size (sm, md, lg) |
| `breakdown` | PointsBreakdown[] | No | - | Detailed point breakdown |
| `onClose` | () => void | No | - | Callback when dismissed |
| `className` | string | No | - | Additional CSS classes |

### Variants

#### 1. Inline
Best for: Quiz results pages, embedded in content

```tsx
<PointsReward
  variant="inline"
  points={1250}
  reason="Quiz completed!"
  category="quiz"
  breakdown={breakdown}
/>
```

#### 2. Toast
Best for: Quick notifications, non-intrusive alerts

```tsx
import { PointsRewardToast } from "@/components/shared/PointsRewardToast";

<PointsRewardToast
  open={isOpen}
  onOpenChange={setIsOpen}
  points={150}
  reason="Correct answer!"
  category="answer"
  duration={4000}
/>
```

#### 3. Modal
Best for: Major achievements, significant milestones

```tsx
import { PointsRewardModal } from "@/components/shared/PointsRewardModal";

<PointsRewardModal
  open={isOpen}
  onOpenChange={setIsOpen}
  points={1250}
  reason="Quiz completed!"
  category="quiz"
  breakdown={breakdown}
/>
```

#### 4. Badge
Best for: Minimal inline indicators

```tsx
<PointsReward
  variant="badge"
  points={50}
  category="answer"
/>
```

## Point Categories

Each category has its own icon and color scheme:

| Category | Icon | Light Color | Dark Color |
|----------|------|-------------|------------|
| `quiz` | Trophy | Blue-500 | Blue-400 |
| `answer` | CheckCircle | Green-500 | Green-400 |
| `streak` | Flame | Orange-500 | Orange-400 |
| `time` | Clock | Purple-500 | Purple-400 |
| `badge` | Award | Yellow-500 | Yellow-400 |
| `friend` | Users | Pink-500 | Pink-400 |
| `challenge` | Target | Red-500 | Red-400 |

## Helper Functions

**Location**: `lib/points-toast.ts`

Convenience functions for common use cases:

```tsx
import {
  showQuizReward,
  showAnswerReward,
  showStreakReward,
  showTimeBonusReward,
  showBadgeReward,
  showFriendReward,
  showChallengeReward,
} from "@/lib/points-toast";

// Quiz completion
showQuizReward(1250, breakdown);

// Correct answer
showAnswerReward(150);

// Streak bonus
showStreakReward(85, 5);

// Time bonus
showTimeBonusReward(45, 12);

// Badge earned
showBadgeReward("Quiz Master");

// Friend action
showFriendReward(50, "Followed @username");

// Challenge won
showChallengeReward(300, "won");
```

## Usage Examples

### Quiz Results Page

```tsx
import { PointsReward } from "@/components/shared/PointsReward";

<PointsReward
  variant="inline"
  points={attempt.totalPoints}
  reason="Quiz completed! Great job!"
  category="quiz"
  size="md"
  breakdown={[
    { label: "Base Points", points: 600, icon: "💯" },
    { label: "Accuracy Bonus", points: 400, icon: "🎯" },
    { label: "Time Bonus", points: 250, icon: "⚡" },
  ]}
/>
```

### Toast Notification (Friend Follow)

```tsx
import { useState } from "react";
import { PointsRewardToast } from "@/components/shared/PointsRewardToast";

function FollowButton() {
  const [toastOpen, setToastOpen] = useState(false);

  const handleFollow = async () => {
    // API call to follow friend
    await followUser(userId);
    setToastOpen(true);
  };

  return (
    <>
      <button onClick={handleFollow}>Follow</button>
      <PointsRewardToast
        open={toastOpen}
        onOpenChange={setToastOpen}
        points={50}
        reason={`Followed @${username}`}
        category="friend"
      />
    </>
  );
}
```

### Modal Achievement

```tsx
import { useState, useEffect } from "react";
import { PointsRewardModal } from "@/components/shared/PointsRewardModal";

function QuizCompleteModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show modal when quiz completes
    if (quizCompleted) {
      setOpen(true);
    }
  }, [quizCompleted]);

  return (
    <PointsRewardModal
      open={open}
      onOpenChange={setOpen}
      points={1250}
      reason="Quiz completed! Outstanding!"
      category="quiz"
      breakdown={[
        { label: "Base Points", points: 600 },
        { label: "Accuracy Bonus", points: 400 },
        { label: "Time Bonus", points: 250 },
      ]}
    />
  );
}
```

## Animations

The component includes several built-in animations:

1. **Points Pop**: Scale-up bounce entrance animation
2. **Shimmer**: Continuous shine effect across the card
3. **Counter Up**: Smooth number counting animation
4. **Particle Burst**: Radial particle explosion on display
5. **Pulse Glow**: Subtle pulsing glow on icon

Animations are defined in `tailwind.config.ts` and use CSS-only animations for optimal performance.

## Styling

The component uses glassmorphism principles:

- **Light mode**: White background with 70% opacity, subtle borders
- **Dark mode**: White background with 10% opacity, enhanced glow
- **Backdrop blur**: xl blur for frosted glass effect
- **Gradient points**: Gold/amber gradient for point values
- **Category colors**: Theme-aware color schemes per category

## Accessibility

- Semantic HTML structure
- Screen reader friendly
- Keyboard navigation support
- ARIA labels where applicable
- High contrast color schemes

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

You can customize the component by:

1. **Passing custom className** for additional styling
2. **Modifying Tailwind config** for animation timing
3. **Extending point categories** in the types file
4. **Creating custom variants** by forking the component

## Performance

- CSS-only animations (no JavaScript animation libraries)
- Optimized re-renders with React hooks
- Minimal bundle size impact
- Hardware-accelerated transforms

## Demos

See `components/shared/PointsRewardDemos.tsx` for interactive examples of all variants and categories.

## License

Part of the Sports Trivia platform.


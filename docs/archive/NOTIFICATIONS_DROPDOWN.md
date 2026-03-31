# Notifications Dropdown Feature

## Overview
The notifications system has been upgraded from a full-page view to a modern dropdown in the navigation bar, similar to modern social platforms like Twitter, LinkedIn, and Facebook.

## Implementation

### Components

#### `NotificationsDropdown` (`components/shared/NotificationsDropdown.tsx`)
A dropdown component that appears when clicking the notification bell icon in the navigation bar.

**Features:**
- 📬 Shows up to 10 most recent notifications
- 🔔 Real-time unread count badge
- ✅ Mark individual notifications as read
- 🗑️ Delete individual notifications
- ✓ "Mark all as read" quick action
- 🔗 Direct links to relevant pages (challenges, friends, profile)
- 📜 Scrollable list for many notifications
- 🎨 Visual distinction between read/unread
- ⏱️ Relative timestamps (e.g., "5m ago", "2h ago")
- 🚀 "See All Notifications" button linking to full page

**Notification Types Supported:**
- `FRIEND_REQUEST` - Friend request received
- `FRIEND_ACCEPTED` - Friend request accepted
- `CHALLENGE_RECEIVED` - Challenge invitation
- `CHALLENGE_ACCEPTED` - Challenge accepted
- `CHALLENGE_COMPLETED` - Challenge completed
- `BADGE_EARNED` - New badge earned

### Integration

#### `MainNavigation` (`components/shared/MainNavigation.tsx`)
Updated to use the `NotificationsDropdown` component instead of a direct link.

**Changes:**
- Removed: `<Link href="/notifications">` with bell icon
- Added: `<NotificationsDropdown>` component
- Shared state: `unreadCount` managed by parent

### Full Page View

#### `/app/notifications/page.tsx`
The existing full notifications page remains unchanged and provides:
- Extended list of all notifications (up to 50)
- Same functionality (mark as read, delete)
- Accessed via "See All Notifications" button in dropdown

## User Experience Flow

### Quick View (Dropdown)
1. User clicks **bell icon** in navigation
2. Dropdown opens showing recent notifications
3. User can:
   - Click notification to navigate to relevant page
   - Mark notification as read (check icon)
   - Delete notification (trash icon)
   - Mark all as read (top-right check button)
   - Click "See All Notifications" for full page

### Full View (Page)
1. User clicks "See All Notifications" in dropdown
2. Navigates to `/notifications` page
3. Shows all notifications with pagination
4. Same actions available (mark as read, delete)

## Visual Design

### Dropdown Layout
```
┌────────────────────────────────────┐
│ Notifications        [✓]           │ ← Header with "Mark all read"
├────────────────────────────────────┤
│ 🔵 [Icon] New friend request       │ ← Unread (blue dot)
│           From John Doe            │
│           5m ago                   │
├────────────────────────────────────┤
│ ⚪ [Icon] Challenge completed      │ ← Read (gray)
│           You won!                 │
│           2h ago                   │
├────────────────────────────────────┤
│ ... (up to 10 items)               │
├────────────────────────────────────┤
│   [See All Notifications →]        │ ← Footer button
└────────────────────────────────────┘
```

### Visual States

#### Unread Notification
- Light primary background color (`bg-primary/5`)
- Blue dot indicator on right
- Bold title text
- Icon with primary color

#### Read Notification
- Neutral background
- No dot indicator
- Regular weight text
- Muted icon color

#### Hover State
- Subtle background change (`hover:bg-muted/50`)
- Action buttons appear (mark as read, delete)
- Smooth transitions

### Badge
- Red circular badge on bell icon
- Shows count (1-9) or "9+" for 10+
- Positioned at top-right of icon

## API Endpoints Used

### `GET /api/notifications`
```typescript
// Fetch notifications with pagination
GET /api/notifications?limit=10
// Response includes: notifications[], unreadCount, pagination
```

### `PATCH /api/notifications/:id`
```typescript
// Mark single notification as read
PATCH /api/notifications/[notificationId]
```

### `PATCH /api/notifications/read-all`
```typescript
// Mark all notifications as read
PATCH /api/notifications/read-all
```

### `DELETE /api/notifications/:id`
```typescript
// Delete single notification
DELETE /api/notifications/[notificationId]
```

## State Management

### Parent Component (`MainNavigation`)
- Manages `unreadCount` state
- Fetches initial count on mount
- Passes count and update callback to dropdown

### Dropdown Component
- Manages local `notifications` list
- Loads notifications when opened
- Updates parent's unread count after actions
- Optimistic updates for better UX

## Notifications Content Structure

Notifications are stored with JSON content:
```typescript
{
  type: "CHALLENGE_RECEIVED",
  content: JSON.stringify({
    title: "New Challenge!",
    description: "John Doe challenged you to NBA History Quiz",
    challengeId: "challenge_id_here"
  })
}
```

## Link Resolution

Each notification type maps to a specific page:
- `FRIEND_REQUEST` → `/friends?tab=requests`
- `CHALLENGE_RECEIVED/ACCEPTED` → `/challenges/[id]` or `/friends`
- `BADGE_EARNED` → `/profile/me`
- Default → No link (non-clickable)

## Performance Optimizations

1. **Lazy Loading**: Notifications only fetched when dropdown opens
2. **Limited Results**: Only 10 notifications in dropdown (vs 50 on full page)
3. **Optimistic Updates**: UI updates immediately, API call in background
4. **Scroll Container**: `ScrollArea` component for smooth scrolling
5. **Event Propagation**: Proper `stopPropagation` to prevent unwanted triggers

## Responsive Design

- **Mobile**: Full-width dropdown (380px max)
- **Desktop**: Right-aligned dropdown
- **Tablet**: Adaptive width
- **Max Height**: 400px with scroll for overflow

## Accessibility

- Keyboard navigable
- ARIA labels on buttons
- Focus management
- Screen reader friendly
- High contrast for read/unread states

## Future Enhancements

### Possible Additions
- Real-time updates via WebSocket
- Push notifications (browser API)
- Notification preferences/filters
- Group similar notifications
- Rich media in notifications (images, videos)
- Notification sound toggle
- Custom notification rules
- Mark as read on hover (optional setting)
- Infinite scroll in dropdown
- Search/filter in full page
- Export notification history

## Testing Checklist

- [ ] Click bell icon opens dropdown
- [ ] Dropdown shows recent notifications
- [ ] Unread count badge displays correctly
- [ ] Mark as read updates UI and badge
- [ ] Delete removes notification
- [ ] Mark all as read works
- [ ] "See All" navigates to full page
- [ ] Links to pages work correctly
- [ ] Timestamps format properly
- [ ] Empty state displays when no notifications
- [ ] Loading state shows while fetching
- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on notification click
- [ ] Works for all notification types
- [ ] Mobile responsive behavior


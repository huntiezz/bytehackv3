# GitHub-Style Activity Graph

## Overview
Added a **GitHub-style contribution graph** to user profiles that displays posting and commenting activity over the last 365 days.

---

## Features

### 📊 Visual Activity Display
- **365-day view** - Shows last year of activity
- **Color-coded squares** - Intensity based on activity level
- **Hover tooltips** - Shows exact count per day
- **Responsive design** - Horizontal scroll on mobile

### 📈 Activity Metrics
- **Posts** - Forum thread creations
- **Comments** - Thread replies
- **Total contributions** - Combined count
- **Daily breakdown** - Posts + comments per day

---

## Color Coding

| Contributions | Color | Description |
|---------------|-------|-------------|
| 0 | Dark gray | No activity |
| 1-2 | Light green | Low activity |
| 3-5 | Medium green | Moderate activity |
| 6-10 | Bright green | High activity |
| 11+ | Intense green | Very high activity |

---

## Layout

The graph appears **between the profile header and activity tabs**:

```
┌─────────────────────────────────┐
│   Profile Header (Avatar, Bio)  │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   📊 Activity Graph (NEW!)      │
│   43 contributions in last year │
│   [GitHub-style grid]           │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Latest Activity | Postings    │
│   (Activity Feed)               │
└─────────────────────────────────┘
```

---

## API Endpoint

### `GET /api/user/[id]/activity`

Returns user activity data for the last 365 days.

**Response:**
```json
{
  "activity": [
    {
      "date": "2025-01-15",
      "count": 7,
      "posts": 3,
      "comments": 4
    }
  ],
  "total": 43
}
```

**Fields:**
- `date` - ISO date string (YYYY-MM-DD)
- `count` - Total contributions that day
- `posts` - Number of posts created
- `comments` - Number of comments made
- `total` - Total contributions in last year

---

## Component: `ActivityGraph`

Located at: `components/activity-graph.tsx`

**Props:**
```typescript
interface ActivityGraphProps {
  userId: string;  // User ID to fetch activity for
}
```

**Usage:**
```tsx
import { ActivityGraph } from "@/components/activity-graph";

<ActivityGraph userId={user.id} />
```

---

## Implementation Details

### Week Grid Layout
- **7 rows** - One per day of week (Mon, Wed, Fri shown)
- **53 columns** - One per week of year
- **11x11px squares** - GitHub size
- **3px gap** - Between squares

### Data Fetching
1. Fetches posts from `threads` table
2. Fetches comments from `thread_replies` table
3. Groups by date (YYYY-MM-DD)
4. Combines counts per day

### Performance
- **Client-side rendering** - Interactive hover
- **Cached API response** - Fast subsequent loads
- **Optimized queries** - Only last 365 days

---

## Tooltips

Hovering over a square shows:

**With activity:**
```
7 contributions on Jan 15, 2025
3 posts, 4 comments
```

**Without activity:**
```
No contributions on Jan 15, 2025
```

---

## Month Labels

Displays abbreviated month names above the graph:
```
Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
```

Only shown at the **start of each month** to avoid clutter.

---

## Legend

Bottom right shows intensity legend:
```
Less [▢][▣][▣][▣][▣] More
```

---

## Files Created

1. **`components/activity-graph.tsx`** - Main component
2. **`app/api/user/[id]/activity/route.ts`** - API endpoint

## Files Modified

1. **`app/[username]/page.tsx`** - Added graph to profile
2. **`app/profile/[username]/page.tsx`** - Added graph to profile

---

## Responsive Design

### Desktop (> 1024px)
- Full graph visible
- No scrolling needed

### Tablet (768px - 1024px)
- Horizontal scroll enabled
- Maintains 11x11px squares

### Mobile (< 768px)
- Horizontal scroll
- Month labels condensed
- Legend remains visible

---

## Future Enhancements

Potential additions:
- [ ] Click square to filter activity for that day
- [ ] Year selector (view previous years)
- [ ] Activity types filter (posts only, comments only)
- [ ] Streak counter (consecutive days)
- [ ] Achievement badges for milestones
- [ ] Export activity data (CSV/JSON)

---

## Similar To

This feature mimics:
- **GitHub** contribution graph
- **GitLab** contribution calendar
- **Wakatime** coding activity
- **Strava** training calendar

---

## Example

User with moderate activity:
```
43 contributions in the last year

Jan      Feb      Mar      Apr      May      Jun
Mon  [░][░][▣][░][░][░][░][▣][░][▣][░][░][░][░][░]...
Wed  [░][▣][░][░][▣][░][▣][░][░][░][░][▣][░][░][░]...
Fri  [░][░][░][▣][░][░][░][░][▣][░][▣][░][░][░][▣]...

Less [▢][▣][▣][▣][▣] More
```

---

## Testing

View your activity graph:
1. Go to your profile page (`/[username]` or `/profile/[username]`)
2. Look between profile header and activity tabs
3. Hover over squares to see details
4. Scroll horizontally if needed on mobile

The graph updates automatically based on your forum activity! 🚀


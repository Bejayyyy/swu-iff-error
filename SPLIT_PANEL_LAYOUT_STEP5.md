# Split-Panel Layout for Step 5 - Schedule Entry Modal

## Overview
Redesigned Step 5 of the Add Schedule Block modal to use a split-panel layout matching the provided design reference. The left panel contains the form inputs (room selection and time input), while the right panel shows a full interactive weekly schedule grid.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Add Schedule Block                                        Weekly Schedule│
│  ✓──✓──✓──✓──5                                                          │
├──────────────────────┬──────────────────────────────────────────────────┤
│  LEFT PANEL          │  RIGHT PANEL                                      │
│  (Form - 400px)      │  (Schedule Grid - Flexible)                       │
│                      │                                                   │
│  🚪 Select Room      │  Weekly Schedule                                  │
│  ┌─────────────────┐ │  Room TH-309 schedule · Click or drag to set time│
│  │ Building: Tech  │ │                                                   │
│  │ Hub Building    │ │  ┌────────────────────────────────────────────┐ │
│  └─────────────────┘ │  │ TIME  MON TUE WED THU FRI SAT SUN          │ │
│                      │  ├────────────────────────────────────────────┤ │
│  FLOOR 1             │  │ 07:00  │   │   │   │   │   │   │           │ │
│  ┌─────────────────┐ │  │ 08:00  │   │ █ │   │   │   │   │           │ │
│  │ TH-309    [✓]   │ │  │ 09:00  │   │ █ │ ░ │   │   │   │ ← Occupied│ │
│  │ Laboratory·36   │ │  │ 10:00  │   │   │ ░ │   │   │   │ ← Your    │ │
│  └─────────────────┘ │  │ 11:00  │   │   │   │   │   │   │   time    │ │
│  ┌─────────────────┐ │  │   ...  │   │   │   │   │   │   │           │ │
│  │ TH-310          │ │  └────────────────────────────────────────────┘ │
│  │ Laboratory·40   │ │                                                   │
│  └─────────────────┘ │  Legend: █ Lecture  █ Laboratory  ░ Your time   │
│                      │                                                   │
│  🕒 Set Time        │  ✓ Room is available at this time                │
│  ┌─────────────────┐ │                                                   │
│  │ Schedule Time:  │ │                                                   │
│  │ 08:00 AM -      │ │                                                   │
│  │ 09:00 AM        │ │                                                   │
│  │                 │ │                                                   │
│  │ Start   End     │ │                                                   │
│  │ 08:00   09:00   │ │                                                   │
│  │                 │ │                                                   │
│  │ 💡 You can type │ │                                                   │
│  │ or drag on grid │ │                                                   │
│  └─────────────────┘ │                                                   │
│                      │                                                   │
│  Selected Room       │                                                   │
│  ┌─────────────────┐ │                                                   │
│  │ TH-309          │ │                                                   │
│  │ Tech Hub Bldg·  │ │                                                   │
│  │ Laboratory      │ │                                                   │
│  │ Cap: 36 students│ │                                                   │
│  └─────────────────┘ │                                                   │
└──────────────────────┴──────────────────────────────────────────────────┘
   ← Back                               Save Schedule Block →
```

## Design Specifications

### Modal Width
- **Before**: `max-w-5xl` (1024px)
- **After**: `max-w-[1400px]` (1400px)
- Provides more space for side-by-side layout

### Left Panel (Form)
- **Width**: Fixed 400px (`xl:grid-cols-[400px_1fr]`)
- **Contents**:
  1. **Select Room** section
     - Building badge (blue)
     - Floor groupings
     - Room buttons with:
       - Room code (bold)
       - Type and capacity
       - Maintenance status badge
  2. **Set Time** section
     - Current time display
     - Start Time input
     - End Time input
     - Helper text: "💡 You can type here or drag on the schedule grid"
  3. **Selected Room** summary card
     - Maroon gradient background
     - Room code (large, bold)
     - Building name and type
     - Capacity

### Right Panel (Schedule)
- **Width**: Flexible (`1fr` - fills remaining space)
- **Contents**:
  1. Header
     - "Weekly Schedule" title
     - Room name and instruction text
  2. Interactive Schedule Grid
     - Full RoomScheduleViewer component
     - 7:00 AM - 9:00 PM time range
     - Drag-to-select enabled
     - Color-coded occupied blocks
     - Yellow highlight for proposed time
  3. Legend (inside RoomScheduleViewer)
  4. Conflict detection messages

### Responsive Behavior
- **Desktop (xl+)**: Split panel layout (400px + flexible)
- **Tablet/Mobile**: Stacks vertically (`grid-cols-1`)

## Key Features

### 1. Compact Left Panel
- Scrollable room list (max-height: 300px)
- Smaller text sizes for density
- Condensed spacing between elements
- Summary card at bottom shows selected room

### 2. Prominent Schedule Grid
- Full-width interactive grid
- Shows all days of the week
- Real-time updates as user drags
- Conflict warnings at bottom

### 3. Bidirectional Sync
- **Drag on grid** → Updates Start/End Time inputs
- **Type in inputs** → Updates yellow highlight on grid
- Both methods work seamlessly

### 4. Visual Hierarchy
- Left panel: Compact, form-focused
- Right panel: Spacious, visual schedule
- Border separator between panels
- Gradient summary cards for emphasis

## User Workflow

1. **Select Room** (Left Panel)
   - Scroll through floors
   - Click a room button
   - See summary card update

2. **View Schedule** (Right Panel)
   - Grid loads automatically
   - See occupied time blocks
   - Existing schedules from other deans shown

3. **Set Time** (Either Panel)
   - **Option A**: Type in Start/End Time fields (left)
   - **Option B**: Drag on schedule grid (right)
   - Yellow highlight shows proposed time

4. **Check Conflicts** (Right Panel)
   - Warning appears if overlap detected
   - Success message if room available

5. **Submit**
   - Click "Save Schedule Block"
   - All data validated

## Files Modified

### `src/components/modals/AddPlotEntryModalEnhanced.jsx`
1. **Modal width**: `max-w-5xl` → `max-w-[1400px]`
2. **Step 5 grid**: `grid-cols-1 lg:grid-cols-2` → `grid-cols-1 xl:grid-cols-[400px_1fr]`
3. **Left panel restructure**:
   - Moved room selection to top
   - Added smaller padding and margins
   - Added scrollable container for rooms
   - Moved time inputs to middle section
   - Added summary card at bottom
4. **Right panel restructure**:
   - Added border-left separator
   - Added padding-left for spacing
   - Header section with title and description
   - Full RoomScheduleViewer component
   - Placeholder state when no room selected

## Benefits

### User Experience
- ✅ **Clear separation**: Form vs schedule visualization
- ✅ **More room for grid**: Full weekly view without compromise
- ✅ **Less scrolling**: Fixed left panel, scrollable grid
- ✅ **Consistent layout**: Matches main Course Scheduling page

### Visual Design
- ✅ **Matches reference image**: Left form, right schedule
- ✅ **Better proportions**: 400px form + flexible schedule
- ✅ **Professional appearance**: Clean, organized layout

### Functionality
- ✅ **Drag-to-select**: Easy time selection on grid
- ✅ **Instant feedback**: See conflicts immediately
- ✅ **Flexible input**: Type or drag, both work
- ✅ **Context awareness**: Summary card shows selection

## Testing Checklist

- [ ] Modal opens at 1400px width on large screens
- [ ] Left panel fixed at 400px on XL screens
- [ ] Right panel fills remaining space
- [ ] Room list scrollable without expanding modal
- [ ] Selecting room loads schedule grid instantly
- [ ] Dragging on grid updates left panel time inputs
- [ ] Typing in time inputs updates grid highlight
- [ ] Summary card shows selected room details
- [ ] Border separator visible between panels
- [ ] Mobile/tablet shows stacked layout
- [ ] Placeholder shown when no room selected

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Layout | 50/50 split | 400px fixed + flexible |
| Modal Width | 1024px | 1400px |
| Left Panel | Room + Time mixed | Organized sections |
| Right Panel | Time + Grid mixed | Full grid focus |
| Room List | Large, expanded | Compact, scrollable |
| Summary | None | Dedicated card |
| Grid Space | Cramped | Full width |
| Visual Hierarchy | Equal weight | Schedule emphasized |

## Next Steps

1. ✅ **Implemented**: Split-panel layout
2. ✅ **Implemented**: Interactive grid with drag
3. ✅ **Implemented**: Bidirectional sync
4. 🔄 **Test**: User acceptance testing
5. 📋 **Optional**: Add room filtering by type
6. 📋 **Optional**: Add "Find next available time" button

---

**Status**: ✅ Implementation Complete  
**Date**: January 2027  
**Matches Reference Image**: ✓ Yes

# Schedule Grid Simplification

## Changes Made

### 1. **Removed Exam and Maintenance Schedule Types**
**File:** `src/constants/scheduleGrid.js`

**Before:**
```javascript
export const SCHEDULE_TYPE_COLORS = {
  CAS: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  Lecture: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  Laboratory: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  Exam: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  Maintenance: { bg: '#FED7AA', text: '#9A3412', border: '#FB923C' },
};
```

**After:**
```javascript
export const SCHEDULE_TYPE_COLORS = {
  CAS: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  Lecture: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  Laboratory: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
};
```

**Impact:**
- Only shows **CAS**, **Lecture**, and **Laboratory** schedule types
- Removed blue "Exam" blocks
- Removed orange "Maintenance" blocks

---

### 2. **Removed "Blocked" and "Drag Selection" from Legend**
**File:** `src/components/scheduling/WeeklyScheduleGrid.jsx`

**Before:**
```javascript
{showLegend && (
  <div className="flex gap-4 mb-4 flex-wrap">
    {Object.entries(SCHEDULE_TYPE_COLORS).map(...)}
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-sm" style={{ background: '#F3F4F6', border: '1.5px solid #D1D5DB' }} />
      <span className="text-xs font-semibold text-gray-500">Blocked</span>
    </div>
    {canPlot && (
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm" style={{ background: '#FEE2E2', border: '1.5px solid #FCA5A5' }} />
        <span className="text-xs font-semibold text-gray-500">Drag selection</span>
      </div>
    )}
  </div>
)}
```

**After:**
```javascript
{showLegend && (
  <div className="flex gap-4 mb-4 flex-wrap">
    {Object.entries(SCHEDULE_TYPE_COLORS).map(...)}
  </div>
)}
```

**Impact:**
- Legend now only shows: **CAS**, **Lecture**, **Laboratory**
- Removed "Blocked" gray box from legend
- Removed "Drag selection" red box from legend
- Cleaner, simpler legend display

---

### 3. **Display Teacher's First Name Only**
**File:** `src/services/plotScheduleService.js`

**Before:**
```javascript
function entriesToGridBlocks(entries, weekDates = []) {
  const blocks = (entries || [])
    .map((e) => {
      return {
        // ...
        instructor: e.instructor || '',
        // ...
      };
    });
  return blocks;
}
```

**After:**
```javascript
function entriesToGridBlocks(entries, weekDates = []) {
  // Helper function to extract first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  };
  
  const blocks = (entries || [])
    .map((e) => {
      return {
        // ...
        instructor: getFirstName(e.instructor || ''), // Extract first name only
        // ...
      };
    });
  return blocks;
}
```

**Impact:**
- Schedule blocks now display only the teacher's **first name**
- **Before:** "John Michael Smith" → **After:** "John"
- **Before:** "Maria" → **After:** "Maria" (single names unchanged)
- Saves space in grid blocks
- Easier to read at a glance

---

## Visual Changes

### Schedule Grid Legend (Before)
```
[Yellow] CAS   [Red] Lecture   [Green] Laboratory   [Blue] Exam   [Orange] Maintenance
[Gray] Blocked   [Light Red] Drag selection
```

### Schedule Grid Legend (After)
```
[Yellow] CAS   [Red] Lecture   [Green] Laboratory
```

---

### Schedule Block Display (Before)
```
┌─────────────────────────┐
│ Advanced Programming    │
│ ITE-001 · John Michael  │
│ Smith                   │
│ TH-309                  │
│ 08:00 AM - 09:30 AM     │
└─────────────────────────┘
```

### Schedule Block Display (After)
```
┌─────────────────────────┐
│ Advanced Programming    │
│ ITE-001 · John          │
│ TH-309                  │
│ 08:00 AM - 09:30 AM     │
└─────────────────────────┘
```

---

## First Name Extraction Logic

The `getFirstName()` helper function:

```javascript
const getFirstName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
};
```

### Examples:
| Full Name           | First Name |
|---------------------|------------|
| "John Smith"        | "John"     |
| "Maria Garcia Lopez"| "Maria"    |
| "Juan"              | "Juan"     |
| "  John   Doe  "    | "John"     |
| ""                  | ""         |

### Edge Cases Handled:
✅ Empty string → returns empty string  
✅ Extra whitespace → trimmed before splitting  
✅ Single name → returns the name as-is  
✅ Multiple spaces → handles correctly with regex split

---

## Files Modified

1. **`src/constants/scheduleGrid.js`**
   - Removed `Exam` and `Maintenance` from `SCHEDULE_TYPE_COLORS`

2. **`src/components/scheduling/WeeklyScheduleGrid.jsx`**
   - Removed "Blocked" and "Drag selection" from legend

3. **`src/services/plotScheduleService.js`**
   - Added `getFirstName()` helper function
   - Modified `entriesToGridBlocks()` to extract first name from instructor

---

## Benefits

### Cleaner UI
✅ Simplified legend with only 3 schedule types  
✅ Less visual clutter  
✅ Easier to understand at a glance

### Better Readability
✅ First name only saves space in grid blocks  
✅ More schedule blocks fit on screen  
✅ Easier to scan teacher names quickly

### Focused Functionality
✅ Removed unused schedule types (Exam, Maintenance)  
✅ Removed unnecessary legend items (Blocked, Drag selection)  
✅ Grid now focuses on core functionality: Lecture, Lab, CAS

---

## Testing

### Test Case 1: Schedule Block Display
1. Create a schedule entry with instructor: "John Michael Smith"
2. View in weekly schedule grid
3. **Expected:** Block shows "John" not "John Michael Smith"

### Test Case 2: Legend Display
1. Open course scheduling page
2. Check the legend below the schedule grid
3. **Expected:** Only shows CAS, Lecture, Laboratory
4. **Expected:** No "Blocked" or "Drag selection" in legend

### Test Case 3: Single Name Teacher
1. Create schedule entry with instructor: "Maria"
2. View in weekly schedule grid
3. **Expected:** Block shows "Maria"

### Test Case 4: Empty Instructor
1. Create schedule entry with empty instructor
2. View in weekly schedule grid
3. **Expected:** Block shows no instructor text (no error)

### Test Case 5: Extra Whitespace
1. Create schedule entry with instructor: "  John   Doe  "
2. View in weekly schedule grid
3. **Expected:** Block shows "John" (trimmed and split correctly)

---

## Backward Compatibility

### Existing Schedule Data
✅ All existing schedule entries still work  
✅ First name extraction is non-destructive (only affects display)  
✅ Original full name remains in database

### Schedule Types
⚠️ If any entries have `type: "Exam"` or `type: "Maintenance"`:
- They will fall back to default "Lecture" colors
- Consider migrating old entries to use valid types: CAS, Lecture, Laboratory

---

## Migration Notes

### If you have Exam or Maintenance schedules:

**Option 1: Delete them** (if no longer needed)
```javascript
// In Firestore console or script
- Filter entries where type === "Exam" or type === "Maintenance"
- Delete these entries
```

**Option 2: Convert to valid types**
```javascript
// Update type field
- "Exam" → "Lecture"
- "Maintenance" → keep in separate collection (not displayed in schedule grid)
```

---

## Summary

✅ **Removed schedule types:** Exam, Maintenance  
✅ **Removed legend items:** Blocked, Drag selection  
✅ **Display teacher first name only** in grid blocks  
✅ **Cleaner, simpler schedule grid**  
✅ **Backward compatible** with existing data  

**Result:** The schedule grid now focuses on the core functionality - displaying Lecture, Lab, and CAS schedules with teacher first names for better readability! 🎉

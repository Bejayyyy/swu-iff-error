# Teacher Schedule View Implementation

## Overview
Added a **Teacher Schedule View** feature that allows deans and teachers to view a consolidated weekly schedule for any teacher, showing all their classes across different sections in a single grid view.

## Features

### 1. **View Weekly Schedule Button**
- Added to each teacher card in Teachers Directory
- Opens a modal with the teacher's consolidated schedule
- Available to both Deans and Registrars

### 2. **Teacher Schedule Modal**
- **Full-width weekly grid** showing all classes
- **Schedule by Section** breakdown
- **Summary statistics**: total classes, sections, hours per week
- **Color-coded blocks**: CAS, Lecture, Laboratory
- **Teacher information**: name, college, semester

### 3. **Cross-Section Schedule Aggregation**
- Queries all schedule entries where instructor matches teacher name
- Consolidates schedules from all sections the teacher teaches
- Groups by section for detailed breakdown

## Files Created

### 1. `src/components/modals/TeacherScheduleModal.jsx`
**New modal component for displaying teacher schedules**

**Features:**
- Uses `WeeklyScheduleGrid` component (same as section schedules)
- Subscribes to teacher schedule entries in real-time
- Shows consolidated view across all sections
- Displays schedule breakdown by section
- Calculates total hours per week
- Shows course codes, types, rooms, and times

**Props:**
```javascript
{
  teacher: { name, uid, email, ... },  // Teacher object
  semester: '1',                         // Semester to display
  collegeCode: 'BSIT',                  // College code for badge
  onClose: () => {}                      // Close handler
}
```

## Files Modified

### 1. `src/pages/TeachersDirectory.jsx`
**Added:**
- Import `Calendar` icon from lucide-react
- Import `TeacherScheduleModal` component
- State: `showScheduleModal`, `scheduleTeacher`
- Handler: `handleViewSchedule(teacher)`
- "View Weekly Schedule" button on each teacher card
- `<TeacherScheduleModal />` component at bottom

**Changes:**
```javascript
// Import
import { Calendar } from 'lucide-react';
import TeacherScheduleModal from '../components/modals/TeacherScheduleModal';

// State
const [showScheduleModal, setShowScheduleModal] = useState(false);
const [scheduleTeacher, setScheduleTeacher] = useState(null);

// Handler
const handleViewSchedule = (teacher) => {
  setScheduleTeacher(teacher);
  setShowScheduleModal(true);
};

// Button in teacher card
<button onClick={() => handleViewSchedule(teacher)}>
  <Calendar size={14} />
  View Weekly Schedule
</button>

// Modal at bottom
{showScheduleModal && scheduleTeacher && (
  <TeacherScheduleModal
    teacher={scheduleTeacher}
    semester="1"
    collegeCode={scheduleTeacher.department || scheduleTeacher.college}
    onClose={() => {
      setShowScheduleModal(false);
      setScheduleTeacher(null);
    }}
  />
)}
```

### 2. `src/services/plotScheduleService.js`
**Added:**
- Import `collectionGroup` from firebase/firestore
- Function: `subscribePlotEntriesForTeacher()`

**New Function:**
```javascript
/**
 * Subscribe to all plot entries for a specific teacher across all sections
 * @param {string} teacherName - Full name of the teacher
 * @param {string} semester - Semester number ('1' or '2')
 * @param {function} onData - Callback with array of entries
 * @param {function} onError - Error callback
 * @returns {function} Unsubscribe function
 */
export function subscribePlotEntriesForTeacher(teacherName, semester, onData, onError)
```

**Query Logic:**
- Uses `collectionGroup(db, 'entries')` to search across all deans' sections
- Filters by `instructor === teacherName`
- Filters by `scheduleMode === 'regular'`
- Optionally filters by `semester`
- Orders by `date` and `startHour`

## How It Works

### Data Flow
```
1. User clicks "View Weekly Schedule" on teacher card
   ↓
2. Opens TeacherScheduleModal with teacher info
   ↓
3. Modal subscribes to teacher's schedule entries
   Query: collectionGroup('entries')
   Filter: instructor === teacher.name
   Filter: scheduleMode === 'regular'
   ↓
4. Converts entries to grid blocks
   Uses entriesToGridBlocks() with weekday format
   ↓
5. Displays in WeeklyScheduleGrid
   Same component used for section schedules
   ↓
6. Shows schedule breakdown by section
   Groups entries by section property
```

### Teacher Name Matching
The system matches schedules by **exact teacher name**:
- Schedule entry: `{ instructor: "John Smith", ... }`
- Teacher profile: `{ name: "John Smith", ... }`
- Query: `where('instructor', '==', 'John Smith')`

**Important:** Teacher names must match exactly between:
1. Teacher's profile name
2. Schedule entry instructor field

### Cross-Section Aggregation
```javascript
// Example: Teacher "Maria Garcia" teaches in multiple sections
// Entries from different deans/sections:

Dean 1 / BSIT1-A1:
  - ITE-001 (Lecture) Monday 8:00-9:30

Dean 1 / BSIT1-A2:
  - ITE-001 (Laboratory) Tuesday 10:00-12:00

Dean 2 / BSIT2-B1:
  - ITE-002 (Lecture) Wednesday 13:00-14:30

// All consolidated into single schedule view for Maria Garcia
// Shows 3 classes across 3 sections, 6 hours total
```

## UI Components

### Teacher Card - "View Schedule" Button
```
┌─────────────────────────────────────┐
│ [Avatar] John Smith                 │
│          ● Active                   │
│                                     │
│ john.smith@phinmaed.com            │
│                                     │
│ ─────────────────────────────────  │
│ Assigned Courses (3)        [+]    │
│ [ITE-001 - Intro to Programming]   │
│ [ITE-002 - Data Structures]        │
│ [ITE-003 - Algorithms]             │
│ ─────────────────────────────────  │
│ [📅 View Weekly Schedule]          │
└─────────────────────────────────────┘
```

### Teacher Schedule Modal
```
┌─────────────────────────────────────────────────────────┐
│ Teacher Schedule                                    [X] │
│ 👤 John Smith  [BSIT]  [Semester 1]                    │
│ 📅 12 classes · 4 sections · 18.5 hours/week           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ John Smith's Weekly Schedule                            │
│ ┌─────┬──────┬──────┬──────┬──────┬──────┬──────┐    │
│ │ MON │ TUE  │ WED  │ THU  │ FRI  │ SAT  │ SUN  │    │
│ ├─────┼──────┼──────┼──────┼──────┼──────┼──────┤    │
│ │[ITE]│      │[ITE] │      │[ITE] │      │      │    │
│ │ 001 │      │ 002  │      │ 003  │      │      │    │
│ │John │      │John  │      │John  │      │      │    │
│ │8-9:30      │10-12 │      │1-2:30│      │      │    │
│ └─────┴──────┴──────┴──────┴──────┴──────┴──────┘    │
│                                                         │
│ Schedule by Section                                     │
│ ┌─────────────────────────────────────────────────┐   │
│ │ BSIT1-A1                               3 classes│   │
│ │ ITE-001 [Lecture] Monday 8:00-9:30 TH-309      │   │
│ │ ITE-002 [Lab] Tuesday 10:00-12:00 TH-310       │   │
│ │ ITE-003 [Lecture] Friday 13:00-14:30 TH-309    │   │
│ └─────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ BSIT2-B1                               2 classes│   │
│ │ ITE-004 [Lecture] Wednesday 8:00-9:30 TH-311   │   │
│ │ ITE-005 [Lab] Thursday 10:00-12:00 TH-312      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│                                           [Close]       │
└─────────────────────────────────────────────────────────┘
```

## Benefits

### For Teachers
✅ **See all classes in one place** - no need to check multiple sections  
✅ **Identify scheduling conflicts** - visual overlap detection  
✅ **Know daily schedule** - which days are free/busy  
✅ **Track total workload** - hours per week calculation  
✅ **Quick reference** - easy to print or screenshot

### For Deans
✅ **Monitor teacher workload** - ensure balanced distribution  
✅ **Identify over/under-utilized teachers** - optimize assignments  
✅ **Plan new sections** - see teacher availability  
✅ **Resolve conflicts** - find time slots that work  
✅ **Verify schedule accuracy** - cross-check assigned courses

### For System
✅ **Centralized view** - aggregates from all sections automatically  
✅ **Real-time updates** - reflects schedule changes immediately  
✅ **Reuses existing components** - WeeklyScheduleGrid, block rendering  
✅ **Firestore optimization** - single collectionGroup query  
✅ **No data duplication** - reads from existing schedule entries

## Query Performance

### Firestore Query
```javascript
collectionGroup('entries')
  .where('instructor', '==', 'John Smith')
  .where('scheduleMode', '==', 'regular')
  .orderBy('date', 'asc')
  .orderBy('startHour', 'asc')
```

### Required Firestore Index
```json
{
  "collectionGroup": "entries",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "instructor", "order": "ASCENDING" },
    { "fieldPath": "scheduleMode", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "ASCENDING" },
    { "fieldPath": "startHour", "order": "ASCENDING" }
  ]
}
```

**Note:** Firestore will prompt to create this index automatically on first query. Click the link in the console error to create it.

## Testing

### Test Case 1: View Teacher Schedule
1. Go to Teachers Directory
2. Find a teacher with assigned courses
3. Click "View Weekly Schedule"
4. **Expected:** Modal opens with teacher's schedule grid
5. **Expected:** Shows all classes across all sections

### Test Case 2: Cross-Section Aggregation
1. Dean 1 assigns ITE-001 to Teacher A in Section 1
2. Dean 2 assigns ITE-002 to Teacher A in Section 2
3. Click "View Weekly Schedule" on Teacher A
4. **Expected:** Schedule shows both ITE-001 and ITE-002
5. **Expected:** "Schedule by Section" shows both sections

### Test Case 3: Empty Schedule
1. View schedule for teacher with no assigned courses
2. **Expected:** Shows "No schedule entries found" message
3. **Expected:** No error, graceful empty state

### Test Case 4: Real-time Updates
1. Open teacher schedule modal
2. Keep modal open
3. Dean adds new class to a section taught by this teacher
4. **Expected:** New class appears in schedule automatically
5. **Expected:** Statistics update (class count, hours)

### Test Case 5: First Name Display
1. Schedule entry has instructor: "John Michael Smith"
2. Grid block displays first name: "John"
3. **Expected:** Block shows "John" not full name
4. **Expected:** Space saved in grid layout

### Test Case 6: Schedule by Section
1. Teacher teaches 3 sections with 2-3 classes each
2. View teacher schedule
3. **Expected:** "Schedule by Section" breakdown shows all sections
4. **Expected:** Each section lists its classes correctly
5. **Expected:** Class details include course code, type, day, time, room

## Edge Cases

### Teacher Name Mismatch
**Problem:** Schedule has "J. Smith" but profile has "John Smith"  
**Result:** Schedule won't appear in teacher's view  
**Solution:** Ensure teacher names match exactly when creating schedules

### Multiple Teachers Same Name
**Problem:** Two teachers named "Maria Garcia"  
**Result:** Both get schedules mixed together  
**Solution:** Use unique identifiers (future enhancement: match by teacherUid)

### Teacher Renamed
**Problem:** Teacher's name changed in profile but not in old schedules  
**Result:** Old schedules won't appear  
**Solution:** Update all schedule entries when teacher name changes (future enhancement)

### No Firestore Index
**Problem:** Query fails on first run  
**Result:** Firestore shows index creation link in console  
**Solution:** Click link to create index, refresh page

## Future Enhancements

### 1. **Match by UID instead of Name**
```javascript
// Current: where('instructor', '==', 'John Smith')
// Enhanced: where('instructorUid', '==', 'abc123')
```
Benefits: Handles name changes, unique identification

### 2. **Semester Selector**
```javascript
<select value={semester} onChange={e => setSemester(e.target.value)}>
  <option value="1">Semester 1</option>
  <option value="2">Semester 2</option>
</select>
```
Benefits: View different semesters

### 3. **Export/Print Schedule**
```javascript
<button onClick={handlePrintSchedule}>
  <Printer size={14} /> Print Schedule
</button>
```
Benefits: Physical copy for teacher reference

### 4. **Conflict Detection**
```javascript
// Highlight overlapping time slots in different colors
// Show warning badge if conflicts exist
```
Benefits: Identify double-bookings automatically

### 5. **Weekly Hours Warning**
```javascript
// Show alert if total hours > threshold
{totalHours > 24 && (
  <div className="alert-warning">
    Teacher workload exceeds recommended 24 hours/week
  </div>
)}
```
Benefits: Prevent teacher overload

## Firestore Rules

Ensure these rules allow reading schedule entries:

```javascript
// In firestore.rules
match /users/{userId}/course_schedules/{section}/entries/{entryId} {
  // Allow read for:
  // - The dean who owns this section
  // - Teachers whose name matches the instructor field
  // - Registrars
  
  allow read: if isAuthenticated() && (
    request.auth.uid == userId ||  // Dean owner
    isRegistrar() ||                // Registrar
    isTeacherInEntry()              // Teacher in this entry
  );
}

function isTeacherInEntry() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.name == 
         resource.data.instructor;
}
```

**Note:** Current implementation uses collectionGroup which may require broader read permissions. Consider security implications.

## Summary

✅ **Teachers can view their complete weekly schedule**  
✅ **Deans can view any teacher's schedule**  
✅ **Consolidates schedules from all sections automatically**  
✅ **Shows schedule breakdown by section**  
✅ **Calculates total hours per week**  
✅ **Real-time updates when schedules change**  
✅ **Reuses existing WeeklyScheduleGrid component**  
✅ **Color-coded by class type (CAS, Lecture, Lab)**  
✅ **Displays teacher first name only in blocks**  

**The Teacher Schedule View provides a comprehensive overview of each teacher's weekly commitments!** 🎉

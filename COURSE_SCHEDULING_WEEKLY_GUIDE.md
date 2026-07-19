# Course Scheduling - Weekly Basis Guide

## 🎯 Overview

The course scheduling system has been redesigned to work on a **weekly basis** for the entire semester, separating regular class schedules from exam schedules.

## 📚 Key Concepts

### Regular Schedule (Weekly Basis)
- **No specific dates** - Schedule repeats weekly throughout the semester
- Shows **days of the week** (Monday - Sunday) instead of calendar dates
- **No date navigation** - No "Previous Week" / "Next Week" buttons
- Schedule applies to **entire semester** automatically
- Used for: Regular classes, lectures, laboratories

### Exam Schedule (Date-Based)
- Uses **specific dates** from Academic Calendar
- Shows actual calendar dates with navigation
- **Year level filtering**: 
  - **1st Year (Freshmen)**: Separate exam period
  - **2nd-5th Year (Upperclassmen)**: Shared exam period
- Based on exam periods set by Registrar in Academic Calendar
- Used for: Midterm exams, Final exams

## 🏗️ Data Structure

### Section Document
```
/users/{deanUid}/course_schedules/{sectionName}/
  ├─ sectionName: string (e.g., "1A", "BSIT-2")
  ├─ yearLevel: string (REQUIRED: "1st Year" to "5th Year")
  ├─ createdAt: timestamp
  └─ updatedAt: timestamp
```

### Schedule Entry Document
```
/users/{deanUid}/course_schedules/{sectionName}/entries/{entryId}/
  ├─ title: string (Course name)
  ├─ courseCode: string
  ├─ instructor: string
  ├─ startHour: number (e.g., 8.5 for 8:30 AM)
  ├─ endHour: number
  ├─ day: number (0-6 for Mon-Sun)
  ├─ scheduleMode: string ("regular" or "exam")
  ├─ semester: number (only for exam schedule)
  ├─ yearLevel: string ("1st Year" to "5th Year")
  ├─ date: string (only for exam: "weekday-0" for regular, actual date for exam)
  ├─ type: string ("Lecture", "Laboratory", "Exam")
  ├─ roomCode: string
  ├─ section: string
  ├─ deanUid: string
  ├─ deanName: string
  ├─ college: string
  └─ timestamps...
```

## 🔄 Schedule Modes

### Mode 1: Regular Schedule
**Purpose**: Weekly recurring classes for entire semester

**Characteristics**:
- ✅ Week-based (Monday - Sunday)
- ✅ No specific dates
- ✅ No semester filtering (applies to whole year)
- ✅ No date navigation
- ✅ All days enabled

**Use Cases**:
- Monday 8:00-10:00 AM - Database Systems (repeats every Monday)
- Tuesday 1:00-3:00 PM - Programming Lab (repeats every Tuesday)
- Friday 3:00-5:00 PM - Web Development (repeats every Friday)

**Firestore Query**:
```javascript
where('scheduleMode', '==', 'regular')
orderBy('createdAt', 'desc')
```

### Mode 2: Exam Schedule
**Purpose**: Specific exam dates based on Academic Calendar

**Characteristics**:
- ✅ Date-based with calendar navigation
- ✅ Semester-specific
- ✅ Year level filtering (Freshmen vs Upperclassmen)
- ✅ Respects Academic Calendar blocks (holidays, no-class periods)
- ✅ Date validation

**Use Cases**:
- October 15, 2026 - Database Systems Midterm (1st Year sections)
- November 20, 2026 - Programming Final Exam (2nd-5th Year sections)

**Firestore Query**:
```javascript
where('semester', '==', semesterNumber)
where('scheduleMode', '==', 'exam')
orderBy('createdAt', 'desc')
```

## 👥 Year Level Categories

### 1st Year (Freshmen)
- **Separate exam period** from upperclassmen
- Registrar sets different exam dates in Academic Calendar
- Allows flexibility for freshman orientation schedules

### 2nd - 5th Year (Upperclassmen)
- **Shared exam period**
- Common exam schedule across all upperclassman levels
- Coordinated to avoid conflicts

## 🎨 UI Changes

### Regular Schedule View
```
┌─────────────────────────────────────────┐
│  School Year: SY 2026-2027              │
│  Semester: 1 · Regular Schedule         │
│  Weekly schedule for entire semester    │
└─────────────────────────────────────────┘
│  Mon   Tue   Wed   Thu   Fri   Sat  Sun│
│  [Schedule blocks without dates]        │
└─────────────────────────────────────────┘
```

### Exam Schedule View
```
┌─────────────────────────────────────────┐
│  School Year: SY 2026-2027              │
│  Semester: 1 · Exam Calendar            │
│  Year Level: [1st] [2nd] [3rd] [4th] [5th]│
│  Oct 15 - Oct 21, 2026   [◀ ▶]         │
└─────────────────────────────────────────┘
│  Mon 15  Tue 16  Wed 17  Thu 18  Fri 19│
│  [Exam schedule with specific dates]    │
└─────────────────────────────────────────┘
```

## 🔒 Firestore Indexes Required

The system needs these composite indexes:

### Index 1: Exam Schedule Query
```json
{
  "collectionGroup": "entries",
  "fields": [
    { "fieldPath": "semester", "order": "ASCENDING" },
    { "fieldPath": "scheduleMode", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Index 2: Regular Schedule Query
```json
{
  "collectionGroup": "entries",
  "fields": [
    { "fieldPath": "scheduleMode", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## 🚀 Deployment Checklist

- [ ] Deploy Firestore rules (`deploy-rules.bat`)
- [ ] Deploy Firestore indexes (`deploy-indexes.bat`)
- [ ] Or use `deploy-firestore.bat` to deploy both at once
- [ ] Wait for indexes to build (1-5 minutes)
- [ ] Test regular schedule creation
- [ ] Test exam schedule with year level filtering
- [ ] Verify sections require year level on creation

## 📋 User Workflow

### Creating a Regular Weekly Schedule

1. **Login as Dean**
2. **Navigate to Course Scheduling**
3. **Create Section** (if not exists)
   - Enter section name (e.g., "BSIT-1A")
   - Select year level (required)
4. **Select Section**
5. **Switch to "Regular Schedule" tab**
6. **Plot Weekly Classes**
   - Click day/time slot (e.g., Monday 8:00 AM)
   - Add course details
   - Save
7. **Schedule repeats every week** automatically

### Creating an Exam Schedule

1. **Login as Dean**
2. **Navigate to Course Scheduling**
3. **Select Section**
4. **Switch to "Exam Calendar" tab**
5. **Select Year Level** (1st or 2nd-5th)
6. **Navigate to Exam Week** (using ◀ ▶ buttons)
7. **Plot Exam Dates**
   - Click specific date/time
   - Add exam details
   - Save
8. **Exams only appear on selected dates**

## 🔍 How Year Level Affects Exam Periods

### Scenario: October 2026 Exams

**Academic Calendar Configuration** (set by Registrar):
```
Freshmen Midterm Exam Period:
- October 12-16, 2026

Upperclassmen Midterm Exam Period:
- October 19-23, 2026
```

**Result**:
- **1st Year sections**: Can only plot exams on Oct 12-16
- **2nd-5th Year sections**: Can only plot exams on Oct 19-23
- **Regular schedules**: Not affected by exam periods

## ⚠️ Important Notes

### For Regular Schedule:
- ✅ No date restrictions
- ✅ Works for entire semester
- ✅ Just set it once and forget
- ❌ Cannot set specific dates (use Exam Schedule for that)

### For Exam Schedule:
- ✅ Set specific exam dates
- ✅ Respects Academic Calendar blocks
- ✅ Filtered by year level
- ❌ Requires Academic Calendar configuration by Registrar

### Year Level Requirement:
- ⚠️ **Year level is now REQUIRED** when creating sections
- ⚠️ Cannot create section without year level
- ⚠️ Used for exam period filtering

## 🐛 Troubleshooting

### "The query requires an index" Error
**Solution**: Deploy indexes using `deploy-firestore.bat` or click the link in the error message.

### Exam dates not showing
**Check**:
1. Is Academic Calendar configured with exam periods?
2. Is the correct year level selected?
3. Are you in the exam period date range?

### Regular schedule not appearing
**Check**:
1. Is "Regular Schedule" tab selected?
2. Was the entry saved with `scheduleMode: 'regular'`?
3. Check browser console for errors

### Section creation fails
**Check**:
1. Is year level selected?
2. Is section name not empty?
3. Are Firestore rules deployed?

## 📊 Comparison Table

| Feature | Regular Schedule | Exam Schedule |
|---------|------------------|---------------|
| **Basis** | Weekly | Date-specific |
| **Date Display** | Days of week | Calendar dates |
| **Navigation** | None | Prev/Next week |
| **Semester Filter** | No (applies all year) | Yes (per semester) |
| **Year Level Filter** | No | Yes (Freshmen vs Upper) |
| **Academic Calendar** | Not checked | Fully integrated |
| **Use Case** | Classes, Labs | Midterms, Finals |
| **Repeats** | Every week | One-time dates |

## 🎓 Benefits

### For Deans:
- ✅ **Simpler regular scheduling** - Set once, applies all semester
- ✅ **Flexible exam scheduling** - Plot specific exam dates
- ✅ **Year level awareness** - Different exam periods per level
- ✅ **No date confusion** - Clear separation of regular vs exam

### For Registrars:
- ✅ **View all schedules** at a glance
- ✅ **Year level visibility** - See which sections belong to which year
- ✅ **Exam coordination** - Track exam schedules by year level

### For System:
- ✅ **Reduced complexity** - No unnecessary date calculations for regular schedule
- ✅ **Better performance** - Simpler queries for regular schedules
- ✅ **Academic Calendar integration** - Exam schedules respect calendar blocks

---

**Last Updated**: January 2026
**Version**: 2.0 - Weekly Basis Implementation

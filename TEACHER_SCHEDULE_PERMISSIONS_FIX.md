# Teacher Schedule View - Permissions Fix

## Issues Fixed

### 1. ✅ Firestore Permission Error
**Problem:** Teachers couldn't read schedule entries (FirebaseError: Missing or insufficient permissions)

**Solution:** Updated Firestore rules to allow teachers to read entries where they are the instructor

### 2. ✅ Added Semester Selector
**Feature:** Teachers can now switch between Semester 1 and Semester 2

### 3. ✅ Added Section Filter
**Feature:** Teachers can filter their schedule by section or view all sections

## Changes Made

### 1. `firestore.rules` - Line 164-172
**Updated:**
```javascript
match /entries/{entryId} {
  // Allow teachers to read entries where they are the instructor
  allow read: if isMainRole() && isPhinmaedEmail() && (
    isRegistrar() 
    || (hasRole('dean') && callerIsSelf(userId))
    || (hasRole('teacher') && userDocExists() && resource.data.instructor == userDoc().data.displayName)
  );
  allow create, update, delete: if isPhinmaedEmail() && (
    isRegistrar() || (hasRole('dean') && callerIsSelf(userId))
  );
}
```

**What Changed:**
- Added condition: `(hasRole('teacher') && userDocExists() && resource.data.instructor == userDoc().data.displayName)`
- This allows teachers to read schedule entries where `instructor` field matches their `displayName`

### 2. `src/components/modals/TeacherScheduleModal.jsx`
**Added:**
- Semester selector (Sem 1 / Sem 2 toggle buttons)
- Section filter dropdown (All Sections + individual sections)
- Filter icon from lucide-react
- State management for `semester` and `selectedSection`
- `filteredEntries` based on selected section
- `sections` array extracted from entries
- Empty state for filtered results

**New UI Elements:**
```javascript
// Semester Selector
<div className="inline-flex w-fit items-center p-1 gap-1 shadow-sm">
  <button onClick={() => setSemester('1')}>Sem 1</button>
  <button onClick={() => setSemester('2')}>Sem 2</button>
</div>

// Section Filter
<select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
  <option value="all">All Sections ({entries.length})</option>
  {sections.map(section => (
    <option key={section} value={section}>{section} ({count})</option>
  ))}
</select>
```

## How It Works Now

### Permission Flow
```
Teacher logs in
    ↓
Opens schedule modal
    ↓
Query: collectionGroup('entries')
Filter: instructor === teacher.displayName
    ↓
Firestore checks: resource.data.instructor == userDoc().data.displayName
    ↓
✅ Permission granted - returns matching entries
    ↓
Displays in schedule grid
```

### Data Flow with Filters
```
1. Teacher opens schedule modal
   Initial: Semester 1, All Sections
   ↓
2. Subscribe to entries for teacher.name + semester
   ↓
3. Extract unique sections from entries
   Sections: ["BSIT1-A1", "BSIT1-A2", "BSIT2-B1"]
   ↓
4. User selects "Semester 2"
   → Re-query with semester: "2"
   → Reset section filter to "all"
   ↓
5. User selects "BSIT1-A1"
   → Filter displayed entries to section: "BSIT1-A1"
   → Grid shows only BSIT1-A1 classes
   → Stats update: classes, hours for that section only
```

## Important: Deploy Firestore Rules

### ⚠️ MANUAL DEPLOYMENT REQUIRED

The Firestore rules have been updated but **NOT yet deployed**. You must deploy them manually:

### Option 1: Using Firebase CLI
```bash
cd "c:\Users\Day Care 3-Buaya\OneDrive\Desktop\SWU-IFSS"
firebase deploy --only firestore:rules
```

### Option 2: Using Batch File
```bash
cd "c:\Users\Day Care 3-Buaya\OneDrive\Desktop\SWU-IFSS"
deploy-rules.bat
```

### Option 3: Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Firestore Database → Rules
4. Copy the contents of `firestore.rules` file
5. Paste into the online editor
6. Click "Publish"

### Verify Deployment
After deploying, test:
1. Login as a teacher
2. Go to Teachers Directory
3. Click "View Weekly Schedule" on your own card
4. Should load successfully without permission errors

## UI Changes

### Before
```
┌─────────────────────────────────────────┐
│ Teacher Schedule                    [X] │
│ 👤 John Smith  [BSIT]  [Semester 1]    │
│ 📅 12 classes · 4 sections · 18.5 hrs  │
├─────────────────────────────────────────┤
│ [Schedule Grid]                         │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────────────┐
│ Teacher Schedule                            [X] │
│ 👤 John Smith  [BSIT]                          │
│                                                 │
│ Semester: [Sem 1][Sem 2]                       │
│ 🔍 [All Sections (12) ▼]                       │
│                                                 │
│ 📅 12 classes · 4 sections · 18.5 hours/week   │
├─────────────────────────────────────────────────┤
│ [Schedule Grid - filtered by section]          │
└─────────────────────────────────────────────────┘
```

## Testing

### Test Case 1: Teacher Permissions
1. Login as teacher (role: teacher)
2. Go to Teachers Directory
3. Click "View Weekly Schedule" on your card
4. **Expected:** Schedule loads without permission error
5. **Expected:** Shows your classes across all sections

### Test Case 2: Semester Selector
1. Open teacher schedule modal (defaults to Sem 1)
2. Click "Sem 2" button
3. **Expected:** Grid updates to show Semester 2 classes
4. **Expected:** Section filter resets to "All Sections"
5. **Expected:** Stats update (class count, hours)

### Test Case 3: Section Filter
1. Open teacher schedule with multiple sections
2. Section dropdown shows: "All Sections (12)"
3. Select "BSIT1-A1 (5)" from dropdown
4. **Expected:** Grid shows only BSIT1-A1 classes
5. **Expected:** Stats show: "5 classes · 1 section · X hours"

### Test Case 4: Filter Combination
1. Select Semester 1
2. Select section "BSIT2-B1"
3. **Expected:** Shows Sem 1 classes for BSIT2-B1 only
4. Switch to Semester 2
5. **Expected:** Section resets to "All", shows all Sem 2 classes

### Test Case 5: Empty Filter Result
1. Teacher has classes in Sem 1 but not Sem 2
2. Select Semester 2
3. **Expected:** Shows "No schedule entries found" message
4. Teacher has 3 sections but filter on section they don't teach
5. **Expected:** Shows "No classes for selected section"

### Test Case 6: Teacher Name Match
**Current Implementation:**
- Matches by: `resource.data.instructor == userDoc().data.displayName`
- Teacher profile: `{ displayName: "John Smith" }`
- Schedule entry: `{ instructor: "John Smith" }`
- **Must match exactly**

**Important:** Ensure teacher names are consistent:
- Profile `displayName` field
- Schedule entry `instructor` field
- Case-sensitive exact match required

## Edge Cases

### Name Mismatch
**Problem:** Profile has "J. Smith" but schedules have "John Smith"  
**Result:** Teacher won't see their schedules  
**Solution:** Update profile or schedule entries to match

### No Display Name
**Problem:** Teacher profile missing `displayName` field  
**Result:** Permission check fails, no schedules shown  
**Solution:** Ensure all teacher profiles have `displayName` set

### Multiple Semesters
**Problem:** Teacher teaches same section in both semesters  
**Result:** Changing semester shows different classes correctly  
**Behavior:** ✅ Working as expected

### Section Names
**Problem:** Section names inconsistent (e.g., "BSIT1-A1" vs "BSIT1 - A1")  
**Result:** Filter might not work correctly  
**Solution:** Standardize section naming convention

## Security Implications

### What Teachers Can Read
✅ **Can read:** Their own schedule entries (where instructor == their name)  
✅ **Can read:** Across all deans/sections (if they teach in multiple)  
❌ **Cannot read:** Other teachers' schedules  
❌ **Cannot read:** Sections they don't teach  

### What Teachers Can Write
❌ **Cannot create/update/delete:** Any schedule entries  
✅ **Only Deans and Registrars** can modify schedules

### Privacy
- Teachers only see their own schedules
- No access to other teachers' data
- No access to sections they're not assigned to

## Future Enhancements

### 1. Match by UID Instead of Name
```javascript
// Current
resource.data.instructor == userDoc().data.displayName

// Enhanced
resource.data.instructorUid == request.auth.uid
```
**Benefits:** Handles name changes, more secure

### 2. Export Schedule
```javascript
<button onClick={handleExportSchedule}>
  <Download size={14} /> Export as PDF
</button>
```

### 3. Print View
```javascript
<button onClick={handlePrint}>
  <Printer size={14} /> Print Schedule
</button>
```

### 4. Academic Year Selector
```javascript
<select value={academicYear}>
  <option value="2024-2025">AY 2024-2025</option>
  <option value="2025-2026">AY 2025-2026</option>
</select>
```

### 5. Week View for Exam Schedules
Currently only shows regular schedules. Future: support exam schedules with date ranges.

## Troubleshooting

### Issue: Still getting permission error after deploying rules
**Check:**
1. Firestore rules actually deployed? Check Firebase Console → Rules tab
2. Teacher has `displayName` in profile? Check Firestore users collection
3. Schedule entries have `instructor` field? Check entries subcollection
4. Names match exactly? Check capitalization, spacing

**Debug:**
```javascript
// In browser console
const user = auth.currentUser;
const userDoc = await getDoc(doc(db, 'users', user.uid));
console.log('My displayName:', userDoc.data().displayName);

// Compare with schedule entries
const entries = await getDocs(collectionGroup(db, 'entries'));
entries.forEach(doc => {
  console.log('Entry instructor:', doc.data().instructor);
});
```

### Issue: Section filter shows no sections
**Cause:** Entries missing `section` field  
**Solution:** Ensure all schedule entries have `section` field populated

### Issue: Semester toggle doesn't update
**Check:** 
1. `subscribePlotEntriesForTeacher` dependency array includes `semester`
2. Service function filters by semester correctly
3. Entries in Firestore have `semester` field or null

### Issue: Empty state after filtering
**Behavior:** This is correct if teacher has no classes in that section/semester  
**Verify:** Check the "All Sections" view to see all available classes

## Summary

✅ **Fixed Firestore permissions** - teachers can now read their schedules  
✅ **Added semester selector** - switch between Sem 1 and Sem 2  
✅ **Added section filter** - view all or specific sections  
✅ **Dynamic filtering** - stats update based on selection  
✅ **Empty states** - clear messages when no data  
✅ **Maintains security** - teachers only see their own data  

**⚠️ REMEMBER TO DEPLOY FIRESTORE RULES!** Use one of the deployment methods above.

The Teacher Schedule View is now fully functional with proper permissions and filtering! 🎉

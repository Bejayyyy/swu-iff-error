# Dynamic College Dropdown in Room Reservation

## Issue
Room reservations were not being routed to the correct dean because:
1. The college dropdown in the reservation form used **hardcoded values** (e.g., "IT", "BSInfotech")
2. The College Inventory managed by Registrars had **different college codes** (e.g., "BSIT", "CAS")
3. Dean profiles used the Registrar-defined college codes
4. **Mismatch:** Reservation saved with "IT" but dean has "BSIT" → dean doesn't see the reservation

## Solution
Replaced hardcoded college options with **dynamic fetching from College Inventory (Firestore)**.

### What Changed
The `RoomReservationModal.jsx` now:
1. **Subscribes to colleges from Firestore** using `subscribeColleges()` service
2. **Displays dynamic dropdown** with colleges managed by Registrars
3. **Uses college codes** that match dean assignments exactly
4. **Real-time updates** - when Registrar adds/updates colleges, dropdown updates automatically

## Files Modified

### `src/components/modals/RoomReservationModal.jsx`

#### Imports Changed
**Before:**
```javascript
import { COLLEGE_OPTIONS, requiresCollege } from '../../constants/colleges';
```

**After:**
```javascript
import { requiresCollege } from '../../constants/colleges';
import { subscribeColleges } from '../../services/collegeService';
```

#### State Added
**Added:**
```javascript
const [colleges, setColleges] = useState([]); // Dynamic colleges from Firestore
```

#### Effect Added
**Added:**
```javascript
// Subscribe to colleges from Firestore
useEffect(() => {
  return subscribeColleges(
    (data) => setColleges(data),
    (err) => console.error('Error loading colleges:', err)
  );
}, []);
```

#### Dropdown Changed
**Before (hardcoded):**
```javascript
<select className="form-input" value={form.college} onChange={(e) => set('college', e.target.value)}>
  <option value="">Select College</option>
  {COLLEGE_OPTIONS.map((college) => (
    <option key={college.value} value={college.value}>{college.label}</option>
  ))}
</select>
```

**After (dynamic):**
```javascript
<select className="form-input" value={form.college} onChange={(e) => set('college', e.target.value)}>
  <option value="">Select College</option>
  {colleges.map((college) => (
    <option key={college.id} value={college.code}>
      {college.name} ({college.code})
    </option>
  ))}
</select>
```

## Data Flow

### College Inventory → Reservation → Dean Filtering

```
1. Registrar creates college in College Inventory
   College: { code: "BSIT", name: "College of Information Technology" }
   ↓
2. Saved to Firestore: colleges collection
   ↓
3. Dean profile updated with college: "BSIT"
   ↓
4. Teacher opens room reservation form
   ↓
5. Modal subscribes to colleges from Firestore
   ↓
6. Dropdown shows: "College of Information Technology (BSIT)"
   ↓
7. Teacher selects college and submits
   ↓
8. Reservation saved with: college: "BSIT"
   ↓
9. Dean dashboard filters by: dean.college === reservation.college
   ↓
10. Dean with college: "BSIT" sees the reservation ✅
```

## College Data Structure

### Firestore Collection: `colleges`
```javascript
{
  id: "auto-generated-id",
  code: "BSIT",              // Short code (uppercase)
  name: "College of Information Technology", // Full name
  description: "IT and Computer Science programs", // Optional
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Dropdown Display Format
```
College of Information Technology (BSIT)
College of Arts and Sciences (CAS)
College of Engineering (CEIT)
College of Nursing (CON)
```

### Value Saved in Reservation
The **college code** is saved (e.g., `"BSIT"`, `"CAS"`, `"CEIT"`), which matches the dean's `profile.college` field.

## Benefits

### 1. **Exact Matching**
✅ No more mismatches between reservation college and dean college  
✅ Reservations always routed to correct dean  
✅ Single source of truth (College Inventory)

### 2. **Registrar Control**
✅ Registrar can add/edit/delete colleges in real-time  
✅ Changes immediately reflected in all forms  
✅ No code changes needed to add new colleges

### 3. **Real-time Updates**
✅ Uses Firestore real-time subscriptions  
✅ Dropdown updates when colleges change  
✅ No page refresh needed

### 4. **Consistency**
✅ Same college list used for:
- Room reservations
- User management (Add/Edit User)
- Dean assignments
- College Inventory page

## Testing

### Test Case 1: Dynamic Dropdown Display
1. Login as Registrar
2. Go to College Inventory
3. Add college: { code: "TEST", name: "Test College" }
4. Login as Teacher
5. Open room reservation form
6. **Expected:** "Test College (TEST)" appears in college dropdown

### Test Case 2: Exact Code Matching
1. Registrar creates college: { code: "BSIT", name: "College of IT" }
2. Registrar assigns Dean with `college: "BSIT"`
3. Teacher creates reservation, selects "College of IT (BSIT)"
4. Reservation saved with `college: "BSIT"`
5. **Expected:** Dean sees reservation in Endorsement tab

### Test Case 3: Real-time Updates
1. Teacher opens room reservation form (keeps it open)
2. Registrar adds new college in College Inventory
3. **Expected:** New college appears in dropdown without page refresh

### Test Case 4: No Colleges Configured
1. Empty College Inventory (no colleges)
2. Teacher opens reservation form
3. **Expected:** Dropdown shows only "Select College" (no options)
4. **Expected:** Validation prevents submission without college

## Migration Path

### Step 1: Set Up College Inventory
1. Login as Registrar
2. Go to **College Inventory** page
3. Add all colleges with **exact codes** matching dean assignments

Example colleges to add:
```javascript
{ code: "BSIT", name: "College of Information Technology" }
{ code: "CAS", name: "College of Arts and Sciences" }
{ code: "CEIT", name: "College of Engineering and IT" }
{ code: "CON", name: "College of Nursing" }
{ code: "COM", name: "College of Medicine" }
```

### Step 2: Update Dean Profiles
1. Go to **System Administration**
2. For each Dean, verify their `college` field matches a college code
3. Edit if necessary to use exact codes from College Inventory

Example:
- Dean has `college: "IT"` → Change to `college: "BSIT"`
- Dean has `college: "Medicine"` → Change to `college: "COM"`

### Step 3: Update Teacher Profiles (Optional)
1. For teachers with pre-filled college in profile
2. Verify their `college` field matches College Inventory codes
3. Update if necessary

### Step 4: Test End-to-End
1. Teacher creates reservation → selects college from dropdown
2. Verify reservation saved with correct college code
3. Verify dean with matching college sees it in their dashboard

## Troubleshooting

### Issue: Dropdown is empty
**Cause:** No colleges in College Inventory  
**Solution:** Add colleges via College Inventory page

### Issue: Dean doesn't see reservation
**Causes:**
1. Dean's `college` field doesn't match reservation's `college` field
2. Case sensitivity mismatch (though filtering is case-insensitive)

**Solution:**
1. Check dean profile: `profile.college`
2. Check reservation document: `reservation.college`
3. Ensure exact match (case-insensitive comparison is handled automatically)

### Issue: Old reservations not showing
**Cause:** Old reservations have hardcoded college values that don't match new codes  
**Solution:**
1. Option 1: Update old reservations in Firestore to use new codes
2. Option 2: Add legacy codes to College Inventory temporarily

### Issue: Teacher's profile has wrong college
**Cause:** Profile uses old hardcoded value  
**Solution:**
1. Go to System Administration
2. Edit teacher profile
3. Select correct college from dropdown

## Related Files

### Services
- `src/services/collegeService.js` - College CRUD and subscriptions
- `src/services/reservationService.js` - Reservation creation (uses college field)

### Components
- `src/components/modals/RoomReservationModal.jsx` - ✅ Updated (dynamic dropdown)
- `src/components/modals/AddUserModal.jsx` - Already uses dynamic colleges
- `src/components/modals/EditUserModal.jsx` - Already uses dynamic colleges

### Pages
- `src/pages/CollegeInventory.jsx` - Registrar manages colleges here

### Constants
- `src/constants/colleges.js` - Helper functions (still used for validation)
- `src/constants/approvalWorkflow.js` - Dean filtering logic

## Summary

✅ **Replaced hardcoded college dropdown** with dynamic Firestore fetch  
✅ **College codes now match** between reservations and dean assignments  
✅ **Registrar controls college list** via College Inventory  
✅ **Real-time updates** when colleges change  
✅ **Exact matching** ensures correct routing to deans  
✅ **Single source of truth** - College Inventory  

**No more mismatches!** Teachers select from the same college list that Registrars use to assign deans. 🎉

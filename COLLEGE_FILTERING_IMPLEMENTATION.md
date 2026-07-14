# 🎓 College-Based Filtering for Reservations

## Overview

Implemented a college-based filtering system that ensures deans only see and approve room reservations from their assigned college. Teachers and organization heads must select their college when submitting reservations.

---

## 🎯 What Was Implemented

### 1. **College Assignment for Users**
- **Teachers**, **Organization Heads**, and **Deans** now have a **college** field
- College is required when creating/editing these roles
- College dropdown with predefined options (CAS, Medicine, IT/Engineering, Business, Nursing, Education, Law)

### 2. **College Selection in Reservations**
- Teachers and Org Heads see a **college dropdown** in the reservation form
- The dropdown is pre-filled with their profile college
- College selection determines which dean will approve the reservation

### 3. **Dean Filtering**
- Deans only see reservations from **their own college**
- Filters apply to:
  - Endorsements tab
  - Requests tab
  - Approval workflow

### 4. **Backward Compatibility**
- Existing users without college assignment still work
- System shows all reservations if college is not specified (temporary)

---

## 📁 Files Created

### New Files

1. **`src/constants/colleges.js`**
   - Defines all available colleges
   - College options for dropdowns
   - Helper functions for college validation
   - List of roles that require college assignment

---

## 📝 Files Modified

### User Management

1. **`src/components/modals/AddUserModal.jsx`**
   - Added college dropdown for teachers/org heads/deans
   - Validation to ensure college is selected for required roles
   - Helper text explaining college purpose

2. **`src/components/modals/EditUserModal.jsx`**
   - Added college field to edit form
   - Conditional display based on role
   - Validation on save

3. **`src/services/systemUserService.js`**
   - Added `college` field to user creation
   - Added `college` field to user updates
   - Maps college in user document

### Reservation System

4. **`src/components/modals/RoomReservationModal.jsx`**
   - Added college dropdown for teachers/org heads
   - Pre-fills from user profile
   - Validates college selection before submission
   - Includes helpful text about dean routing

5. **`src/services/reservationService.js`**
   - Saves `college` field with reservation
   - Includes college in reservation document

6. **`src/constants/approvalWorkflow.js`**
   - Updated `filterReservationsForRole()` function
   - Deans only see reservations matching their college
   - Case-insensitive college matching

---

## 🔍 How It Works

### User Creation Flow

```
1. Registrar creates user (teacher/org head/dean)
   ↓
2. Selects role from dropdown
   ↓
3. College dropdown appears (if role requires it)
   ↓
4. Selects college (e.g., "College of Medicine")
   ↓
5. User document created with college field
```

### Reservation Submission Flow

```
1. Teacher/Org Head creates reservation
   ↓
2. Fills in reservation details
   ↓
3. College dropdown appears (pre-filled from profile)
   ↓
4. Can change college if needed
   ↓
5. Submits reservation
   ↓
6. Reservation saved with college field
   ↓
7. Routed to dean of that college
```

### Dean Approval Flow

```
1. Dean logs in
   ↓
2. Views Endorsements/Requests tab
   ↓
3. System filters reservations:
   - dean.college === reservation.college
   ↓
4. Dean sees only their college's reservations
   ↓
5. Dean approves/rejects
```

---

## 📋 College Options

The following colleges are available:

| Value | Label |
|-------|-------|
| `CAS` | College of Arts and Sciences (CAS) |
| `Medicine` | College of Medicine |
| `IT` | College of IT / Engineering |
| `Business` | College of Business |
| `Nursing` | College of Nursing |
| `Education` | College of Education |
| `Law` | College of Law |

**Note:** You can add more colleges by editing `src/constants/colleges.js`

---

## 🎨 UI Changes

### System Administration - Add User

**Before:**
```
[Name] [Email]
[Department/College] [Role]
```

**After:**
```
[Name] [Email]
[Department] [Role]
[College *] (appears for teachers/org heads/deans)
  > Dropdown with college options
  > Helper text: "This determines which dean will approve this user's reservations"
```

### Room Reservation Modal

**Before:**
```
[Organization Name]
[Activity Name]
[Requested By]
[Contact Number]
```

**After (for teachers/org heads):**
```
[Organization Name]
[Activity Name]
[Requested By]
[Your College *]
  > Dropdown with college options
  > Helper text: "Your request will be routed to the dean of this college for approval"
[Contact Number]
```

**Not shown for:**
- Registrars
- GSD
- Student Life
- Other roles that don't require college

---

## 🔒 Security & Validation

### Server-Side
- College field saved in Firestore
- Firestore rules allow reading/writing college field
- No additional security rules needed (existing rules cover it)

### Client-Side
- **Validation:** College required for teachers/org heads/deans
- **Pre-filling:** User's college auto-filled in reservation form
- **Filtering:** Case-insensitive college matching
- **Error handling:** Clear error messages if college missing

---

## 🧪 Testing Checklist

### User Management

- [ ] **Create Teacher with College**
  1. Go to System Administration
  2. Click "Add user"
  3. Select role: Teacher
  4. College dropdown should appear
  5. Select "College of IT / Engineering"
  6. Save
  7. Verify user has college in database

- [ ] **Edit User College**
  1. Edit existing teacher
  2. College dropdown should show current college
  3. Change to different college
  4. Save
  5. Verify college updated

- [ ] **Create User Without College Requirement**
  1. Create user with role: GSD
  2. College dropdown should NOT appear
  3. Save normally

### Reservation Flow

- [ ] **Teacher Submits Reservation**
  1. Login as teacher (with college: Medicine)
  2. Create room reservation
  3. College dropdown should appear
  4. Should be pre-filled with "College of Medicine"
  5. Submit reservation
  6. Verify reservation has college field

- [ ] **Dean Views Only Their College**
  1. Login as dean (college: Medicine)
  2. Go to Endorsements tab
  3. Should only see reservations from Medicine college
  4. Should NOT see reservations from other colleges

- [ ] **Registrar Sees All**
  1. Login as registrar
  2. Go to Requests tab
  3. Should see all reservations regardless of college

### Edge Cases

- [ ] **Teacher Without College in Profile**
  1. Login as teacher (no college assigned)
  2. Create reservation
  3. College dropdown should be empty
  4. Must select college manually
  5. Can submit successfully

- [ ] **Change Teacher's College**
  1. Teacher (college: Medicine) creates reservation
  2. Registrar changes teacher's college to Business
  3. Old reservations still show Medicine
  4. New reservations show Business

---

## 🔄 Migration Guide

### For Existing Users

**Option 1: Automatic (Recommended)**
- Leave existing users without college
- They can still create reservations
- College dropdown will appear (empty)
- They select college when creating reservation

**Option 2: Manual Assignment**
1. Go to System Administration
2. For each teacher/org head/dean:
   - Click actions → Edit
   - Select their college
   - Save

### For Existing Reservations

Existing reservations without `college` field:
- Will still appear in dean's view (backward compatibility)
- Dean sees all reservations if no college specified
- Once dean's profile has college, filtering begins

**Recommended:** After implementing, assign colleges to all deans first, then teachers/org heads.

---

## 💡 Best Practices

### For Registrars

1. **Assign colleges when creating users**
   - Always select college for teachers/org heads/deans
   - This ensures proper routing from day one

2. **Review existing users**
   - Update users without college assignments
   - Start with deans, then teachers, then org heads

3. **Consistent naming**
   - Use the predefined college names
   - Don't create custom college names

### For Teachers/Org Heads

1. **Check pre-filled college**
   - Verify it's correct before submitting
   - Can change if needed (e.g., cross-college event)

2. **Contact registrar if**
   - College dropdown is empty
   - Need to change assigned college permanently

### For Deans

1. **Only see your college**
   - This is intentional for focused approval
   - Contact registrar if you need to see other colleges

2. **Cross-college events**
   - Teacher selects appropriate college when creating
   - Event is routed to that college's dean

---

## 🐛 Troubleshooting

### Issue: College dropdown doesn't appear

**Cause:** Role doesn't require college  
**Solution:** Only teachers, org heads, and deans have college field

### Issue: Dean sees all reservations

**Cause:** Dean doesn't have college assigned  
**Solution:** Edit dean's profile and assign college

### Issue: Teacher can't submit without college

**Cause:** Validation requires college  
**Solution:** Select college from dropdown or contact registrar to assign college to profile

### Issue: Old reservations not showing

**Cause:** Filtering by college, old reservations don't have college field  
**Solution:** This is backward compatible - they should still show. Check dean's college assignment.

---

## 📊 Database Structure

### User Document
```javascript
{
  uid: "user123",
  displayName: "Dr. John Doe",
  email: "john.doe@phinmaed.com",
  role: "teacher",
  department: "Information Technology",
  college: "IT", // ← NEW FIELD
  status: "active",
  ...
}
```

### Reservation Document
```javascript
{
  id: "res123",
  title: "Room Reservation",
  requestor: "Dr. John Doe",
  college: "IT", // ← NEW FIELD (matches requestor's college)
  department: "IT Department",
  approvalRecords: [...],
  ...
}
```

---

## 🚀 Summary

✅ **College field added** to teachers, org heads, and deans  
✅ **College dropdown** in user creation/editing  
✅ **College selection** in reservation forms  
✅ **Dean filtering** by college  
✅ **Backward compatible** with existing data  
✅ **Validation** ensures college is selected  
✅ **Pre-filling** for better UX

The system now ensures that:
1. Deans only see reservations from their college
2. Teachers/Org heads specify college when reserving
3. Approval routing is college-specific
4. Cross-college events can be handled by selecting appropriate college

**Ready to use!** 🎉

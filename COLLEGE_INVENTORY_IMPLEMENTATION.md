# College Inventory Implementation

## Overview
Added a College Inventory management system for Registrars to manage colleges in the institution. These colleges will be used when assigning users to their respective colleges.

## Changes Made

### 1. New College Inventory Page (`/college-inventory`)
**File**: `src/pages/CollegeInventory.jsx`
- Full CRUD interface for managing colleges
- Grid layout showing college cards with:
  - College code (e.g., CAS, CEIT, CON)
  - College name (e.g., College of Arts and Sciences)
  - Description (optional)
  - Created date
  - Edit and delete buttons
- Add/Edit modal with validation
- Real-time updates via Firestore subscription
- Loading, notification, and confirmation modals

### 2. College Service
**File**: `src/services/collegeService.js`
- `subscribeColleges()` - Real-time subscription to colleges
- `addCollege()` - Create new college
- `updateCollege()` - Update existing college
- `deleteCollege()` - Remove college

### 3. Updated Add User Modal
**File**: `src/components/modals/AddUserModal.jsx`
- **Removed**: Hardcoded `COLLEGE_OPTIONS` constant
- **Added**: Dynamic college fetching from Firestore
- **Changed**: "Department" field now means:
  - **For Deans, Teachers, Organization Heads**: Select from colleges (dropdown)
  - **For GSD, Student Life**: Free text input (they're associations, not colleges)
- College dropdown shows: "College Name (CODE)"
- Warning message if no colleges exist

### 4. Navigation & Routing
**Files**: 
- `src/App.jsx` - Added `/college-inventory` route
- `src/constants/rolePermissions.js` - Added navigation item
- `src/components/LeftNav.jsx` - Added icon mapping

### 5. Firestore Rules
**File**: `firestore.rules`
```
match /colleges/{collegeId} {
  allow read: if isMainRole() && isPhinmaedEmail();
  allow create, update, delete: if isRegistrar() && isPhinmaedEmail();
}
```

## Data Structure

### College Document (`/colleges/{collegeId}`)
```javascript
{
  code: string,        // e.g., "CAS", "CEIT", "CON" (uppercase)
  name: string,        // e.g., "College of Arts and Sciences"
  description: string, // Optional description
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### User Document (`/users/{uid}`)
```javascript
{
  // ... other fields
  department: string,  // Now stores college code for deans/teachers
                       // or association name for GSD/Student Life
  college: string,     // Kept for backward compatibility
}
```

## User Assignment Flow

### Before (Hardcoded):
1. Registrar adds user
2. Selects from predefined list of colleges
3. College stored in `department` field

### After (Dynamic):
1. Registrar adds colleges in **College Inventory**
2. When adding users:
   - **Dean/Teacher/Org Head**: Select from dropdown of colleges from Firestore
   - **GSD/Student Life**: Enter department name (free text)
3. College code stored in `department` field for backward compatibility

## GSD and Student Life

These roles are **associations/administrative offices**, not colleges:
- They get a **text input** for department name
- They **do not** select from the college dropdown
- Examples: "General Services Department", "Student Life Office"

## Navigation Access

**Registrar Only**:
- College Inventory appears in left navigation
- Positioned before "System Administration"
- Permission required: `PERMISSIONS.SYSTEM_ADMIN`

## Benefits

1. **Dynamic Management**: Colleges can be added/removed without code changes
2. **Accurate Data**: Always up-to-date college list
3. **Better UX**: Clear separation between colleges and associations
4. **Validation**: Prevents invalid college assignments
5. **Scalability**: Easy to add new colleges as institution grows

## Migration Notes

Existing users with hardcoded college values in `department` field will continue to work. The system is backward compatible.

## Next Steps

1. **Deploy Firestore rules**: Run `deploy-rules.bat`
2. **Add initial colleges**: Use College Inventory page to add your institution's colleges
3. **Test user creation**: Add a new dean/teacher and verify college dropdown works
4. **Update existing users** (optional): Update old department values to match new college codes

## Example Colleges

```javascript
// Sample colleges to add:
{ code: "CAS", name: "College of Arts and Sciences" }
{ code: "CEIT", name: "College of Engineering and IT" }
{ code: "CON", name: "College of Nursing" }
{ code: "CBA", name: "College of Business Administration" }
{ code: "COE", name: "College of Education" }
{ code: "LAW", name: "College of Law" }
```

## Screenshots Flow

1. Registrar navigates to "College Inventory"
2. Clicks "Add College"
3. Enters code (CAS), name, and description
4. College appears in grid
5. When adding users, college dropdown now shows CAS
6. Department field removed for college-based roles
7. GSD/Student Life still use text input for their association name

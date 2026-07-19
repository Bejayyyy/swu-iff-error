# Teachers Directory Implementation

## Overview
Added a Teachers Directory page for Deans to view and manage teachers within their own college/department. The page automatically filters teachers based on the dean's assigned college.

## Key Features

### 1. Department-Based Filtering
- **Deans**: See only teachers from their own college/department
- **Registrar**: See all teachers across all colleges
- Filtering based on `department` or `college` field match

### 2. Teacher Information Display
Each teacher card shows:
- Name with avatar (initials)
- Status indicator (Active/Inactive)
- Email address
- Phone number (if available)
- Number of assigned rooms
- Custom access badge (if applicable)

### 3. Statistics Dashboard
- Total teachers count
- Active teachers count
- Inactive teachers count
- Number of departments/colleges

### 4. Search Functionality
Search teachers by:
- Name
- Email
- College/Department

### 5. Grouping by College
Teachers are organized and displayed by their college/department for easy navigation.

## Implementation Details

### File Created
**`src/pages/TeachersDirectory.jsx`**
- React component with real-time Firestore subscription
- Automatic filtering based on user role
- Responsive grid layout
- Search and grouping functionality

### Navigation Integration
**Added to**:
- `src/App.jsx` - Route `/teachers`
- `src/constants/rolePermissions.js` - Added to NAV_ITEMS and ROLE_NAV_KEYS
- `src/components/LeftNav.jsx` - Icon mapping
- `src/constants/accessCatalog.js` - Access control

### Access Control
**Permission**: No special permission required (null)
**Available to**:
- ✅ Registrar (sees all teachers)
- ✅ Dean (sees only teachers from their college)
- ❌ Other roles (not included in default navigation)

### Navigation Position
Placed after "Course Scheduling" and before "Room Availability" in the left navigation.

## Data Flow

### For Deans:
1. Dean logs in with profile containing `department: "CAS"` (or `college: "CAS"`)
2. System loads all teachers from Firestore
3. Filters to show only teachers where `teacher.department === "CAS"` or `teacher.college === "CAS"`
4. Groups filtered teachers by department
5. Displays in card grid

### For Registrar:
1. Registrar logs in
2. System loads all teachers from Firestore
3. Shows all teachers without filtering
4. Groups by department/college
5. Displays in card grid

## User Experience

### Dean View:
```
Teachers Directory
Teachers in College of Arts and Sciences

[Stats: 12 Total | 11 Active | 1 Inactive | 1 Your College]

[Search bar]

College of Arts and Sciences (12 teachers)
┌─────────────┬─────────────┬─────────────┐
│ Teacher 1   │ Teacher 2   │ Teacher 3   │
│ CAS         │ CAS         │ CAS         │
└─────────────┴─────────────┴─────────────┘
```

### Registrar View:
```
Teachers Directory
View all teachers across colleges

[Stats: 45 Total | 42 Active | 3 Inactive | 5 Departments]

[Search bar]

College of Arts and Sciences (12 teachers)
┌─────────────┬─────────────┬─────────────┐
│ Teacher 1   │ Teacher 2   │ Teacher 3   │
└─────────────┴─────────────┴─────────────┘

College of Engineering and IT (15 teachers)
┌─────────────┬─────────────┬─────────────┐
│ Teacher 4   │ Teacher 5   │ Teacher 6   │
└─────────────┴─────────────┴─────────────┘
```

## Technical Details

### Filtering Logic
```javascript
// For Dean
const filteredTeachers = users.filter(user => {
  if (user.roleValue !== 'teacher') return false;
  
  if (isDean && myDepartment) {
    const teacherDept = user.department || user.college;
    return teacherDept && teacherDept.toLowerCase() === myDepartment.toLowerCase();
  }
  
  return true; // Registrar sees all
});
```

### Grouping Logic
```javascript
const teachersByDepartment = useMemo(() => {
  const groups = {};
  filteredTeachers.forEach(teacher => {
    const dept = teacher.department || teacher.college || 'Unassigned';
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(teacher);
  });
  return groups;
}, [filteredTeachers]);
```

## Benefits

1. **Department Isolation**: Deans only see their own teachers, maintaining privacy
2. **Real-Time Updates**: Changes to teacher data reflect immediately
3. **Easy Navigation**: Grouped by college for quick access
4. **Search Capability**: Find specific teachers quickly
5. **Comprehensive Info**: All relevant teacher information in one place
6. **Status Monitoring**: Quick view of active/inactive teachers

## Integration with Existing Systems

### Works With:
- ✅ College Inventory (teachers linked by college code)
- ✅ System Administration (user data source)
- ✅ Role-based access control
- ✅ Real-time Firestore subscriptions

### Compatible With:
- Department/college assignment system
- User status management (Active/Inactive)
- Custom access permissions
- Room assignment tracking

## Future Enhancements (Optional)

1. **Contact Actions**: Click to email or call
2. **Schedule View**: See teacher's course schedule
3. **Export List**: Download teacher list as CSV/PDF
4. **Bulk Actions**: Update multiple teachers at once
5. **Filter by Status**: Toggle Active/Inactive view
6. **Sort Options**: Sort by name, status, or assigned rooms

## Testing Scenarios

### As Dean of CAS:
1. Navigate to "Teachers" in left nav
2. Should see only teachers with `department: "CAS"` or `college: "CAS"`
3. Search for a teacher name - should filter within CAS teachers only
4. Should see stats reflecting only CAS teachers

### As Registrar:
1. Navigate to "Teachers" in left nav
2. Should see all teachers from all colleges
3. Should see multiple college groups
4. Search should work across all teachers
5. Stats should reflect all teachers system-wide

### Edge Cases:
- ✅ Teacher with no department assigned → Shows in "Unassigned" group
- ✅ Dean with no department → Shows all teachers
- ✅ Empty college → Shows "No teachers found" message
- ✅ Search with no results → Shows "No teachers match your search"

## Database Requirements

**No new collections needed** - Uses existing `/users` collection

**Required Fields**:
- `roleValue: 'teacher'` - Identifies user as teacher
- `department` or `college` - College/department assignment
- `name` - Teacher name
- `email` - Contact email
- `status` - Active/Inactive status

**Optional Fields**:
- `phone` - Contact phone
- `assignedRoomIds` - Array of assigned rooms
- `useCustomAccess` - Custom permissions flag

## Security

- Firestore rules already in place (from `/users` collection)
- Automatic filtering by department prevents unauthorized access
- No additional security rules needed

## Deployment Checklist

- [x] Create TeachersDirectory.jsx page
- [x] Add route to App.jsx
- [x] Add to role permissions (NAV_ITEMS, ROLE_NAV_KEYS, ROUTE_PERMISSIONS)
- [x] Add icon mapping to LeftNav
- [x] Add to access catalog for role configuration
- [x] Test dean filtering
- [x] Test registrar view
- [x] Test search functionality
- [x] Test empty states

The Teachers Directory is ready for use! 🎓

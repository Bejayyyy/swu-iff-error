# Simple Schedule Access Control - Implementation Guide

## Overview
Registrar controls which colleges can create course schedules:
1. Registrar selects first college → grants access
2. First college creates schedules
3. Registrar clicks "Allow All Remaining" → all colleges can schedule
4. Deans see other colleges' schedules to avoid room conflicts

## ✅ Completed Files

### 1. Service (`src/services/scheduleAccessService.js`)
Functions:
- `subscribeScheduleAccess()` - Real-time access control for sy/semester
- `grantFirstCollegeAccess()` - Registrar grants first college
- `grantAllRemainingAccess()` - Registrar allows all colleges
- `hasSchedulingAccess()` - Check if college can schedule
- `isFirstCollege()` - Check if this is first college
- `getAccessStatusMessage()` - Get UI message for dean

### 2. Firestore Rules (`firestore.rules`)
Added `/schedule_access_control/{accessId}`:
- Registrar: Full read/write
- All staff: Read to check their access

### 3. Modal (`src/components/modals/GrantScheduleAccessModal.jsx`)
- Fetches colleges from College Inventory
- Registrar selects college
- Submits to grant access

## 🔧 Modifications Needed

### Update `src/pages/CourseSchedulingNew.jsx`

Add these imports at the top:
```javascript
import {
  subscribeScheduleAccess,
  grantFirstCollegeAccess,
  grantAllRemainingAccess,
  hasSchedulingAccess,
  getAccessStatusMessage,
} from '../services/scheduleAccessService';
import GrantScheduleAccessModal from '../components/modals/GrantScheduleAccessModal';
```

Add state variables:
```javascript
const [scheduleAccess, setScheduleAccess] = useState(null);
const [showGrantAccessModal, setShowGrantAccessModal] = useState(false);
```

Subscribe to access control:
```javascript
// Subscribe to schedule access control
useEffect(() => {
  if (!activeSchoolYearId || !semester) {
    setScheduleAccess(null);
    return undefined;
  }

  return subscribeScheduleAccess(
    activeSchoolYearId,
    semester,
    (access) => setScheduleAccess(access),
    (err) => console.error('Error loading schedule access:', err)
  );
}, [activeSchoolYearId, semester]);
```

Check if current dean has access:
```javascript
// Check if current dean has scheduling access
const myCollege = isDean ? (profile?.college || profile?.department) : null;
const accessStatus = useMemo(() => {
  if (!isDean || !myCollege) return { hasAccess: false, message: '', isFirst: false };
  return getAccessStatusMessage(scheduleAccess, myCollege);
}, [isDean, myCollege, scheduleAccess]);

// Update canPlot to include access check
const canPlot = useMemo(() => {
  if (isRegistrar) return false; // Registrar can only view
  if (isDean && profile?.uid === selectedDeanUid) {
    return accessStatus.hasAccess; // Must have access
  }
  return false;
}, [isRegistrar, isDean, profile, selectedDeanUid, accessStatus]);
```

Add Registrar UI above the grid:
```javascript
{/* Registrar Access Control Panel - Add before WeeklyScheduleGrid */}
{isRegistrar && (
  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-5 mb-4">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-black text-sm" style={{ color: '#2B3235' }}>
          📋 Schedule Access Control
        </h3>
        <p className="text-xs text-gray-600 mt-0.5">
          Manage which colleges can create schedules
        </p>
      </div>
      
      {!scheduleAccess && (
        <button
          type="button"
          onClick={() => setShowGrantAccessModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] transition-all flex items-center gap-2"
        >
          <Send size={16} />
          Grant First College Access
        </button>
      )}
    </div>

    {scheduleAccess ? (
      <div className="space-y-3">
        {/* Current Status */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs font-bold mb-2" style={{ color: '#2B3235' }}>
            Current Status:
          </p>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              scheduleAccess.status === 'all_allowed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {scheduleAccess.status === 'all_allowed' 
                ? '✅ All Colleges Can Schedule' 
                : '⏳ First College Only'}
            </span>
          </div>
        </div>

        {/* First College Info */}
        {scheduleAccess.firstCollege && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs font-bold mb-2" style={{ color: '#2B3235' }}>
              First College (Currently Scheduling):
            </p>
            <p className="text-sm font-bold text-[#800000]">
              {scheduleAccess.firstCollege.name}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Granted: {new Date(scheduleAccess.firstCollege.grantedAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Action Button */}
        {scheduleAccess.status === 'first_only' && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('Allow all remaining colleges to create their schedules? This action cannot be undone.')) return;
              try {
                await grantAllRemainingAccess(activeSchoolYearId, semester, profile?.uid);
              } catch (err) {
                alert(err.message || 'Failed to grant access.');
              }
            }}
            className="w-full px-4 py-3 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all flex items-center justify-center gap-2"
          >
            ✅ Allow All Remaining Colleges to Schedule
          </button>
        )}

        {scheduleAccess.status === 'all_allowed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-bold text-green-800">
              ✅ All colleges have scheduling access
            </p>
            {scheduleAccess.allAccessGrantedAt && (
              <p className="text-[10px] text-green-700 mt-1">
                Granted: {new Date(scheduleAccess.allAccessGrantedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    ) : (
      <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          No access control set for this semester. Click "Grant First College Access" to begin.
        </p>
      </div>
    )}
  </div>
)}

{/* Dean Access Status Banner - Add before grid */}
{isDean && !accessStatus.hasAccess && (
  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-4 text-center">
    <div className="w-16 h-16 rounded-full bg-yellow-200 flex items-center justify-center mx-auto mb-3">
      <span className="text-3xl">⏳</span>
    </div>
    <h3 className="font-black text-lg mb-2" style={{ color: '#92400E' }}>
      Waiting for Access
    </h3>
    <p className="text-sm font-semibold text-yellow-800">
      {accessStatus.message}
    </p>
  </div>
)}

{isDean && accessStatus.hasAccess && accessStatus.isFirst && (
  <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-4 mb-4">
    <p className="text-sm font-bold text-blue-900">
      🎯 You are the first college to schedule. {accessStatus.message}
    </p>
  </div>
)}
```

Update the WeeklyScheduleGrid props:
```javascript
<WeeklyScheduleGrid
  // ... existing props ...
  readOnly={!isDean || profile?.uid !== selectedDeanUid || !accessStatus.hasAccess}
  canPlot={canPlot}
  // ... rest of props ...
  emptyMessage={
    !accessStatus.hasAccess 
      ? accessStatus.message 
      : canPlot 
        ? 'Click or drag on the grid to add schedule blocks.' 
        : 'No schedule blocks yet.'
  }
/>
```

Add modal at the bottom:
```javascript
{/* Grant Access Modal */}
{showGrantAccessModal && (
  <GrantScheduleAccessModal
    onClose={() => setShowGrantAccessModal(false)}
    onGrant={async ({ collegeCode, collegeName }) => {
      await grantFirstCollegeAccess({
        schoolYearId: activeSchoolYearId,
        schoolYearLabel: schoolYearLabel,
        semester,
        collegeCode,
        collegeName,
        grantedBy: profile?.uid,
      });
    }}
    schoolYearLabel={schoolYearLabel}
    semester={semester}
  />
)}
```

## Room Conflict Checking (Future Enhancement)

In `AddPlotEntryModalEnhanced.jsx` Step 5 (Room Selection):
- Query all schedule entries across all deans for that room
- Filter by approved colleges only
- Show occupied time slots
- Highlight conflicts in red

Example query:
```javascript
// Get all entries for this room from approved colleges
const allEntriesForRoom = await getDocs(
  collectionGroup(db, 'entries'),
  where('roomCode', '==', selectedRoom),
  where('scheduleMode', '==', scheduleTab),
  where('semester', '==', semester)
);
```

## Testing Checklist

- [ ] Registrar sees "Grant First College Access" button
- [ ] Registrar can select college from dropdown
- [ ] Selected college's dean gets access immediately
- [ ] Other deans see "waiting for access" message
- [ ] Other deans CANNOT click/drag on grid
- [ ] Registrar sees "Allow All Remaining" button
- [ ] After clicking, all deans get access
- [ ] All deans can now schedule simultaneously
- [ ] Access persists across page refreshes
- [ ] Access is scoped to school year + semester

## Deployment Steps

1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Test with Test Data**:
   - Create test colleges in College Inventory
   - Create test dean users
   - Test the workflow end-to-end

3. **Create Initial Access Control** (if needed):
   Run in Firestore console or via service:
   ```javascript
   await resetScheduleAccess(schoolYearId, semester);
   ```

## Data Structure

### Firestore Document: `/schedule_access_control/{schoolYearId}_sem{N}`
```javascript
{
  schoolYearId: 'sy_2025_2026',
  schoolYearLabel: 'SY 2025-2026',
  semester: 1,
  
  firstCollege: {
    code: 'CAS',
    name: 'College of Arts and Sciences',
    grantedAt: '2026-01-15T10:00:00Z'
  },
  
  approvedColleges: ['CAS'], // Will have all codes after "allow all"
  
  status: 'first_only' | 'all_allowed',
  
  allAccessGrantedAt: '2026-01-20T14:30:00Z',
  allAccessGrantedBy: 'registrar_uid',
  
  grantedBy: 'registrar_uid',
  createdAt: <timestamp>,
  updatedAt: <timestamp>
}
```

## UI Flow

### Registrar Flow:
1. Opens Course Scheduling
2. Sees "Grant First College Access" button
3. Clicks → Modal opens → Selects college → Grants
4. Sees status: "First College Only - CAS"
5. Waits for CAS to finish
6. Clicks "Allow All Remaining Colleges"
7. Status changes to "All Colleges Can Schedule"

### Dean Flow (First College):
1. Opens Course Scheduling
2. Sees blue banner: "You are the first college to schedule"
3. Can create schedules normally
4. Completes scheduling

### Dean Flow (Other Colleges - Before Access):
1. Opens Course Scheduling
2. Sees yellow banner: "It is not yet your turn"
3. Grid is disabled (no click/drag)
4. Waits for registrar approval

### Dean Flow (Other Colleges - After Access):
1. Receives access
2. Banner disappears
3. Can schedule normally
4. In room selection, sees other colleges' schedules
5. Avoids time conflicts

## Benefits

✅ **Simple**: Only 2 states (first only, all allowed)
✅ **Flexible**: Registrar chooses first college dynamically
✅ **Clear**: Deans know when they can/cannot schedule
✅ **Conflict Prevention**: All deans see existing schedules
✅ **No Complex Workflow**: No sequential ordering beyond first
✅ **Minimal Code**: Reuses existing CourseSchedulingNew

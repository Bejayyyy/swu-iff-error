# Controlled Course Scheduling - Implementation Progress

## Overview
Adding a registrar-controlled course scheduling workflow alongside the existing system.
- Registrar assigns base template creator
- Base creator develops template
- Other deans adopt template in sequence
- Keeps existing CourseSchedulingNew.jsx untouched

## ✅ Completed

### 1. **Constants** (`src/constants/controlledScheduling.js`)
- Session status types (DRAFT, BASE_CREATION, ADOPTION_PHASE, COMPLETED)
- Base schedule status (PENDING, IN_PROGRESS, READY, APPROVED)
- Participant status (WAITING, ACTIVE, COMPLETED, SKIPPED)
- Helper functions for labels and colors

### 2. **Service Layer** (`src/services/controlledSchedulingService.js`)
Core functions implemented:
- `createScheduleSession()` - Registrar creates new session
- `subscribeScheduleSessions()` - List all sessions (registrar)
- `subscribeMyScheduleSessions()` - User's sessions (dean)
- `subscribeScheduleSession()` - Single session details
- `markBaseScheduleReady()` - Base creator marks ready
- `approveBaseSchedule()` - Registrar approves template
- `markBaseTemplateAdopted()` - Participant marks they copied
- `completeParticipantSchedule()` - Participant finishes
- `skipParticipant()` - Registrar skips a participant
- `activateParticipant()` - Registrar manually activates
- `copyBaseScheduleToSection()` - Copy template to dean's section
- `deleteScheduleSession()` - Delete session
- `updateSessionStatus()` - Update session status

### 3. **Firestore Security Rules** (`firestore.rules`)
Added rules for `/schedule_control_sessions/{sessionId}`:
- Registrar: Full read/write access
- Deans: Read if they're base creator or participant
- Base creator: Can update their baseScheduleStatus
- Active participant: Can update their participant status

### 4. **Create Session Modal** (`src/components/modals/CreateScheduleSessionModal.jsx`)
Complete modal for registrar to:
- Set session title, school year, semester
- Choose base template creator
- Add participants in order
- Reorder participants with up/down buttons
- Remove participants
- Submit to create session

## 🚧 Remaining Work

### 5. **Main Page Component** (`src/pages/CourseSchedulingControlled.jsx`)
**NEEDS TO BE CREATED**

#### Registrar View:
- List all sessions (with status badges)
- Create new session button → opens CreateScheduleSessionModal
- View session details
- Approve base schedule button (when ready)
- Skip/activate participants
- Complete session

#### Dean View:
- List sessions where they're involved
- Base Creator view:
  - Create BASE_TEMPLATE schedule
  - "Mark as Ready" button
  - See approval status
- Participant view:
  - View base template (read-only)
  - "Copy Base Schedule" button
  - Edit their own section schedules
  - "Submit Schedule" button

### 6. **Additional Modals**

#### `ViewSessionDetailsModal.jsx`
- Show full session info
- Participant list with statuses
- Timeline of progress
- Actions (approve, skip, activate)

#### `ViewBaseTemplateModal.jsx`
- Read-only view of base template schedule
- Weekly grid showing all entries
- Filter by day/time/room
- "Copy to My Section" button

#### `ConfirmCopyScheduleModal.jsx`
- Select target section
- Preview what will be copied
- Confirm copy action
- Show success message

### 7. **Navigation Integration**

**Update `src/components/LeftNav.jsx`:**
```jsx
{isRegistrar && (
  <>
    <NavLink to="/course-scheduling-new">
      <Calendar size={16} />
      <span>Course Scheduling</span>
    </NavLink>
    <NavLink to="/course-scheduling-controlled">
      <Users size={16} />
      <span>Controlled Scheduling</span>
      <span className="badge-new">NEW</span>
    </NavLink>
  </>
)}
```

### 8. **Routes Integration**

**Update `src/App.jsx`:**
```jsx
import CourseSchedulingControlled from './pages/CourseSchedulingControlled';

// Add route
<Route 
  path="/course-scheduling-controlled" 
  element={<ProtectedRoute><CourseSchedulingControlled /></ProtectedRoute>} 
/>
```

### 9. **Firestore Indexes**

**Update `firestore.indexes.json`:**
```json
{
  "collectionGroup": "schedule_control_sessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 10. **Notification System** (Optional Enhancement)
- Notify base creator when session starts
- Notify registrar when base is ready
- Notify participants when it's their turn
- Notify registrar when participant completes

## Data Flow

### Creating a Session
```
Registrar → CreateScheduleSessionModal
  ↓
Fill details (title, school year, semester)
  ↓
Select base creator (e.g., CAS Dean)
  ↓
Add participants in order (other deans)
  ↓
createScheduleSession() → Firestore
  ↓
Status: BASE_CREATION
Base creator notified
```

### Base Template Creation
```
Base Creator logs in
  ↓
Sees "Create Base Template" banner
  ↓
Creates schedule entries in BASE_TEMPLATE section
  ↓
Clicks "Mark as Ready for Review"
  ↓
markBaseScheduleReady() → Firestore
  ↓
Registrar notified
```

### Approval & Adoption
```
Registrar reviews base template
  ↓
Clicks "Approve as Template"
  ↓
approveBaseSchedule() → Firestore
  ↓
Status: ADOPTION_PHASE
First participant activated
  ↓
Participant sees:
  - Base template (read-only)
  - "Copy to My Section" button
  ↓
Clicks copy → copyBaseScheduleToSection()
  ↓
Edits copied schedule
  ↓
Clicks "Submit"
  ↓
completeParticipantSchedule()
  ↓
Next participant activated (repeat)
```

## Testing Checklist

- [ ] Registrar can create session
- [ ] Base creator receives notification
- [ ] Base creator can create BASE_TEMPLATE schedule
- [ ] Base creator can mark as ready
- [ ] Registrar can see "ready for review" status
- [ ] Registrar can approve base schedule
- [ ] First participant gets activated
- [ ] Participant can view base template
- [ ] Participant can copy base schedule
- [ ] Copied schedule appears in their section
- [ ] Participant can edit copied schedule
- [ ] Participant can submit when done
- [ ] Next participant gets activated automatically
- [ ] All participants can complete in sequence
- [ ] Session marks as COMPLETED when done
- [ ] Registrar can skip participants
- [ ] Registrar can manually activate participants
- [ ] Firestore security rules work correctly

## Next Steps

1. **Create CourseSchedulingControlled.jsx page**
   - Implement registrar view
   - Implement dean (base creator) view
   - Implement dean (participant) view

2. **Create remaining modals**
   - ViewSessionDetailsModal
   - ViewBaseTemplateModal
   - ConfirmCopyScheduleModal

3. **Add navigation and routes**

4. **Deploy Firestore rules and indexes**

5. **Test full workflow end-to-end**

6. **Add notifications** (optional)

## File Structure
```
src/
  constants/
    ✅ controlledScheduling.js
  services/
    ✅ controlledSchedulingService.js
  components/
    modals/
      ✅ CreateScheduleSessionModal.jsx
      ⏳ ViewSessionDetailsModal.jsx
      ⏳ ViewBaseTemplateModal.jsx
      ⏳ ConfirmCopyScheduleModal.jsx
  pages/
    ✅ CourseSchedulingNew.jsx (untouched)
    ⏳ CourseSchedulingControlled.jsx (NEW)
```

## Questions to Clarify

1. **Base Template Storage**: Should base creator use a special "BASE_TEMPLATE" section, or their own regular section?
   - Current: Uses "BASE_TEMPLATE" special section
   - Alternative: Use their actual section, mark entries with `isBaseTemplate: true`

2. **Multiple Templates**: Can there be multiple sessions running at the same time?
   - Current: Yes, supports multiple concurrent sessions
   - Each session is independent

3. **Template Visibility**: Can participants see OTHER participants' schedules?
   - Current: Only see base template
   - Enhancement: Add "View All Schedules" feature

4. **Editing After Copy**: Can participants edit the copied schedule?
   - Current: Yes, full edit access
   - Entries marked with `copiedFromTemplate: true`

Would you like me to continue with creating the main CourseSchedulingControlled.jsx page?

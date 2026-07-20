# Controlled Course Scheduling Workflow - Design Document

## Overview
A registrar-controlled system where:
1. Registrar assigns a "base schedule creator" (usually CAS dean or specific dean)
2. The designated dean creates the template schedule that others can view and adopt
3. After base schedule is created, registrar can unlock other deans in sequence
4. Other deans can copy the base schedule as a starting point, then customize it

## Features

### 1. **Registrar Controls**
- Create a "Schedule Control Session" for a semester
- Assign the base template creator (specific dean)
- Set the order for other deans to input schedules
- Lock/unlock deans' access to edit schedules
- Mark base schedule as "template" once approved

### 2. **Base Template Creator**
- Designated dean creates the first schedule
- Their schedule becomes visible to all deans as a reference
- Can mark schedule as "ready for adoption"
- Registrar must approve before it becomes the official template

### 3. **Adoption Workflow**
- Other deans can view the base template (read-only)
- "Copy Base Schedule" button to duplicate all entries
- Customize copied schedule for their college/sections
- Submit when ready

### 4. **Turn-Based Access**
- Registrar controls who can edit at any time
- Deans wait for their turn (similar to plot requests)
- Notification when it's their turn to input schedules
- Status tracking: Waiting → Active → Completed

## Data Structure

### Schedule Control Session
```javascript
{
  id: 'scs_<timestamp>',
  schoolYearId: 'sy_2025_2026',
  semester: 1,
  status: 'draft' | 'base_creation' | 'adoption_phase' | 'completed',
  
  // Base template creator
  baseCreatorUid: '<dean_uid>',
  baseCreatorName: 'Dean Name',
  baseCreatorCollege: 'CAS',
  baseScheduleStatus: 'pending' | 'in_progress' | 'ready' | 'approved',
  baseScheduleApprovedAt: <timestamp>,
  
  // Sequential access control
  participants: [
    {
      uid: '<dean_uid>',
      name: 'Dean Name',
      college: 'Medicine',
      order: 1,
      status: 'waiting' | 'active' | 'completed',
      canEdit: false,
      startedAt: null,
      completedAt: null,
      adoptedBaseTemplate: false,
    }
  ],
  
  currentTurnUid: '<dean_uid>',
  
  createdBy: '<registrar_uid>',
  createdAt: <timestamp>,
  updatedAt: <timestamp>,
}
```

### Schedule Entry Enhancement
```javascript
{
  // ... existing fields ...
  
  // Template metadata
  isBaseTemplate: boolean,
  copiedFromTemplate: boolean,
  templateCreatorUid: '<dean_uid>',
  scheduleControlSessionId: '<session_id>',
  
  // ... rest of fields ...
}
```

## User Interface

### Registrar View
1. **Create Control Session** button
   - Select school year and semester
   - Choose base template creator
   - Add participants in order
   - Save and notify base creator

2. **Session Management Dashboard**
   - View current session status
   - See who's working on what
   - Approve base schedule as template
   - Unlock next dean's turn
   - View all schedules side-by-side

3. **Base Schedule Approval**
   - Review base creator's schedule
   - "Approve as Template" button
   - Once approved, opens adoption phase
   - Notify all participating deans

### Dean View (Base Creator)
1. **Special Banner**: "You are creating the BASE TEMPLATE schedule"
2. Regular schedule creation interface
3. **"Mark as Ready for Review"** button
4. Wait for registrar approval
5. Notification when approved

### Dean View (Participants)
1. **Waiting State**
   - View-only access to base template
   - See their position in queue
   - "Waiting for your turn" message

2. **Active State**
   - **"Copy Base Schedule"** button (prominent)
   - Option to start from scratch or copy template
   - Edit their own schedule
   - **"Submit Schedule"** button when done

3. **Base Template Viewer**
   - Read-only side panel showing base template
   - Filter by day, time, room
   - Compare with their own schedule

## Workflow Steps

### Phase 1: Setup (Registrar)
1. Registrar creates Schedule Control Session
2. Assigns base creator (e.g., CAS Dean)
3. Adds participants in order
4. System notifies base creator

### Phase 2: Base Creation
1. Base creator develops template schedule
2. Marks as "Ready for Review"
3. Registrar reviews and approves
4. System marks as official template
5. Participants notified

### Phase 3: Adoption Phase
1. First participant gets "Active" status
2. They can:
   - View base template
   - Copy it to their section
   - Customize as needed
   - Submit when done
3. System moves to next participant
4. Repeat until all complete

### Phase 4: Completion
1. All deans submitted schedules
2. Registrar reviews all schedules
3. Marks session as completed
4. Schedules become final

## Technical Implementation

### New Collections
```
/schedule_control_sessions/{sessionId}
  - Session metadata
  - Participants list
  - Current turn tracking
```

### New Service Functions
```javascript
// Registrar functions
createScheduleControlSession(...)
approveBaseSchedule(sessionId)
activateNextParticipant(sessionId, currentUid)
completeSession(sessionId)

// Dean functions
markBaseScheduleReady(sessionId)
copyBaseScheduleToSection(sessionId, deanUid, section)
submitDeanSchedule(sessionId, deanUid)

// Subscription
subscribeScheduleControlSession(sessionId, onData, onError)
subscribeBaseTemplate(sessionId, onData, onError)
```

### Firestore Rules
```javascript
match /schedule_control_sessions/{sessionId} {
  // Registrar can manage
  allow read, write: if isRegistrar();
  
  // Deans can read if they're participants
  allow read: if isDean() && 
    resource.data.participants.hasAny([{uid: request.auth.uid}]);
}
```

### UI Components
1. **CreateScheduleSessionModal** - Registrar creates session
2. **ScheduleSessionDashboard** - Registrar overview
3. **BaseTemplateViewer** - Deans view template
4. **CopyScheduleButton** - One-click copy
5. **SessionStatusBanner** - Shows current status

## Benefits
1. ✅ **Consistency**: All colleges can base their schedules on approved template
2. ✅ **Control**: Registrar manages the entire process
3. ✅ **Flexibility**: Deans can still customize for their needs
4. ✅ **Visibility**: Everyone sees the base template
5. ✅ **Order**: Sequential access prevents conflicts
6. ✅ **Tracking**: Clear status for each participant

## Future Enhancements
- **Comparison View**: Side-by-side template vs college schedule
- **Conflict Detection**: Alert if deviating too much from template
- **Version History**: Track changes to base template
- **Bulk Copy**: Copy specific days or time slots only
- **Comments**: Deans can leave notes on template
- **Analytics**: Show adoption rate and customization patterns

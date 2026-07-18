# Enhanced GSD Maintenance Management Workflow

## Overview
The maintenance system has been enhanced to support a proper workflow where GSD schedules maintenance **after** acknowledging reports, with support for both quick fixes (hours) and multi-day maintenance.

## 📋 Complete Workflow

### 1. **User Reports Issue**
- Any user can report maintenance issues from room details page
- User fills out:
  - Issue description
  - Priority level (urgent/high/medium/low)
- Report is created with status: `pending`

### 2. **GSD Receives Notification**
- Real-time notification appears in TopNav
- Shows all unacknowledged reports (pending + acknowledged but not started)
- Color-coded by priority:
  - 🔴 Urgent/High priority (red)
  - 🟠 Medium/Low priority (orange)

### 3. **GSD Reviews Report in Maintenance Dashboard**
- Navigate to `/maintenance-dashboard`
- **Pending Repair Tickets section** shows urgent tickets at top
- Each pending report shows:
  - Room and building location
  - Issue description
  - Reporter information
  - Priority level
  - Timestamp

### 4. **GSD Acknowledges & Schedules Maintenance** ⭐ NEW WORKFLOW
When GSD views a pending report, they have two options:

#### Option A: Acknowledge First
1. Click "✓ Acknowledge Report"
2. Report status changes to `acknowledged`
3. Then click "📅 Schedule Maintenance" to set the date/time

#### Option B: Schedule Directly (Auto-acknowledges)
1. Click "📅 Schedule Maintenance" directly
2. Report is automatically acknowledged
3. Opens schedule modal

### 5. **Schedule Maintenance Modal** ⭐ ENHANCED
GSD chooses between two maintenance types:

#### 🟦 Quick Fix (Hours-based)
- For issues that can be fixed in the same day
- Fields:
  - **Date**: When the maintenance will happen
  - **Start Time**: What time to begin (e.g., 08:00)
  - **Duration**: 1-8 hours
- Example: "Air conditioning not cooling - can be fixed in 2 hours"
- Room is marked under maintenance for that specific time window
- Shows estimated completion time

#### 🟦 Multi-Day Maintenance
- For issues requiring multiple days
- Fields:
  - **Start Date**: First day of maintenance
  - **End Date**: Last day of maintenance
  - **Reason**: What work will be performed
- Example: "Floor renovation - requires 5 days"
- Room is unavailable for the entire date range

### 6. **Room Status Updates**
When maintenance is scheduled:
- Room status changes to `under-maintenance`
- Visual indicators appear:
  - 🔴 Room card is blurred and dimmed
  - 🟠 Orange maintenance badge
  - 🚫 "Reserve" button is hidden
  - 📅 Maintenance schedule info displayed
- Room becomes unavailable for reservations

### 7. **GSD Starts Work**
- GSD clicks "🔧 Start Repair" when they begin
- Report status changes to `in-progress`
- Maintenance schedule status updates

### 8. **GSD Completes Maintenance**
- GSD clicks "✓ Mark as Resolved" when done
- Report status changes to `resolved`
- Room status returns to `operational`
- Room becomes available for reservations again

## 🆕 Key Features Added

### 1. **Duration Type Selection**
```
⚡ Quick Fix              📅 Multi-Day
Can be fixed in hours     Requires multiple days
(same day)               (date range)
```

### 2. **Quick Fix Support**
- Hour-based scheduling (1-8 hours)
- Shows estimated completion time
- Stores in database:
  - `durationType: 'hours'`
  - `startTime: '08:00'`
  - `durationHours: 2`
  - `isQuickFix: true`

### 3. **Report-Schedule Linking**
- Schedules created from reports are linked via `reportId`
- Reports store the `scheduleId` when scheduled
- Easy tracking of which schedule addresses which report

### 4. **Auto-acknowledge on Schedule**
- If GSD schedules maintenance on a pending report
- Report is automatically acknowledged
- Saves a step in the workflow

## 📊 Database Schema Updates

### Maintenance Schedules Collection
```javascript
{
  roomId: string,
  roomName: string,
  buildingId: string,
  buildingName: string,
  startDate: string (YYYY-MM-DD),
  endDate: string (YYYY-MM-DD),
  reason: string,
  scheduledByUid: string,
  scheduledByName: string,
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled',
  
  // NEW FIELDS
  durationType: 'hours' | 'days',
  startTime: string (HH:MM) // Only for quick fixes
  durationHours: number // Only for quick fixes
  isQuickFix: boolean // True for hour-based maintenance
  reportId: string // Link to maintenance report (if scheduled from report)
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Maintenance Reports Collection
```javascript
{
  roomId: string,
  roomName: string,
  buildingId: string,
  buildingName: string,
  floor: number,
  issue: string,
  priority: 'urgent' | 'high' | 'medium' | 'low',
  status: 'pending' | 'acknowledged' | 'in-progress' | 'resolved' | 'closed',
  reportedByUid: string,
  reportedByName: string,
  reportedByEmail: string,
  acknowledgedByUid: string,
  acknowledgedByName: string,
  acknowledgedAt: timestamp,
  
  // NEW FIELD
  scheduleId: string // Link to maintenance schedule (set when GSD schedules)
  
  resolvedAt: timestamp,
  resolution: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Room Document Updates
```javascript
{
  // ... existing room fields
  maintenanceStatus: 'operational' | 'under-maintenance',
  maintenanceStartDate: string,
  maintenanceEndDate: string,
  maintenanceReason: string,
  maintenanceScheduleId: string,
  
  // NEW FIELDS
  maintenanceDurationType: 'hours' | 'days',
  maintenanceStartTime: string // Only for quick fixes
  maintenanceDurationHours: number // Only for quick fixes
}
```

## 🎯 User Experience Benefits

### For Reporters
- ✅ Clear visibility of issue status
- ✅ Know exactly when maintenance is scheduled
- ✅ Automatic notifications when status changes

### For GSD
- ✅ Flexible scheduling (hours or days)
- ✅ Quick fixes don't block room for entire day
- ✅ Clear workflow: acknowledge → schedule → start → complete
- ✅ All reports visible in one dashboard
- ✅ Priority-based organization

### For Room Users
- ✅ See exact maintenance schedule
- ✅ Know when room will be available again
- ✅ Quick fixes have minimal disruption
- ✅ Can't accidentally book rooms under maintenance

## 📁 Files Modified

1. **src/components/modals/ScheduleMaintenanceModal.jsx**
   - Added duration type selection (hours vs days)
   - Added quick fix form (date + time + hours)
   - Added multi-day form (start date + end date)
   - Shows estimated completion for quick fixes
   - Supports reportId parameter for linking

2. **src/pages/MaintenanceDashboard.jsx**
   - Added "📅 Schedule Maintenance" button to pending reports
   - Added "📅 Schedule Maintenance" button to acknowledged reports
   - Integrated ScheduleMaintenanceModal
   - Updated button flow: acknowledge → schedule → start → resolve

3. **src/services/maintenanceService.js**
   - Updated `scheduleRoomMaintenance()` to support:
     - `durationType` parameter
     - `startTime` parameter (for hours)
     - `durationHours` parameter (for hours)
     - `reportId` parameter (for linking)
   - Auto-acknowledges report when scheduled
   - Links schedule to report via IDs
   - Updates room with duration type info

## 🚀 Testing Checklist

- [ ] User can report maintenance issue
- [ ] GSD sees notification in real-time
- [ ] GSD can acknowledge report
- [ ] GSD can schedule quick fix (hours)
  - [ ] Shows estimated completion time
  - [ ] Room marked under maintenance
- [ ] GSD can schedule multi-day maintenance
  - [ ] Shows duration in days
  - [ ] Room unavailable for entire period
- [ ] GSD can start repair work
- [ ] GSD can mark as resolved
- [ ] Room returns to operational status
- [ ] Visual indicators appear correctly
- [ ] Report-schedule linking works

## 📈 Next Steps (Future Enhancements)

1. **Email Notifications**: Send email to reporter when status changes
2. **Recurring Maintenance**: Support scheduled recurring maintenance
3. **Work Orders**: Generate printable work orders
4. **Parts Inventory**: Track parts used in repairs
5. **Maintenance History**: Show complete history per room
6. **Mobile App**: GSD can update status from mobile device
7. **Analytics**: Reports on average repair time, common issues, etc.

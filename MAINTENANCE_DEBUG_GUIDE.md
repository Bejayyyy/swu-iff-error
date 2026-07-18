# Maintenance System Debugging Guide

## Issues Addressed

### 1. ✅ Maintenance Not Showing in Weekly Schedule
**Status**: Added extensive logging to debug

**Changes Made**:
- Added console.log statements throughout RoomDetails.jsx schedule generation
- Logs will show:
  - Room ID being subscribed to
  - Number of maintenance schedules received
  - Each schedule's details (dates, type, status)
  - Whether week overlaps with maintenance period
  - Each block being created

**How to Debug**:
1. Open browser console (F12)
2. Navigate to a room details page
3. Look for logs starting with `[RoomDetails]`
4. Check:
   - Are maintenance schedules being received?
   - Do the dates overlap with the current week?
   - Are blocks being created?

**Possible Issues**:
- `displayRoom.docId` might not match `roomId` in maintenance_schedules collection
- Date format mismatch (check if dates are stored as strings)
- Maintenance status might be 'cancelled' or 'completed'

### 2. ✅ Button Flow Fixed
**Status**: Implemented proper state-based button display

**New Flow**:
```
Pending Report (no schedule)
├─ Show: "Acknowledge" + "Schedule Maintenance"
├─ Click Acknowledge → status='acknowledged'
└─ Click Schedule → creates schedule, links scheduleId

Acknowledged Report (no schedule)
├─ Show: "Schedule Maintenance"
└─ Click Schedule → creates schedule, links scheduleId

Report with Schedule Linked
├─ Show: "✓ Maintenance scheduled" + "Start Repair"
└─ Click Start → status='in-progress'

In Progress Report
├─ Show: "Mark as Resolved"
└─ Click Resolve → status='resolved'

Resolved Report
└─ Show: "✓ Resolved" (no buttons)
```

**Key Changes**:
- Buttons now check `report.scheduleId` to determine if maintenance is scheduled
- "Schedule Maintenance" button disappears after scheduling
- "Acknowledge" button disappears after acknowledging

### 3. ⏳ Notification to Reporter
**Status**: Foundation added, needs full implementation

**Current Implementation**:
- Console log added in `acknowledgeMaintenanceReport()`
- Would notify: `report.reportedByEmail` or `report.reportedByName`

**To Fully Implement**:
You'll need to add a notification system. Here's the recommended approach:

```javascript
// In src/services/notificationService.js
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export async function sendMaintenanceNotification({
  userId,
  userEmail,
  type, // 'acknowledged', 'scheduled', 'in-progress', 'resolved'
  reportId,
  roomName,
  buildingName,
  message,
}) {
  const notificationRef = doc(collection(db, 'notifications'));
  
  await setDoc(notificationRef, {
    userId,
    userEmail,
    type: 'maintenance',
    subType: type,
    reportId,
    roomName,
    buildingName,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
}
```

Then update `maintenanceService.js`:
```javascript
import { sendMaintenanceNotification } from './notificationService';

export async function acknowledgeMaintenanceReport(reportId, acknowledgedByUid, acknowledgedByName) {
  // ... existing code ...

  // Send notification
  await sendMaintenanceNotification({
    userId: report.reportedByUid,
    userEmail: report.reportedByEmail,
    type: 'acknowledged',
    reportId,
    roomName: report.roomName,
    buildingName: report.buildingName,
    message: `Your maintenance report for ${report.roomName} has been acknowledged by GSD.`,
  });
}
```

## Debugging Steps

### Step 1: Check if Maintenance Schedules are Being Created

1. Go to Maintenance Dashboard
2. Click "Schedule Maintenance" on a report
3. Fill in the form and submit
4. Check browser console for any errors
5. Go to Firebase Console → Firestore → `maintenance_schedules` collection
6. Verify the document exists with correct fields:
   ```javascript
   {
     roomId: "document_id_of_room", // Make sure this matches!
     roomName: "101",
     startDate: "2026-01-15", // YYYY-MM-DD format
     endDate: "2026-01-17",
     durationType: "days" or "hours",
     isQuickFix: true/false,
     status: "scheduled",
     reportId: "linked_report_id", // Should be set
     // ... other fields
   }
   ```

### Step 2: Check Room ID Matching

The issue might be that `roomId` in maintenance_schedules doesn't match `docId` in rooms.

**Check RoomDetails**:
```javascript
// Add this console log in RoomDetails.jsx
console.log('[RoomDetails] Room docId:', displayRoom.docId);
console.log('[RoomDetails] Room id:', displayRoom.id);
```

**Check Maintenance Schedule**:
```javascript
// In maintenanceService.js scheduleRoomMaintenance
console.log('[Maintenance] Creating schedule for roomId:', roomId);
```

**Fix if Needed**:
- Ensure you're passing `displayRoom.docId` as `roomId` when scheduling
- Update RoomDetails.jsx if using wrong property

### Step 3: Check Date Formats

Maintenance blocks won't show if dates don't match format.

**Expected Format**: `YYYY-MM-DD` (e.g., "2026-01-15")

**Check in Console**:
```
[RoomDetails] Week dates: ["2026-01-13", "2026-01-14", "2026-01-15", ...]
[RoomDetails] Schedule dates: startDate="2026-01-15", endDate="2026-01-17"
[RoomDetails] Checking overlap - Maintenance: 2026-01-15 to 2026-01-17, Week: 2026-01-13 to 2026-01-19
[RoomDetails] Has overlap - creating blocks
```

If you see "No overlap" but dates look correct, check for timezone issues.

### Step 4: Verify Schedule Block Creation

Look for these logs:
```
[RoomDetails] Adding quick fix block on day 2: {...}
or
[RoomDetails] Adding multi-day block on day 2: {...}
```

If blocks are being created but not showing:
- Check if `type: 'Maintenance'` is set correctly
- Verify `Maintenance` color exists in `scheduleGrid.js`
- Check if `start` and `end` hours are within grid range (7-20)

### Step 5: Check WeeklyScheduleGrid

The grid should receive maintenance blocks and render them.

**Verify blocks prop**:
```javascript
// In RoomDetails.jsx before WeeklyScheduleGrid
console.log('[RoomDetails] Passing blocks to grid:', scheduleBlocks);
```

**Check grid rendering**:
```javascript
// In WeeklyScheduleGrid.jsx
console.log('[Grid] Received blocks:', blocks);
console.log('[Grid] Blocks by day:', blocksByDay);
```

## Common Issues & Solutions

### Issue: "No maintenance schedules received"
**Cause**: Subscription not working or no schedules in database
**Solution**: 
- Check Firebase Firestore rules allow read access
- Verify `roomId` filter matches room document ID
- Create a test schedule manually in Firebase Console

### Issue: "Has overlap but no blocks created"
**Cause**: Date comparison failing
**Solution**:
- Ensure dates include `T00:00:00` when creating Date objects
- Check for timezone offset issues
- Log the exact date values being compared

### Issue: "Blocks created but not visible"
**Cause**: Hours outside grid range
**Solution**:
- Change `end: 22` to `end: 20` (SCHEDULE_END_HOUR)
- Or extend grid: Update `SCHEDULE_END_HOUR` in scheduleGrid.js

### Issue: "Schedule button still shows after scheduling"
**Cause**: `scheduleId` not being linked to report
**Solution**:
- Check `scheduleRoomMaintenance` is updating report with `scheduleId`
- Verify report subscription is receiving the update
- Check console for "Report updated" confirmation

### Issue: "Maintenance shows on wrong week"
**Cause**: Week calculation off by one
**Solution**:
- Verify `weekStartDate` is Monday (day 1, not Sunday day 0)
- Check `addDays` function works correctly
- Log `weekDates` array to verify correct range

## Testing Checklist

- [ ] Create a quick fix maintenance (2 hours) for tomorrow at 2 PM
- [ ] Navigate to room details page
- [ ] Check current week includes tomorrow
- [ ] Verify orange "MAINTENANCE" block appears at 2-4 PM slot
- [ ] Create multi-day maintenance (3 days) starting tomorrow
- [ ] Verify orange blocks appear on all 3 days from 7 AM - 8 PM
- [ ] Switch to next week, verify maintenance doesn't show
- [ ] Switch to previous week, verify maintenance doesn't show
- [ ] Complete a maintenance, verify it disappears from schedule
- [ ] Click "Acknowledge" on pending report
- [ ] Verify "Acknowledge" button disappears
- [ ] Click "Schedule Maintenance"
- [ ] Verify "Schedule Maintenance" button disappears after scheduling
- [ ] Verify "✓ Maintenance scheduled" message appears
- [ ] Verify "Start Repair" button appears

## Next Steps After Debugging

Once maintenance appears in schedule:

1. **Remove console.logs** - Clean up the extensive logging
2. **Add notification system** - Implement full notification to reporters
3. **Add schedule editing** - Allow GSD to modify scheduled maintenance
4. **Add schedule cancellation** - Allow GSD to cancel if not needed
5. **Add conflict detection** - Warn if scheduling over existing reservations
6. **Add recurring maintenance** - Support weekly/monthly recurring schedules

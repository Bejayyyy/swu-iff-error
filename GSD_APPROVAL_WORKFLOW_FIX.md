# GSD Approval Workflow Fix

## Problem
GSD users could not see room reservations in their approval workflow, while Dean users could see theirs. GSD users would only see reservations they personally created, not reservations pending their approval.

## Root Cause
In the `subscribeRoomReservations` function in `reservationService.js`, GSD users were incorrectly grouped with "other roles" that only need to see their own reservations:

```javascript
// BEFORE (incorrect)
// For other roles (gsd, teacher, student_life, organization_head), see their own reservations
const q = query(
  reservationsCollection(),
  where('createdByUid', '==', userProfile.uid),
  orderBy('createdAt', 'desc')
);
```

This query only returned reservations created by the GSD user themselves, not the reservations waiting for GSD approval.

## Solution

### Role-Based Subscription Logic
Different roles have different visibility needs for reservations:

1. **Registrar**: See ALL reservations
2. **Dean**: See reservations from their college/department
3. **GSD, Student Life, Organization Head**: See all non-draft reservations (they participate in approval workflows)
4. **Teacher**: See only their own reservations

### Updated Code in `reservationService.js`

```javascript
export function subscribeRoomReservations(onData, onError, userProfile = null) {
  if (!userProfile) {
    onData([]);
    return () => {};
  }

  // Registrar can see all reservations
  if (userProfile.role === 'registrar') {
    const q = query(reservationsCollection(), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => onData(snap.docs.map(mapReservationDoc)), onError);
  }

  // Dean can see reservations from their college
  if (userProfile.role === 'dean') {
    const college = userProfile.college || userProfile.department;
    if (college) {
      const q = query(
        reservationsCollection(),
        where('college', '==', college),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, (snap) => onData(snap.docs.map(mapReservationDoc)), onError);
    }
  }

  // GSD, Student Life, and Organization Head see all non-draft reservations
  // They're part of approval workflows and need to see pending requests
  if (userProfile.role === 'gsd' || 
      userProfile.role === 'student_life' || 
      userProfile.role === 'organization_head') {
    const q = query(
      reservationsCollection(),
      where('status', 'in', [
        RESERVATION_STATUS.IN_PROGRESS,
        RESERVATION_STATUS.APPROVED,
        RESERVATION_STATUS.REJECTED
      ]),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => onData(snap.docs.map(mapReservationDoc)), onError);
  }

  // For other roles (teacher, etc.), see their own reservations
  const q = query(
    reservationsCollection(),
    where('createdByUid', '==', userProfile.uid),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snap) => onData(snap.docs.map(mapReservationDoc)), onError);
}
```

### Updated Firestore Indexes

Added a composite index for the GSD query in `firestore.indexes.json`:

```json
{
  "collectionGroup": "room_reservations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

This index supports querying by status (IN_PROGRESS, APPROVED, REJECTED) and sorting by creation date.

## Approval Workflow Overview

### Academic Reservations (Standard)
1. **Dean** - College/Department approval
2. **GSD** - General Services approval (if applicable)
3. **Registrar** - Final approval

### Non-Academic Reservations (Standard)
1. **Student Life** - Student activity approval
2. **GSD** - General Services approval
3. **Registrar** - Final approval

### Custom Manager Workflow
If a room/floor has a custom manager (dean delegation):
1. **Dean** - College approval
2. **GSD** - General Services approval
3. **Room Manager Dean** - Specific room/floor manager approval

## Firestore Security Rules
The Firestore rules already allowed GSD to read reservations:

```javascript
allow read: if isMainRole() && isPhinmaedEmail() && (
  isRegistrar()
  || resource.data.createdByUid == request.auth.uid
  || (isDean() && college matches)
  || hasRole('gsd')  // ← GSD can read
  || hasRole('organization_head')
  || hasRole('teacher')
  || hasRole('student_life')
);
```

The issue was in the **query**, not the security rules. The security rules permit access, but the query was too restrictive.

## Deployment Steps

1. **Deploy the new index** (required first):
   ```bash
   firebase deploy --only firestore:indexes
   ```
   Wait for the index to build (check Firebase Console).

2. **Deploy the code changes**:
   - The updated `reservationService.js` will automatically be used
   - Refresh the browser to load the new code

3. **Test with GSD account**:
   - Login as a GSD user
   - Navigate to Room Reservations
   - You should now see all pending reservations that require GSD approval
   - You can approve/reject reservations where the GSD step is pending

## Expected Behavior After Fix

### For GSD Users:
- See all reservations with status: IN_PROGRESS, APPROVED, or REJECTED
- Can approve reservations when GSD step is pending
- Cannot approve reservations at other workflow steps (Dean, Registrar)
- See full reservation history for context

### For Student Life Users:
- Same behavior as GSD
- See all non-draft reservations
- Can approve when their step is pending

### For Organization Head Users:
- Same behavior as GSD
- See all non-draft reservations
- Can approve when their step is pending

### For Dean Users:
- See only reservations from their assigned college/department
- Can approve when their step is pending

### For Teacher Users:
- See only reservations they created themselves
- Cannot participate in approval workflows (unless they have another role)

## Troubleshooting

If GSD still cannot see reservations:

1. **Check the user's role in Firestore**:
   - Open Firebase Console → Firestore
   - Navigate to `users` collection
   - Find the GSD user document
   - Verify `role: 'gsd'` and `status: 'active'`

2. **Check browser console for errors**:
   - Look for Firestore permission errors
   - Check if the index is still building

3. **Verify the index is deployed**:
   - Firebase Console → Firestore → Indexes
   - Look for `room_reservations` collection
   - Status should be "Enabled" for the `status + createdAt` index

4. **Check reservations have correct status**:
   - Reservations must have status: `in_progress`, `approved`, or `rejected`
   - Draft reservations (`status: 'draft'`) are intentionally hidden

## Related Files Modified
1. `src/services/reservationService.js` - Updated subscription query logic
2. `firestore.indexes.json` - Added composite index for status queries

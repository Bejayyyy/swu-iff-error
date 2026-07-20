# Firestore Permission Error Fix

## Problem
The application was throwing a "Missing or insufficient permissions" error when trying to subscribe to room reservations. The error occurred at `AppContext.jsx:226`.

## Root Cause
The `subscribeRoomReservations` function was attempting to query **all** room reservations without any filtering:

```javascript
const q = query(reservationsCollection(), orderBy('createdAt', 'desc'));
```

However, the Firestore security rules require role-based access control:
- **Registrars**: Can read all reservations
- **Deans**: Can read reservations from their college OR where they are assigned as custom manager OR their own reservations
- **Other roles** (GSD, Teacher, Student Life, Organization Head): Can read their own reservations

When a non-registrar user tried to query all reservations, Firestore denied the request because the query didn't match the security rules.

## Solution

### 1. Updated `reservationService.js`
Modified `subscribeRoomReservations` to accept a `userProfile` parameter and filter queries based on the user's role:

```javascript
export function subscribeRoomReservations(onData, onError, userProfile = null) {
  // If no user profile provided, return empty subscription
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

  // For other roles, see their own reservations
  const q = query(
    reservationsCollection(),
    where('createdByUid', '==', userProfile.uid),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snap) => onData(snap.docs.map(mapReservationDoc)), onError);
}
```

### 2. Updated `AppContext.jsx`
Modified the subscription call to pass the user profile:

```javascript
const unsub = subscribeRoomReservations(
  (list) => {
    setRequests(list);
    setRequestsLoading(false);
    setRequestsError(null);
  },
  (err) => {
    console.error('Reservations subscription error:', err);
    setRequestsError(err.message || 'Failed to load reservations.');
    setRequestsLoading(false);
  },
  profile, // Pass user profile for role-based filtering
);
```

### 3. Updated `firestore.indexes.json`
Added composite indexes to support the new filtered queries:

```json
{
  "collectionGroup": "room_reservations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "college", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "room_reservations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "createdByUid", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Deployment Steps

1. **Deploy the new indexes** (must be done first):
   ```bash
   firebase deploy --only firestore:indexes
   ```
   Note: Index creation can take several minutes. Wait until the Firebase console shows "Enabled" status.

2. **Deploy the application** (after indexes are ready):
   - The code changes are already in place
   - Refresh the browser to load the updated code

## Expected Behavior After Fix

- **Registrars**: See all room reservations across all colleges
- **Deans**: See only reservations from their assigned college/department
- **Other staff roles**: See only reservations they created
- No permission errors should occur during subscription

## 404 Error
The 404 error mentioned in your report is likely unrelated to this permission issue. It's probably a missing favicon or static asset. Check the browser console's Network tab to see which resource is returning 404. Common causes:
- Missing `favicon.ico`
- Missing font file
- Missing image referenced in CSS

To investigate, look at the full error message in the browser console to identify the missing resource.

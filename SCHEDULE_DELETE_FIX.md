# Course Scheduling Delete Bug Fix

## Problem
When deleting schedule entries in the Course Scheduling page:
- The first delete works correctly
- Subsequent deletes fail silently (no error, but entry doesn't get deleted)

## Root Cause
The issue was in the `WeeklyScheduleGrid.jsx` component. The delete button's onClick handler wasn't properly preventing event propagation:

```javascript
// BEFORE (problematic)
<button type="button" onClick={() => onDeleteBlock(sched)}>
  <Trash2 size={9} />
</button>
```

When clicking the delete button:
1. First delete works
2. The grid re-renders after the entry is removed
3. On subsequent deletes, click events were bubbling up to parent containers
4. This caused interference with the deletion logic, making it appear to fail

## Solution

### 1. Fixed Event Propagation in `WeeklyScheduleGrid.jsx`
Added proper event handling to prevent propagation and default behavior:

```javascript
// AFTER (fixed)
<button 
  type="button" 
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteBlock(sched);
  }}
>
  <Trash2 size={9} />
</button>
```

Applied the same fix to both Edit and Delete buttons for consistency.

### 2. Enhanced Error Handling in `CourseScheduling.jsx`
Added validation and logging to catch issues early:

```javascript
const handleDeleteEntry = async (block) => {
  if (!canPlot || !selectedPlotId) {
    console.warn('Delete blocked:', { canPlot, selectedPlotId });
    return;
  }
  if (!block?.id) {
    setError('Invalid schedule block - missing ID.');
    return;
  }
  if (!window.confirm('Remove this schedule block?')) return;
  
  console.log('Deleting entry:', { plotId: selectedPlotId, entryId: block.id });
  
  try {
    await deletePlotEntry(selectedPlotId, block.id);
    console.log('Delete successful');
    setError(''); // Clear any previous errors
  } catch (err) {
    console.error('Delete failed:', err);
    setError(err.message || 'Failed to delete block.');
  }
};
```

### 3. Improved Service Layer in `plotScheduleService.js`
Added validation and better error messages:

```javascript
export async function deletePlotEntry(plotId, entryId) {
  if (!plotId) throw new Error('Plot ID is required for deletion.');
  if (!entryId) throw new Error('Entry ID is required for deletion.');
  
  console.log('deletePlotEntry called:', { plotId, entryId });
  
  try {
    const entryRef = doc(entriesRef(plotId), entryId);
    await deleteDoc(entryRef);
    console.log('deletePlotEntry successful');
  } catch (error) {
    console.error('deletePlotEntry error:', error);
    throw new Error(`Failed to delete schedule entry: ${error.message}`);
  }
}
```

## Testing
After applying these fixes:
1. Open Course Scheduling
2. Create multiple schedule entries
3. Delete the first entry ✓
4. Delete a second entry ✓
5. Delete additional entries ✓
6. All deletes should now work consistently

## Debugging
If issues persist, check the browser console for:
- "Delete blocked:" warnings (indicates permission or state issues)
- "Deleting entry:" logs (shows the operation is starting)
- "Delete successful" logs (confirms Firestore deletion)
- Any error messages from Firestore

## Related Files Modified
1. `src/components/scheduling/WeeklyScheduleGrid.jsx` - Fixed event propagation
2. `src/pages/CourseScheduling.jsx` - Enhanced error handling
3. `src/services/plotScheduleService.js` - Improved validation

## Prevention
This type of issue can be prevented by:
- Always using `e.stopPropagation()` and `e.preventDefault()` for buttons inside interactive containers
- Adding comprehensive logging for user actions
- Validating inputs at service boundaries
- Testing consecutive operations (not just single operations)

# Modal System Usage Guide

This guide explains how to use the new confirmation and notification modal system in the SWU-IFSS project.

## Overview

The modal system provides:
- **Confirmation Modals** - Ask users to confirm actions (Yes/No)
- **Notification Modals** - Show success/error/warning feedback
- **Auto-close** - Notifications can auto-dismiss after a delay
- **Promise-based** - Easy async/await syntax

## Files Created

```
src/
├── components/
│   └── modals/
│       ├── ConfirmModal.jsx          # Confirmation dialog component
│       ├── NotificationModal.jsx     # Success/error notification component
│       └── ModalProvider.jsx         # Helper wrapper component
├── hooks/
│   └── useModal.js                   # Hook for managing modals
└── index.css                         # Added animation styles
```

## Quick Start

### 1. Import the hook and modal renderer

```jsx
import { useModal } from '../hooks/useModal';
import { ModalRenderer } from '../components/modals/ModalProvider';
```

### 2. Initialize in your component

```jsx
function MyComponent() {
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();
  
  // ... your component logic
  
  return (
    <>
      {/* Your component JSX */}
      
      {/* Add this at the end, before closing tag */}
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </>
  );
}
```

### 3. Use in your functions

```jsx
const handleDelete = async () => {
  // Show confirmation first
  const confirmed = await showConfirm({
    title: 'Delete user?',
    message: 'This action cannot be undone.',
    variant: 'danger', // 'danger' for red, 'primary' for maroon
  });
  
  if (!confirmed) return; // User clicked "Cancel"
  
  // Perform the delete
  try {
    await deleteUser(userId);
    
    // Show success notification
    showNotification({
      type: 'success',
      title: 'Deleted!',
      message: 'User has been deleted successfully.',
    });
  } catch (error) {
    // Show error notification
    showNotification({
      type: 'error',
      title: 'Delete failed',
      message: error.message || 'Failed to delete user.',
    });
  }
};
```

## API Reference

### useModal Hook

Returns an object with:

```typescript
{
  showConfirm: (options) => Promise<boolean>,
  showNotification: (options) => void,
  executeWithConfirmation: (options) => Promise<boolean>,
  isProcessing: boolean,
  confirmState: { ... },
  notificationState: { ... }
}
```

### showConfirm Options

```typescript
{
  title: string,          // Default: "Confirm action"
  message: string,        // Default: "Are you sure you want to proceed?"
  confirmText: string,    // Default: "Confirm"
  cancelText: string,     // Default: "Cancel"
  variant: 'primary' | 'danger'  // Default: 'primary'
}
```

**Variants:**
- `'primary'` - Maroon button (default)
- `'danger'` - Red button (for destructive actions)

### showNotification Options

```typescript
{
  type: 'success' | 'error' | 'warning' | 'info',  // Default: 'success'
  title: string,          // Notification title
  message: string,        // Notification message
  autoCloseMs: number     // Default: 3000 (3 seconds), set to 0 for no auto-close
}
```

**Types:**
- `'success'` - Green icon, for successful operations
- `'error'` - Red icon, for failures
- `'warning'` - Amber icon, for warnings
- `'info'` - Blue icon, for information

## Usage Examples

### Example 1: Delete with Confirmation

```jsx
const handleDeleteBuilding = async (buildingId, buildingName) => {
  const confirmed = await showConfirm({
    title: 'Delete building?',
    message: `Delete "${buildingName}" and all its floors and rooms? This cannot be undone.`,
    confirmText: 'Delete building',
    cancelText: 'Keep it',
    variant: 'danger',
  });

  if (!confirmed) return;

  try {
    await deleteBuilding(buildingId);
    showNotification({
      type: 'success',
      title: 'Building deleted',
      message: `"${buildingName}" has been removed.`,
    });
  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Delete failed',
      message: error.message,
      autoCloseMs: 0, // Don't auto-close errors
    });
  }
};
```

### Example 2: Save with Confirmation

```jsx
const handleSaveChanges = async (formData) => {
  const confirmed = await showConfirm({
    title: 'Save changes?',
    message: 'Update the room information?',
    confirmText: 'Save',
    variant: 'primary',
  });

  if (!confirmed) return;

  try {
    await updateRoom(formData);
    showNotification({
      type: 'success',
      title: 'Saved',
      message: 'Room information updated successfully.',
    });
  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Save failed',
      message: error.message,
    });
  }
};
```

### Example 3: Warning Before Action

```jsx
const handleApprove = async (reservationId) => {
  const confirmed = await showConfirm({
    title: 'Approve reservation?',
    message: 'Once approved, the room will be reserved for the specified time.',
    confirmText: 'Approve',
    variant: 'primary',
  });

  if (!confirmed) return;

  try {
    await approveReservation(reservationId);
    showNotification({
      type: 'success',
      title: 'Approved',
      message: 'Reservation has been approved.',
      autoCloseMs: 2000, // Close after 2 seconds
    });
  } catch (error) {
    showNotification({
      type: 'error',
      title: 'Approval failed',
      message: error.message,
    });
  }
};
```

### Example 4: Info/Warning Notifications

```jsx
const handleCheckAvailability = async (roomId, date) => {
  const available = await checkRoomAvailability(roomId, date);
  
  if (available) {
    showNotification({
      type: 'success',
      title: 'Room available',
      message: 'This room is available for the selected date.',
    });
  } else {
    showNotification({
      type: 'warning',
      title: 'Room occupied',
      message: 'This room is already booked for the selected date.',
      autoCloseMs: 5000, // Show longer for warnings
    });
  }
};
```

### Example 5: Using executeWithConfirmation Helper

For simpler cases, use the helper method:

```jsx
const handleDelete = async () => {
  const success = await executeWithConfirmation({
    confirmTitle: 'Delete user?',
    confirmMessage: 'This action cannot be undone.',
    confirmVariant: 'danger',
    action: async () => {
      await deleteUser(userId);
    },
    successTitle: 'User deleted',
    successMessage: 'User has been removed from the system.',
    errorTitle: 'Delete failed',
    errorMessage: 'Unable to delete user. Please try again.',
  });

  if (success) {
    // Additional actions after successful deletion
    navigate('/users');
  }
};
```

## Integration Checklist

To add modals to an existing page:

1. ✅ Import the hook and renderer:
   ```jsx
   import { useModal } from '../hooks/useModal';
   import { ModalRenderer } from '../components/modals/ModalProvider';
   ```

2. ✅ Initialize the hook in your component:
   ```jsx
   const { showConfirm, showNotification, confirmState, notificationState } = useModal();
   ```

3. ✅ Replace `window.confirm()` and `window.alert()` with modal equivalents

4. ✅ Add confirmation before destructive actions (delete, deactivate, etc.)

5. ✅ Add success/error notifications after async operations

6. ✅ Add the ModalRenderer at the end of your component's return:
   ```jsx
   <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
   ```

## Styling

The modals automatically match your project's design system:
- Uses maroon (#7A0808) for primary actions
- Uses red (#DC2626) for dangerous actions
- Matches the font family (Plus Jakarta Sans)
- Follows existing border radius and spacing patterns
- Includes fade-in animation

## Testing

To test the modals:

1. **Confirmation Modal:**
   - Click a delete or edit button
   - Verify the modal appears with correct title/message
   - Click "Cancel" - action should not execute
   - Click "Confirm" - action should execute

2. **Notification Modal:**
   - Perform an action
   - Verify success/error notification appears
   - Verify it auto-closes after the specified time
   - Verify clicking "Close" or the X button closes it immediately

3. **Edge Cases:**
   - Clicking outside the modal should close it
   - Multiple rapid actions should queue properly
   - Errors should display the correct error message

## Best Practices

1. **Use descriptive titles and messages**
   ```jsx
   // ✅ Good
   showConfirm({
     title: 'Delete 5 students?',
     message: 'This will permanently remove 5 students from the system.',
   });
   
   // ❌ Bad
   showConfirm({
     title: 'Delete?',
     message: 'Are you sure?',
   });
   ```

2. **Use appropriate variants**
   - Use `variant: 'danger'` for destructive actions (delete, deactivate)
   - Use `variant: 'primary'` for regular confirmations (save, approve)

3. **Provide helpful error messages**
   ```jsx
   showNotification({
     type: 'error',
     title: 'Save failed',
     message: error.message || 'An unexpected error occurred. Please try again.',
   });
   ```

4. **Consider auto-close timing**
   - Success: 3 seconds (default)
   - Error: 0 (no auto-close) or 5+ seconds
   - Warning: 4-5 seconds
   - Info: 3 seconds

## Migration Guide

Replace old patterns with new modals:

### Before (window.confirm)
```jsx
if (window.confirm('Delete user?')) {
  await deleteUser();
  alert('User deleted!');
}
```

### After (modals)
```jsx
const confirmed = await showConfirm({
  title: 'Delete user?',
  message: 'This action cannot be undone.',
  variant: 'danger',
});

if (!confirmed) return;

try {
  await deleteUser();
  showNotification({
    type: 'success',
    title: 'User deleted',
    message: 'User has been removed successfully.',
  });
} catch (error) {
  showNotification({
    type: 'error',
    title: 'Delete failed',
    message: error.message,
  });
}
```

## Example: SystemAdministration.jsx

See `src/pages/SystemAdministration.jsx` for a complete working example with:
- ✅ Delete confirmation with danger variant
- ✅ Save confirmation with primary variant  
- ✅ Success notifications
- ✅ Error notifications
- ✅ Warning notifications

## Troubleshooting

**Modal doesn't appear:**
- Make sure you added `<ModalRenderer ... />` to your component's return
- Check that you're calling `showConfirm` or `showNotification` correctly

**Modal appears but doesn't close:**
- Verify `onClose` handlers are passed correctly
- Check browser console for errors

**Styling looks wrong:**
- Ensure `src/index.css` includes the animation styles
- Check that Tailwind classes are compiling correctly

## Support

For issues or questions:
1. Check this guide first
2. Review the example in `SystemAdministration.jsx`
3. Check the component source code in `src/components/modals/`

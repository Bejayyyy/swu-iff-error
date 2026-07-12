# Modal System - Quick Reference Card

## 🚀 Setup (One-time per component)

```jsx
import { useModal } from '../hooks/useModal';
import { ModalRenderer } from '../components/modals/ModalProvider';

function MyPage() {
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();
  
  return (
    <>
      {/* Your content */}
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </>
  );
}
```

---

## ✅ Confirmation Modals (Yes/No)

### Delete Confirmation (Red/Danger)
```jsx
const confirmed = await showConfirm({
  title: 'Delete item?',
  message: 'This cannot be undone.',
  variant: 'danger'
});

if (!confirmed) return;
// Proceed with delete
```

### Save Confirmation (Maroon/Primary)
```jsx
const confirmed = await showConfirm({
  title: 'Save changes?',
  message: 'Update the information?',
  variant: 'primary'
});

if (!confirmed) return;
// Proceed with save
```

---

## 📢 Notification Modals (Feedback)

### Success (Green, auto-close 3s)
```jsx
showNotification({
  type: 'success',
  title: 'Saved!',
  message: 'Changes saved successfully.'
});
```

### Error (Red, stays open)
```jsx
showNotification({
  type: 'error',
  title: 'Failed',
  message: error.message,
  autoCloseMs: 0
});
```

### Warning (Amber, auto-close 5s)
```jsx
showNotification({
  type: 'warning',
  title: 'Warning',
  message: 'Please review before proceeding.'
});
```

### Info (Blue, auto-close 3s)
```jsx
showNotification({
  type: 'info',
  title: 'Tip',
  message: 'Did you know...'
});
```

---

## 🔄 Complete Delete Pattern

```jsx
const handleDelete = async (id, name) => {
  // 1. Confirm
  const confirmed = await showConfirm({
    title: `Delete "${name}"?`,
    message: 'This action cannot be undone.',
    variant: 'danger'
  });
  
  if (!confirmed) return;
  
  // 2. Execute
  try {
    await deleteItem(id);
    
    // 3. Success feedback
    showNotification({
      type: 'success',
      title: 'Deleted',
      message: `"${name}" has been deleted.`
    });
  } catch (error) {
    // 4. Error feedback
    showNotification({
      type: 'error',
      title: 'Delete failed',
      message: error.message,
      autoCloseMs: 0
    });
  }
};
```

---

## 🔄 Complete Save Pattern

```jsx
const handleSave = async (data) => {
  // 1. Confirm
  const confirmed = await showConfirm({
    title: 'Save changes?',
    message: 'Update the information?',
    variant: 'primary'
  });
  
  if (!confirmed) return;
  
  // 2. Execute
  try {
    await updateItem(data);
    
    // 3. Success feedback
    showNotification({
      type: 'success',
      title: 'Saved',
      message: 'Changes saved successfully.'
    });
    
    closeModal(); // Close edit modal
  } catch (error) {
    // 4. Error feedback
    showNotification({
      type: 'error',
      title: 'Save failed',
      message: error.message
    });
  }
};
```

---

## 🎨 Available Options

### showConfirm
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | "Confirm action" | Modal title |
| `message` | string | "Are you sure..." | Confirmation message |
| `confirmText` | string | "Confirm" | Confirm button text |
| `cancelText` | string | "Cancel" | Cancel button text |
| `variant` | 'primary' \| 'danger' | 'primary' | Button color |

### showNotification
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | 'success' \| 'error' \| 'warning' \| 'info' | 'success' | Notification type |
| `title` | string | - | Notification title |
| `message` | string | - | Notification message |
| `autoCloseMs` | number | 3000 | Auto-close delay (0 = never) |

---

## 💡 Tips

1. **Use `variant: 'danger'` for:**
   - Delete operations
   - Deactivate actions
   - Remove/revoke actions
   - Anything destructive

2. **Use `variant: 'primary'` for:**
   - Save operations
   - Edit actions
   - Approve/confirm actions
   - Non-destructive actions

3. **Auto-close timing:**
   - Success: 3 seconds (default)
   - Error: 0 (never) or 5+ seconds
   - Warning: 4-5 seconds
   - Info: 3 seconds

4. **Error handling:**
   - Always show error notifications
   - Include error message: `error.message`
   - Don't auto-close errors

---

## 📖 More Info

- **Complete guide:** MODAL_USAGE_GUIDE.md
- **Examples:** src/pages/SystemAdministration.jsx
- **Demo:** src/components/ModalDemo.jsx

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing confirmation and notification modals
 * 
 * Usage:
 * const { showConfirm, showNotification, ConfirmDialog, NotificationDialog } = useModal();
 * 
 * // Show confirmation before action
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Delete user?',
 *     message: 'This action cannot be undone.',
 *     variant: 'danger'
 *   });
 *   if (confirmed) {
 *     // Perform delete
 *     showNotification({ type: 'success', title: 'Deleted!', message: 'User deleted successfully.' });
 *   }
 * };
 * 
 * // Render modals in component
 * return (
 *   <>
 *     {content}
 *     <ConfirmDialog />
 *     <NotificationDialog />
 *   </>
 * );
 */
export function useModal() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'primary',
    onResolve: null,
  });

  const [notificationState, setNotificationState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    autoCloseMs: 3000,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Show confirmation modal and return a promise that resolves to boolean
   */
  const showConfirm = useCallback(
    ({
      title = 'Confirm action',
      message = 'Are you sure you want to proceed?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'primary',
    }) => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          variant,
          onResolve: resolve,
        });
      });
    },
    []
  );

  /**
   * Show notification modal
   */
  const showNotification = useCallback(
    ({ type = 'success', title = '', message = '', autoCloseMs = 3000 }) => {
      setNotificationState({
        isOpen: true,
        type,
        title,
        message,
        autoCloseMs,
      });
    },
    []
  );

  /**
   * Execute an action with confirmation and show result notification
   */
  const executeWithConfirmation = useCallback(
    async ({
      confirmTitle,
      confirmMessage,
      confirmVariant = 'primary',
      action,
      successTitle = 'Success',
      successMessage = 'Action completed successfully.',
      errorTitle = 'Error',
      errorMessage = 'Action failed. Please try again.',
    }) => {
      const confirmed = await showConfirm({
        title: confirmTitle,
        message: confirmMessage,
        variant: confirmVariant,
      });

      if (!confirmed) return false;

      setIsProcessing(true);
      try {
        await action();
        showNotification({
          type: 'success',
          title: successTitle,
          message: successMessage,
        });
        return true;
      } catch (error) {
        showNotification({
          type: 'error',
          title: errorTitle,
          message: error.message || errorMessage,
        });
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [showConfirm, showNotification]
  );

  const handleConfirm = useCallback(() => {
    if (confirmState.onResolve) {
      confirmState.onResolve(true);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, [confirmState.onResolve]);

  const handleCancel = useCallback(() => {
    if (confirmState.onResolve) {
      confirmState.onResolve(false);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, [confirmState.onResolve]);

  const handleNotificationClose = useCallback(() => {
    setNotificationState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    showConfirm,
    showNotification,
    executeWithConfirmation,
    isProcessing,
    confirmState: {
      ...confirmState,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      isProcessing,
    },
    notificationState: {
      ...notificationState,
      onClose: handleNotificationClose,
    },
  };
}

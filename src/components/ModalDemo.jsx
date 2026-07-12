import React from 'react';
import { Trash2, Save, AlertTriangle, Info } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import { ModalRenderer } from './modals/ModalProvider';

/**
 * Demo component showing all modal features
 * Use this as a reference for implementing modals in your pages
 */
export default function ModalDemo() {
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();

  // Example 1: Delete with confirmation
  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Delete item?',
      message: 'This action cannot be undone. All associated data will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) {
      showNotification({
        type: 'info',
        title: 'Cancelled',
        message: 'Delete action was cancelled.',
        autoCloseMs: 2000,
      });
      return;
    }

    // Simulate delete operation
    setTimeout(() => {
      showNotification({
        type: 'success',
        title: 'Item deleted',
        message: 'The item has been deleted successfully.',
      });
    }, 500);
  };

  // Example 2: Save with confirmation
  const handleSave = async () => {
    const confirmed = await showConfirm({
      title: 'Save changes?',
      message: 'Do you want to save the changes you made?',
      confirmText: 'Save',
      cancelText: 'Discard',
      variant: 'primary',
    });

    if (!confirmed) return;

    // Simulate save operation
    setTimeout(() => {
      showNotification({
        type: 'success',
        title: 'Saved',
        message: 'Your changes have been saved successfully.',
        autoCloseMs: 2000,
      });
    }, 500);
  };

  // Example 3: Success notification
  const showSuccess = () => {
    showNotification({
      type: 'success',
      title: 'Operation successful',
      message: 'The operation completed successfully.',
    });
  };

  // Example 4: Error notification
  const showError = () => {
    showNotification({
      type: 'error',
      title: 'Operation failed',
      message: 'An error occurred while processing your request. Please try again.',
      autoCloseMs: 0, // Don't auto-close errors
    });
  };

  // Example 5: Warning notification
  const showWarning = () => {
    showNotification({
      type: 'warning',
      title: 'Warning',
      message: 'This action may have unintended consequences. Please review before proceeding.',
      autoCloseMs: 5000,
    });
  };

  // Example 6: Info notification
  const showInfo = () => {
    showNotification({
      type: 'info',
      title: 'Information',
      message: 'This is an informational message to help you understand the system better.',
    });
  };

  // Example 7: Simulated async operation with error handling
  const handleAsyncOperation = async () => {
    const confirmed = await showConfirm({
      title: 'Process data?',
      message: 'This will process all pending data. Continue?',
      variant: 'primary',
    });

    if (!confirmed) return;

    // Simulate async operation that might fail
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Simulate random success/failure (50/50)
      if (Math.random() > 0.5) {
        showNotification({
          type: 'success',
          title: 'Processing complete',
          message: 'All data has been processed successfully.',
        });
      } else {
        throw new Error('Network connection lost');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Processing failed',
        message: error.message || 'Failed to process data.',
        autoCloseMs: 0,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">
      <h2 className="font-black text-2xl mb-2" style={{ color: '#7A0808' }}>
        Modal System Demo
      </h2>
      <p className="text-sm font-medium mb-6" style={{ color: '#2B3235', opacity: 0.7 }}>
        Click the buttons below to see different modal examples
      </p>

      <div className="space-y-6">
        {/* Confirmation Modals */}
        <div>
          <h3 className="font-bold text-base mb-3" style={{ color: '#2B3235' }}>
            Confirmation Modals
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-maroon gap-2"
              onClick={handleDelete}
            >
              <Trash2 size={16} />
              Delete (Danger)
            </button>
            <button
              type="button"
              className="btn-maroon gap-2"
              onClick={handleSave}
            >
              <Save size={16} />
              Save (Primary)
            </button>
            <button
              type="button"
              className="btn-maroon gap-2"
              onClick={handleAsyncOperation}
            >
              <AlertTriangle size={16} />
              Async Operation
            </button>
          </div>
        </div>

        {/* Notification Modals */}
        <div>
          <h3 className="font-bold text-base mb-3" style={{ color: '#2B3235' }}>
            Notification Types
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
              onClick={showSuccess}
            >
              Success
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
              onClick={showError}
            >
              Error
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors"
              onClick={showWarning}
            >
              Warning
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
              onClick={showInfo}
            >
              Info
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
            💡 <strong>Tip:</strong> Check the MODAL_USAGE_GUIDE.md file in the project root for complete documentation and code examples.
          </p>
        </div>
      </div>

      {/* Modal Renderer - Required at the end */}
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </div>
  );
}

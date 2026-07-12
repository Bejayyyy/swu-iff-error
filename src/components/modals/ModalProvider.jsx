import React from 'react';
import { useModal } from '../../hooks/useModal';
import ConfirmModal from './ConfirmModal';
import NotificationModal from './NotificationModal';

/**
 * Modal provider component that handles both confirmation and notification modals
 * Wrap this around components that need modal functionality
 */
export function ModalProvider({ children }) {
  const { confirmState, notificationState } = useModal();

  return (
    <>
      {children}
      {confirmState.isOpen && <ConfirmModal {...confirmState} />}
      {notificationState.isOpen && <NotificationModal {...notificationState} />}
    </>
  );
}

/**
 * Render function for modals - use with useModal hook
 */
export function ModalRenderer({ confirmState, notificationState }) {
  return (
    <>
      {confirmState.isOpen && <ConfirmModal {...confirmState} />}
      {notificationState.isOpen && <NotificationModal {...notificationState} />}
    </>
  );
}

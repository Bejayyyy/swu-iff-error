import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { RESERVATION_STATUS, isReservationActionable } from '../../constants/approvalWorkflow';
import { useModal } from '../../hooks/useModal';
import { ModalRenderer } from '../modals/ModalProvider';

export default function ReservationApprovalActions({
  reservation,
  profile,
  onApprove,
  onReject,
}) {
  const [remarks, setRemarks] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();

  const canAct = isReservationActionable(reservation, profile?.role, profile);
  const isTerminal = [RESERVATION_STATUS.APPROVED, RESERVATION_STATUS.REJECTED].includes(reservation?.status);

  if (isTerminal || !canAct) return null;

  const handleApprove = async () => {
    const confirmed = await showConfirm({
      title: 'Approve reservation?',
      message: 'This will approve the room reservation request and move it to the next approval step.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
      variant: 'primary',
    });

    if (!confirmed) return;

    setBusy(true);
    setError('');
    try {
      await onApprove({ remarks });
      showNotification({
        type: 'success',
        title: 'Reservation approved',
        message: 'The reservation has been approved successfully.',
        autoCloseMs: 2000,
      });
      setRemarks('');
    } catch (err) {
      const errorMessage = err.message || 'Unable to approve request.';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Approval failed',
        message: errorMessage,
        autoCloseMs: 0,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!showReject) {
      setShowReject(true);
      return;
    }
    if (!remarks.trim()) {
      setError('Provide a reason for rejection.');
      showNotification({
        type: 'warning',
        title: 'Reason required',
        message: 'Please provide a reason for rejecting this request.',
        autoCloseMs: 3000,
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Reject reservation?',
      message: 'This will reject the room reservation request. The requestor will be notified.',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    setBusy(true);
    setError('');
    try {
      await onReject({ remarks });
      showNotification({
        type: 'success',
        title: 'Reservation rejected',
        message: 'The reservation has been rejected.',
        autoCloseMs: 2000,
      });
      setRemarks('');
      setShowReject(false);
    } catch (err) {
      const errorMessage = err.message || 'Unable to reject request.';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Rejection failed',
        message: errorMessage,
        autoCloseMs: 0,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
        <h3 className="font-bold text-sm" style={{ color: '#2B3235' }}>Approval Actions</h3>
        <textarea
          className="form-input resize-none"
          rows={3}
          placeholder={showReject ? 'Reason for rejection (required)' : 'Remarks (optional)'}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        {error && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy}
          className="btn-maroon w-full justify-center py-2.5 rounded-xl text-sm"
        >
          <CheckCircle size={16} /> {busy ? 'Processing...' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
          style={{ borderColor: '#991B1B', color: '#991B1B' }}
        >
          <XCircle size={16} /> {showReject ? (busy ? 'Processing...' : 'Confirm Reject') : 'Reject'}
        </button>
      </div>
      
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </>
  );
}

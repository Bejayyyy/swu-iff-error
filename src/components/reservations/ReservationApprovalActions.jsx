import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { RESERVATION_STATUS, isReservationActionable } from '../../constants/approvalWorkflow';

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

  const canAct = isReservationActionable(reservation, profile?.role, profile);
  const isTerminal = [RESERVATION_STATUS.APPROVED, RESERVATION_STATUS.REJECTED].includes(reservation?.status);

  if (isTerminal || !canAct) return null;

  const handleApprove = async () => {
    setBusy(true);
    setError('');
    try {
      await onApprove({ remarks });
      setRemarks('');
    } catch (err) {
      setError(err.message || 'Unable to approve request.');
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
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onReject({ remarks });
      setRemarks('');
      setShowReject(false);
    } catch (err) {
      setError(err.message || 'Unable to reject request.');
    } finally {
      setBusy(false);
    }
  };

  return (
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
        <CheckCircle size={16} /> Approve
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
        style={{ borderColor: '#991B1B', color: '#991B1B' }}
      >
        <XCircle size={16} /> {showReject ? 'Confirm Reject' : 'Reject'}
      </button>
    </div>
  );
}

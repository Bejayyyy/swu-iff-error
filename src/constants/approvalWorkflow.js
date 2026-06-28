export const APPROVAL_TYPES = {
  ACADEMIC: 'academic',
  NON_ACADEMIC: 'non-academic',
};

export const RESERVATION_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const APPROVAL_RECORD_STATUS = {
  WAITING: 'Waiting',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SKIPPED: 'Skipped',
  CANCELLED: 'Cancelled',
};

export function getActivePendingRecord(approvalRecords = []) {
  return approvalRecords.find((r) => r.status === APPROVAL_RECORD_STATUS.PENDING) || null;
}

export function isReservationActionable(reservation, role, profile) {
  if (!reservation || !role) return false;
  if ([RESERVATION_STATUS.APPROVED, RESERVATION_STATUS.REJECTED, RESERVATION_STATUS.DRAFT].includes(reservation.status)) {
    return false;
  }
  const pending = getActivePendingRecord(reservation.approvalRecords);
  return pending?.roleId === role;
}

export function filterReservationsForRole(reservations, role, profile) {
  if (!role || !profile) return [];

  return reservations.filter((reservation) => {
    if (reservation.createdByUid === profile.uid) return true;

    const pending = getActivePendingRecord(reservation.approvalRecords);
    if (pending?.roleId === role) return true;

    const participated = (reservation.approvalRecords || []).some(
      (record) => record.roleId === role && record.status === APPROVAL_RECORD_STATUS.APPROVED,
    );
    if (participated && role !== 'registrar') return false;

    return false;
  });
}

export function buildApprovalFlowLabel(approvalRecords = []) {
  return approvalRecords.map((r) => r.roleLabel || r.roleId).join(' → ');
}

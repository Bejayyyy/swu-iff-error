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
    // Users always see their own reservations (for tracking status)
    if (reservation.createdByUid === profile.uid) return true;

    // Get the current pending approval record
    const pending = getActivePendingRecord(reservation.approvalRecords);
    
    // Only show reservations where this role is the current pending approver
    // This applies to ALL roles including registrar - no special treatment
    if (!pending || pending.roleId !== role) return false;
    
    // For deans, additionally filter by college
    if (role === 'dean') {
      // Match by college
      if (profile.college && reservation.college) {
        const normalizedProfileCollege = (profile.college || '').trim().toLowerCase();
        const normalizedReservationCollege = (reservation.college || '').trim().toLowerCase();
        return normalizedProfileCollege === normalizedReservationCollege;
      }
      // If no college specified, show all (backward compatibility)
      return true;
    }
    
    // For all other roles (including registrar), if we reach here and pending matches their role, show it
    return true;
  });
}

export function buildApprovalFlowLabel(approvalRecords = []) {
  return approvalRecords.map((r) => r.roleLabel || r.roleId).join(' → ');
}

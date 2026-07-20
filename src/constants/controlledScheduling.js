/**
 * Constants for Controlled Course Scheduling System
 * Where registrar manages the workflow: base creator → sequential adoption
 */

export const SCHEDULE_SESSION_STATUS = {
  DRAFT: 'draft',
  BASE_CREATION: 'base_creation',
  ADOPTION_PHASE: 'adoption_phase',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const BASE_SCHEDULE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  READY: 'ready_for_review',
  APPROVED: 'approved',
};

export const PARTICIPANT_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
};

export function getSessionStatusLabel(status) {
  switch (status) {
    case SCHEDULE_SESSION_STATUS.DRAFT:
      return 'Draft';
    case SCHEDULE_SESSION_STATUS.BASE_CREATION:
      return 'Base Template Creation';
    case SCHEDULE_SESSION_STATUS.ADOPTION_PHASE:
      return 'Adoption Phase';
    case SCHEDULE_SESSION_STATUS.COMPLETED:
      return 'Completed';
    case SCHEDULE_SESSION_STATUS.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

export function getBaseScheduleStatusLabel(status) {
  switch (status) {
    case BASE_SCHEDULE_STATUS.PENDING:
      return 'Not Started';
    case BASE_SCHEDULE_STATUS.IN_PROGRESS:
      return 'In Progress';
    case BASE_SCHEDULE_STATUS.READY:
      return 'Ready for Review';
    case BASE_SCHEDULE_STATUS.APPROVED:
      return 'Approved';
    default:
      return status;
  }
}

export function getParticipantStatusLabel(status) {
  switch (status) {
    case PARTICIPANT_STATUS.WAITING:
      return 'Waiting';
    case PARTICIPANT_STATUS.ACTIVE:
      return 'Active - Can Edit';
    case PARTICIPANT_STATUS.COMPLETED:
      return 'Completed';
    case PARTICIPANT_STATUS.SKIPPED:
      return 'Skipped';
    default:
      return status;
  }
}

export function getStatusColor(status, type = 'session') {
  if (type === 'participant') {
    switch (status) {
      case PARTICIPANT_STATUS.ACTIVE:
        return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
      case PARTICIPANT_STATUS.COMPLETED:
        return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' };
      case PARTICIPANT_STATUS.WAITING:
        return { bg: '#E5E7EB', border: '#D1D5DB', text: '#374151' };
      case PARTICIPANT_STATUS.SKIPPED:
        return { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' };
    }
  }

  if (type === 'base') {
    switch (status) {
      case BASE_SCHEDULE_STATUS.APPROVED:
        return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' };
      case BASE_SCHEDULE_STATUS.READY:
        return { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' };
      case BASE_SCHEDULE_STATUS.IN_PROGRESS:
        return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
      default:
        return { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' };
    }
  }

  // Session status
  switch (status) {
    case SCHEDULE_SESSION_STATUS.COMPLETED:
      return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' };
    case SCHEDULE_SESSION_STATUS.ADOPTION_PHASE:
      return { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' };
    case SCHEDULE_SESSION_STATUS.BASE_CREATION:
      return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
    default:
      return { bg: '#F3F4F6', border: '#E5E7EB', text: '#6B7280' };
  }
}

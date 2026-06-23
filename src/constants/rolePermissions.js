import { ROLES } from '../firebase/constants';

/** Permission keys used across routes, nav, and page actions */
export const PERMISSIONS = {
  ROOM_AVAILABILITY_VIEW: 'room.availability.view',
  ROOM_SCHEDULES_VIEW: 'room.schedules.view',
  ACADEMIC_CALENDAR_VIEW: 'academic.calendar.view',
  SCHEDULING_SUBMIT: 'scheduling.submit',
  RESERVATION_SUBMIT: 'reservation.submit',
  APPROVAL_ENDORSE_ACTIVITY: 'approval.endorse.activity',
  ROOMS_MANAGE_ASSIGNED: 'rooms.manage.assigned',
  ROOMS_MAINTENANCE_MANAGE: 'rooms.maintenance.manage',
  APPROVAL_MANAGE_ROOM_ACTIVITY: 'approval.manage.room.activity',
  APPROVAL_MANAGE_STUDENT_ACTIVITY: 'approval.manage.student.activity',
  BUILDINGS_MANAGE: 'buildings.manage',
  REPORTS_VIEW: 'reports.view',
  SYSTEM_ADMIN: 'system.admin',
  SCHEDULING_MANAGE: 'scheduling.manage',
  CALENDAR_MANAGE: 'calendar.manage',
};

const GENERAL_PERMISSIONS = [
  PERMISSIONS.ROOM_AVAILABILITY_VIEW,
  PERMISSIONS.ROOM_SCHEDULES_VIEW,
  PERMISSIONS.ACADEMIC_CALENDAR_VIEW,
];

const ROLE_PERMISSIONS = {
  [ROLES.REGISTRAR]: Object.values(PERMISSIONS),
  [ROLES.DEAN]: [
    ...GENERAL_PERMISSIONS,
    PERMISSIONS.SCHEDULING_SUBMIT,
    PERMISSIONS.RESERVATION_SUBMIT,
    PERMISSIONS.APPROVAL_ENDORSE_ACTIVITY,
    PERMISSIONS.ROOMS_MANAGE_ASSIGNED,
    PERMISSIONS.SCHEDULING_MANAGE,
  ],
  [ROLES.GSD]: [
    ...GENERAL_PERMISSIONS,
    PERMISSIONS.ROOMS_MAINTENANCE_MANAGE,
    PERMISSIONS.APPROVAL_MANAGE_ROOM_ACTIVITY,
  ],
  [ROLES.STUDENT_LIFE]: [
    ...GENERAL_PERMISSIONS,
    PERMISSIONS.APPROVAL_MANAGE_STUDENT_ACTIVITY,
    PERMISSIONS.RESERVATION_SUBMIT,
  ],
  [ROLES.TEACHER]: [
    ...GENERAL_PERMISSIONS,
    PERMISSIONS.RESERVATION_SUBMIT,
  ],
  [ROLES.ORGANIZATION_HEAD]: [
    ...GENERAL_PERMISSIONS,
    PERMISSIONS.RESERVATION_SUBMIT,
  ],
};

/** Route → required permission (registrar bypasses via full access) */
export const ROUTE_PERMISSIONS = {
  '/dashboard': null,
  '/approvals': null,
  '/course-scheduling': PERMISSIONS.SCHEDULING_SUBMIT,
  '/room-availability': PERMISSIONS.ROOM_AVAILABILITY_VIEW,
  '/room-finder': PERMISSIONS.ROOM_AVAILABILITY_VIEW,
  '/schedule-history': PERMISSIONS.ROOM_SCHEDULES_VIEW,
  '/building-management': PERMISSIONS.ROOM_AVAILABILITY_VIEW,
  '/academic-calendar': PERMISSIONS.ACADEMIC_CALENDAR_VIEW,
  '/reports': PERMISSIONS.REPORTS_VIEW,
  '/system-administration': PERMISSIONS.SYSTEM_ADMIN,
};

export const NAV_ITEMS = {
  dashboard: { label: 'Dashboard', path: '/dashboard', permission: null },
  approvals: { label: 'Request Management', path: '/approvals', permission: null },
  courseScheduling: { label: 'Course Scheduling', path: '/course-scheduling', permission: PERMISSIONS.SCHEDULING_SUBMIT },
  roomAvailability: { label: 'Room Availability', path: '/room-availability', permission: PERMISSIONS.ROOM_AVAILABILITY_VIEW },
  roomFinder: { label: 'Room Finder', path: '/room-finder', permission: PERMISSIONS.ROOM_AVAILABILITY_VIEW },
  scheduleHistory: { label: 'Schedule History', path: '/schedule-history', permission: PERMISSIONS.ROOM_SCHEDULES_VIEW },
  buildings: { label: 'Buildings', path: '/building-management', permission: PERMISSIONS.ROOM_AVAILABILITY_VIEW },
  academicCalendar: { label: 'Academic Calendar', path: '/academic-calendar', permission: PERMISSIONS.ACADEMIC_CALENDAR_VIEW },
  reports: { label: 'Reports & Analytics', path: '/reports', permission: PERMISSIONS.REPORTS_VIEW },
  systemAdmin: { label: 'System Administration', path: '/system-administration', permission: PERMISSIONS.SYSTEM_ADMIN },
};

const ROLE_NAV_KEYS = {
  [ROLES.REGISTRAR]: [
    'dashboard', 'approvals', 'courseScheduling', 'roomAvailability', 'roomFinder',
    'scheduleHistory', 'buildings', 'academicCalendar', 'reports', 'systemAdmin',
  ],
  [ROLES.DEAN]: [
    'dashboard', 'approvals', 'courseScheduling', 'roomAvailability',
    'scheduleHistory', 'buildings', 'academicCalendar',
  ],
  [ROLES.GSD]: [
    'dashboard', 'approvals', 'roomAvailability', 'scheduleHistory', 'buildings', 'academicCalendar',
  ],
  [ROLES.STUDENT_LIFE]: [
    'dashboard', 'approvals', 'roomAvailability', 'scheduleHistory', 'academicCalendar',
  ],
  [ROLES.TEACHER]: [
    'dashboard', 'approvals', 'roomAvailability', 'scheduleHistory', 'academicCalendar',
  ],
  [ROLES.ORGANIZATION_HEAD]: [
    'dashboard', 'approvals', 'roomAvailability', 'scheduleHistory', 'academicCalendar',
  ],
};

const ROLE_LABELS = {
  [ROLES.DEAN]: 'Dean',
  [ROLES.GSD]: 'GSD',
  [ROLES.STUDENT_LIFE]: 'Student Life',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.ORGANIZATION_HEAD]: 'Organization Head',
  [ROLES.REGISTRAR]: 'Registrar',
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  if (role === ROLES.REGISTRAR) return true;
  return getPermissionsForRole(role).includes(permission);
}

export function canAccessRoute(role, pathname) {
  if (!role) return false;
  if (role === ROLES.REGISTRAR) return true;

  const basePath = pathname.split('/').slice(0, 2).join('/') || pathname;
  const normalized = basePath.startsWith('/building') || basePath.startsWith('/room')
    ? '/building-management'
    : basePath.startsWith('/request') || basePath.startsWith('/academic-request')
      ? '/approvals'
      : pathname;

  const required = ROUTE_PERMISSIONS[normalized];
  if (required === undefined) return true;
  if (required === null) return getPermissionsForRole(role).length > 0;
  return hasPermission(role, required);
}

export function getNavItemsForRole(role) {
  const keys = ROLE_NAV_KEYS[role] || ROLE_NAV_KEYS[ROLES.TEACHER];
  return keys.map((key) => NAV_ITEMS[key]).filter(Boolean);
}

export function canSubmitReservation(role) {
  return hasPermission(role, PERMISSIONS.RESERVATION_SUBMIT);
}

export function canSubmitCourseSchedule(role) {
  return hasPermission(role, PERMISSIONS.SCHEDULING_SUBMIT);
}

export function canEndorseActivity(role) {
  return hasPermission(role, PERMISSIONS.APPROVAL_ENDORSE_ACTIVITY);
}

export function canManageRoomActivityApproval(role) {
  return hasPermission(role, PERMISSIONS.APPROVAL_MANAGE_ROOM_ACTIVITY);
}

export function canManageStudentActivityApproval(role) {
  return hasPermission(role, PERMISSIONS.APPROVAL_MANAGE_STUDENT_ACTIVITY);
}

export function canManageRoomMaintenance(role) {
  return hasPermission(role, PERMISSIONS.ROOMS_MAINTENANCE_MANAGE);
}

export function canManageAssignedRooms(role) {
  return hasPermission(role, PERMISSIONS.ROOMS_MANAGE_ASSIGNED);
}

export function canManageBuildings(role) {
  return hasPermission(role, PERMISSIONS.BUILDINGS_MANAGE);
}

export function canManageCalendar(role) {
  return hasPermission(role, PERMISSIONS.CALENDAR_MANAGE);
}

export function canManageAllRooms(role) {
  return role === ROLES.REGISTRAR;
}

/** Dean/GSD scoped room access via profile.assignedRoomIds / assignedBuildingIds */
export function canEditRoom(profile, room) {
  if (!profile || !room) return false;
  if (canManageAllRooms(profile.role)) return true;
  if (canManageRoomMaintenance(profile.role)) return true;
  if (canManageAssignedRooms(profile.role)) {
    const roomId = room.docId || room.id || room.roomCode;
    const assignedRooms = profile.assignedRoomIds || [];
    const assignedBuildings = profile.assignedBuildingIds || [];
    if (assignedRooms.length === 0 && assignedBuildings.length === 0) return true;
    return assignedRooms.includes(roomId) || assignedBuildings.includes(String(room.buildingId));
  }
  return false;
}

export function getApprovalsNavLabel(role) {
  if (role === ROLES.TEACHER || role === ROLES.ORGANIZATION_HEAD) return 'Room Reservations';
  if (role === ROLES.GSD) return 'Room Activity Requests';
  if (role === ROLES.STUDENT_LIFE) return 'Activity Requests';
  if (role === ROLES.DEAN) return 'Endorsement & Requests';
  return 'Request Management';
}

export function filterRequestsForRole(requests, role, profile) {
  if (role === ROLES.REGISTRAR) return requests;
  if (role === ROLES.DEAN) {
    return requests.filter(
      (r) => r.type === 'academic' || r.type === 'non-academic',
    );
  }
  if (role === ROLES.GSD) {
    return requests.filter((r) => r.type === 'non-academic' || r.gsdApplicable !== false);
  }
  if (role === ROLES.STUDENT_LIFE) {
    return requests.filter(
      (r) => r.type === 'non-academic' && (r.category === 'student-activity' || r.reqType?.toLowerCase?.().includes('activity')),
    );
  }
  if (role === ROLES.TEACHER || role === ROLES.ORGANIZATION_HEAD) {
    const email = (profile?.email || '').toLowerCase();
    return requests.filter((r) => (r.requestorEmail || r.requestor || '').toLowerCase().includes(email.split('@')[0]));
  }
  return requests;
}

export function canCreateRequestType(role, requestType) {
  if (role === ROLES.REGISTRAR) return true;
  if (requestType === 'academic') {
    return canSubmitCourseSchedule(role) || canEndorseActivity(role);
  }
  return canSubmitReservation(role);
}

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  canAccessRoute,
  canCreateRequestType,
  canEditRoom,
  canEndorseActivity,
  canManageAllRooms,
  canManageAssignedRooms,
  canManageBuildings,
  canManageCalendar,
  canManageApprovalWorkflow,
  canManageRoomActivityApproval,
  canManageRoomMaintenance,
  canManageStudentActivityApproval,
  canSubmitCourseSchedule,
  canSubmitReservation,
  filterRequestsForRole,
  getApprovalsNavLabel,
  getNavItemsForRole,
  getPermissionsForRole,
  getRoleLabel,
  hasPermission,
} from '../constants/rolePermissions';

export function useRolePermissions() {
  const { profile } = useAuth();
  const role = profile?.role;

  return useMemo(
    () => ({
      role,
      roleLabel: getRoleLabel(role),
      permissions: getPermissionsForRole(role),
      navItems: getNavItemsForRole(role),
      approvalsNavLabel: getApprovalsNavLabel(role),
      hasPermission: (permission) => hasPermission(role, permission),
      canAccessRoute: (pathname) => canAccessRoute(role, pathname),
      canSubmitReservation: () => canSubmitReservation(role),
      canSubmitCourseSchedule: () => canSubmitCourseSchedule(role),
      canEndorseActivity: () => canEndorseActivity(role),
      canManageRoomActivityApproval: () => canManageRoomActivityApproval(role),
      canManageStudentActivityApproval: () => canManageStudentActivityApproval(role),
      canManageRoomMaintenance: () => canManageRoomMaintenance(role),
      canManageAssignedRooms: () => canManageAssignedRooms(role),
      canManageBuildings: () => canManageBuildings(role),
      canManageCalendar: () => canManageCalendar(role),
      canManageApprovalWorkflow: () => canManageApprovalWorkflow(role),
      canManageAllRooms: () => canManageAllRooms(role),
      canEditRoom: (room) => canEditRoom(profile, room),
      canCreateRequestType: (type) => canCreateRequestType(role, type),
      filterRequests: (requests) => filterRequestsForRole(requests, role, profile),
      isRegistrar: role === 'registrar',
      isDean: role === 'dean',
      isGsd: role === 'gsd',
    }),
    [profile, role],
  );
}

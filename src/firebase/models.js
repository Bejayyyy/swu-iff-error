/**
 * Example Firestore document shapes for RBAC.
 *
 * users/{uid}
 * {
 *   email: string,
 *   displayName: string,
 *   role: 'developer' | 'registrar' | 'dean' | 'teacher' | 'student',
 *   status: 'active' | 'inactive',
 *   permissions: string[],
 *   department: string,
 *   phone: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   createdBy: string | null,
 *   lastLoginAt: Timestamp | null
 * }
 *
 * permissions/{permissionId}
 * {
 *   key: string,
 *   label: string,
 *   module: string,
 *   description: string
 * }
 *
 * registrar_management/{uid}
 * {
 *   uid: string,
 *   email: string,
 *   displayName: string,
 *   department: string,
 *   status: 'active' | 'inactive',
 *   permissions: string[],
 *   notes: string,
 *   managedBy: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

export const exampleUserDocument = {
  email: 'registrar.office@phinmaed.com',
  displayName: 'Registrar Office',
  role: 'registrar',
  status: 'active',
  permissions: ['system.users', 'scheduling.manage'],
  department: 'Registrar',
  phone: '',
  createdBy: 'developer-uid',
};

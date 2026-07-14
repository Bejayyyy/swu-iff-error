import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { INSTITUTIONAL_EMAIL_DOMAIN } from '../../firebase/constants';
import { COLLEGE_OPTIONS, requiresCollege, requiresDepartment } from '../../constants/colleges';
import PermissionCheckboxGrid from '../admin/PermissionCheckboxGrid';
import { getRoleDefinition } from '../../constants/rolePermissions';

export default function AddUserModal({ onClose, onSave, roleOptions = [], roleDefinitions = {} }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    college: '', // Added college field
    role: roleOptions[0]?.value || 'dean',
    useCustomAccess: false,
    permissions: [],
    navKeys: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (form.useCustomAccess) return;
    const def = getRoleDefinition(form.role, roleDefinitions);
    setForm((f) => ({
      ...f,
      permissions: def.permissions || [],
      navKeys: def.navKeys || [],
    }));
  }, [form.role, form.useCustomAccess, roleDefinitions]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const showCollegeField = useMemo(() => requiresCollege(form.role), [form.role]);
  const showDepartmentField = useMemo(() => requiresDepartment(form.role), [form.role]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) return;
    if (!form.email.toLowerCase().endsWith(`@${INSTITUTIONAL_EMAIL_DOMAIN}`)) {
      setError(`Use school email ending in @${INSTITUTIONAL_EMAIL_DOMAIN}.`);
      return;
    }
    if (showCollegeField && !form.college) {
      setError('College is required for this role.');
      return;
    }
    try {
      await onSave({
        ...form,
        permissions: form.useCustomAccess ? form.permissions : [],
        navKeys: form.useCustomAccess ? form.navKeys : [],
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add user.');
    }
  };

  const roles = useMemo(
    () => (roleOptions.length ? roleOptions : [{ value: 'dean', label: 'Dean' }]),
    [roleOptions],
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 z-10">
          <X size={20} />
        </button>
        <form onSubmit={submit} className="p-8 pt-10">
          <h2 className="font-black text-lg mb-1" style={{ color: '#2B3235' }}>Add user</h2>
          <p className="text-xs font-medium mb-6" style={{ color: '#2B3235', opacity: 0.65 }}>
            Create a new user account with role-based access
          </p>
          {error && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full name</label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder={`name@${INSTITUTIONAL_EMAIL_DOMAIN}`} value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {showDepartmentField && (
                <div>
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Information Technology" />
                </div>
              )}
              <div className={showDepartmentField ? '' : 'col-span-2'}>
                <label className="form-label">User role</label>
                <select 
                  className="form-input" 
                  value={form.role} 
                  onChange={(e) => {
                    const newRole = e.target.value;
                    set('role', newRole);
                    // Clear department and college if switching to GSD or Student Life
                    if (!requiresDepartment(newRole)) {
                      set('department', '');
                    }
                    if (!requiresCollege(newRole)) {
                      set('college', '');
                    }
                  }}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {showCollegeField && (
              <div>
                <label className="form-label">
                  College <span className="text-red-600">*</span>
                </label>
                <select className="form-input" value={form.college} onChange={(e) => set('college', e.target.value)} required>
                  <option value="">Select College</option>
                  {COLLEGE_OPTIONS.map((college) => (
                    <option key={college.value} value={college.value}>{college.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This determines which dean will approve this user's reservations
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: '#2B3235' }}>
              <input
                type="checkbox"
                checked={form.useCustomAccess}
                onChange={(e) => set('useCustomAccess', e.target.checked)}
              />
              Customize access for this user (override role defaults)
            </label>

            <div className={form.useCustomAccess ? '' : 'opacity-50 pointer-events-none'}>
              <label className="form-label">Access & navigation</label>
              <PermissionCheckboxGrid
                permissions={form.permissions}
                navKeys={form.navKeys}
                onChange={({ permissions, navKeys }) => setForm((f) => ({ ...f, permissions, navKeys }))}
                disabled={!form.useCustomAccess}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-8">
            <button type="button" className="btn-outline-maroon flex-1 justify-center py-2.5" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-maroon flex-1 justify-center py-2.5">
              Save user
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

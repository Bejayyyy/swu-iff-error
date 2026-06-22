import React, { useState } from 'react';
import { X } from 'lucide-react';
import { INSTITUTIONAL_EMAIL_DOMAIN } from '../../firebase/constants';
import { STAFF_ROLE_OPTIONS } from '../../services/systemUserService';

export default function AddUserModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', department: '', role: STAFF_ROLE_OPTIONS[0].value });
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) return;
    if (!form.email.toLowerCase().endsWith(`@${INSTITUTIONAL_EMAIL_DOMAIN}`)) {
      setError(`Use school email ending in @${INSTITUTIONAL_EMAIL_DOMAIN}.`);
      return;
    }
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add user.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 z-10">
          <X size={20} />
        </button>
        <form onSubmit={submit} className="p-8 pt-10">
          <h2 className="font-black text-lg mb-1" style={{ color: '#2B3235' }}>Add user</h2>
          <p className="text-xs font-medium mb-6" style={{ color: '#2B3235', opacity: 0.65 }}>
            Name, email, department/college, and role
          </p>
          {error && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="form-label">Full name</label>
              <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder={`name@${INSTITUTIONAL_EMAIL_DOMAIN}`} value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Department / college</label>
              <input className="form-input" value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="form-label">User role</label>
              <select className="form-input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                {STAFF_ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
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

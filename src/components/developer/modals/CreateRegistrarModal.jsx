import React, { useState } from 'react';
import { X } from 'lucide-react';
import { INSTITUTIONAL_EMAIL_DOMAIN, REGISTRAR_PERMISSION_CATALOG } from '../../../firebase/constants';
import { validateInstitutionalEmail } from '../../../firebase/authHelpers';

export default function CreateRegistrarModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    department: 'Registrar',
    phone: '',
    notes: '',
    permissions: REGISTRAR_PERMISSION_CATALOG.map((p) => p.id),
  });
  const [error, setError] = useState('');
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const togglePermission = (id) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(id)
        ? f.permissions.filter((p) => p !== id)
        : [...f.permissions, id],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const validation = validateInstitutionalEmail(form.email);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    if (form.password.length < 6) {
      setError('Temporary password must be at least 6 characters.');
      return;
    }
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create registrar account.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 z-10">
          <X size={20} />
        </button>
        <form onSubmit={submit} className="p-8 pt-10">
          <h2 className="font-black text-lg mb-1" style={{ color: '#1e3a5f' }}>Create Registrar account</h2>
          <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
            Only @{INSTITUTIONAL_EMAIL_DOMAIN} emails. Account must be created here before login is allowed.
          </p>
          {error && <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="form-label">Full name</label>
              <input className="form-input" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder={`name@${INSTITUTIONAL_EMAIL_DOMAIN}`} value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Temporary password</label>
                <input type="password" className="form-input" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={(e) => set('department', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input min-h-[72px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Registrar permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-3">
                {REGISTRAR_PERMISSION_CATALOG.map((perm) => (
                  <label key={perm.id} className="flex items-start gap-2 text-xs font-medium cursor-pointer">
                    <input type="checkbox" checked={form.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} className="mt-0.5" />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-8">
            <button type="button" className="btn-outline-maroon flex-1 justify-center py-2.5" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="flex-1 justify-center py-2.5 rounded-[10px] text-white font-semibold text-sm disabled:opacity-60" style={{ background: '#1e3a5f' }} disabled={saving}>
              {saving ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X } from 'lucide-react';

const R = 10;

export default function EditBuildingModal({ building, onClose, onSave }) {
  const [form, setForm] = useState({
    name: building?.name || '',
    manager: building?.manager || '',
    contact: building?.contact || '',
    email: building?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!building) return null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave(building.id, {
        name: form.name.trim() || building.name,
        manager: form.manager.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update building.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md shadow-xl relative m-4 border border-gray-100"
        style={{ borderRadius: R }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-base" style={{ color: '#2B3235' }}>Edit building</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100" style={{ borderRadius: R }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="form-label">Building name</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">
              Building manager <span className="font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              className="form-input"
              placeholder="Leave blank if none"
              value={form.manager}
              onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Contact</label>
            <input
              className="form-input"
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              className="btn-outline-maroon flex-1 justify-center py-2.5"
              style={{ borderRadius: R }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-maroon flex-1 justify-center py-2.5"
              style={{ borderRadius: R }}
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

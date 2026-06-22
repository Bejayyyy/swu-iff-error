import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AddFloorModal({ buildingId, buildingName, onClose }) {
  const { addFloor } = useApp();
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await addFloor(buildingId, label);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add floor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-7 relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>
        <h2 className="text-xl font-black mb-1" style={{ color: '#7A0808' }}>Add Floor</h2>
        <p className="text-xs text-gray-400 mb-6">Add a new floor to {buildingName}</p>
        {error && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="form-label">Floor label</label>
          <input
            className="form-input mb-6"
            placeholder="e.g., Ground Floor, Floor 5"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline-maroon flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-maroon flex-1 justify-center" disabled={loading}>
              {loading ? 'Adding…' : 'Add Floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

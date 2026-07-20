import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AddBuildingModal({ onClose }) {
  const { addBuilding, currentUser } = useApp();
  const [form, setForm] = useState({ name: '', manager: '', floors: ['Floor 1'] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegistrar = currentUser?.role === 'registrar';

  const addFloorRow = () =>
    setForm((f) => ({ ...f, floors: [...f.floors, `Floor ${f.floors.length + 1}`] }));
  const removeFloor = (i) =>
    setForm((f) => ({ ...f, floors: f.floors.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Building name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addBuilding({
        name: form.name,
        manager: form.manager,
        floorNames: form.floors,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create building.');
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
        <h2 className="text-xl font-black mb-1" style={{ color: '#7A0808' }}>Add New Building</h2>
        <p className="text-xs text-gray-400 mb-6">Create a new building and specify its floors. You can add rooms later.</p>

        {error && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Building Name</label>
            <input
              className="form-input"
              placeholder="e.g., Science Building"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          {isRegistrar && (
            <div className="mb-4">
              <label className="form-label">
                Building Manager <span className="font-normal text-gray-400">(Optional)</span>
              </label>
              <input
                className="form-input"
                placeholder="Leave blank if no manager assigned"
                value={form.manager}
                onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
              />
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="form-label mb-0">Floors ({form.floors.length} total)</label>
              <button
                type="button"
                onClick={addFloorRow}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
                style={{ color: '#7A0808', borderColor: '#7A0808' }}
              >
                <Plus size={12} /> Add Floor
              </button>
            </div>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {form.floors.map((fl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="form-input flex-1"
                    value={fl}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        floors: f.floors.map((x, idx) => (idx === i ? e.target.value : x)),
                      }))
                    }
                  />
                  {form.floors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFloor(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline-maroon flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-maroon flex-1 justify-center" disabled={loading}>
              {loading ? 'Creating…' : 'Create Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

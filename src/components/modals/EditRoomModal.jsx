import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const roomTypes = ['Classroom', 'Laboratory', 'Lecture Room', 'Seminar Room', 'Conference Room', 'Gymnasium'];
const equipmentOptions = ['Projector', 'Whiteboard', 'Air Conditioning', 'Audio System', 'Computers', 'Smart Board', 'CCTV'];
const statuses = ['Available', 'Occupied', 'Maintenance'];

export default function EditRoomModal({ room, buildingId, floorId, onClose }) {
  const { updateRoom } = useApp();
  const [form, setForm] = useState({
    name: room?.name || room?.id || '',
    type: room?.type || '',
    capacity: room?.capacity ?? '',
    status: room?.status || 'Available',
    equipment: room?.equipment || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleEquip = (item) => {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter((x) => x !== item)
        : [...f.equipment, item],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.type || form.capacity === '') {
      setError('Name, type, and capacity are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateRoom(buildingId, floorId, room.docId, {
        name: form.name,
        type: form.type,
        status: form.status,
        capacity: form.capacity,
        equipment: form.equipment,
      });
      onClose(true);
    } catch (err) {
      setError(err.message || 'Failed to update room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md p-7 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>
        <h2 className="text-xl font-black mb-1" style={{ color: '#7A0808' }}>Edit Room</h2>
        <p className="text-xs text-gray-400 mb-6">Update room details and facilities</p>
        {error && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Room name / number</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="form-label">Room type</label>
            <select
              className="form-input"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              required
            >
              <option value="">Select type</option>
              {roomTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Capacity</label>
            <input
              type="number"
              className="form-input"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              required
              min={1}
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Equipment / facilities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {equipmentOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquip(item)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={
                    form.equipment.includes(item)
                      ? { background: '#7A0808', color: 'white', borderColor: '#7A0808' }
                      : { background: 'white', color: '#2B3235', borderColor: '#e2e5e8' }
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline-maroon flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-maroon flex-1 justify-center" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

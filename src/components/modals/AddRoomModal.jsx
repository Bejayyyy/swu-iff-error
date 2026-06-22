import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const roomTypes = ['Classroom', 'Laboratory', 'Lecture Room', 'Seminar Room', 'Conference Room', 'Gymnasium'];
const equipmentOptions = ['Projector', 'Whiteboard', 'Air Conditioning', 'Audio System', 'Computers', 'Smart Board', 'CCTV'];
const statuses = ['Available', 'Occupied', 'Maintenance'];

export default function AddRoomModal({ buildingId, floorId, floor, onClose }) {
  const { addRoom } = useApp();
  const [form, setForm] = useState({ name: '', type: '', capacity: '', status: 'Available', equipment: [] });
  const [types, setTypes] = useState(roomTypes);
  const [equipmentChoices, setEquipmentChoices] = useState(equipmentOptions);
  const [newType, setNewType] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleEquip = (e) =>
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(e) ? f.equipment.filter((x) => x !== e) : [...f.equipment, e],
    }));

  const addCustomType = () => {
    const t = newType.trim();
    if (!t) return;
    if (!types.some((x) => x.toLowerCase() === t.toLowerCase())) setTypes((prev) => [...prev, t]);
    setForm((f) => ({ ...f, type: t }));
    setNewType('');
  };

  const addCustomEquipment = () => {
    const item = newEquipment.trim();
    if (!item) return;
    if (!equipmentChoices.some((x) => x.toLowerCase() === item.toLowerCase())) {
      setEquipmentChoices((prev) => [...prev, item]);
    }
    setForm((f) => ({
      ...f,
      equipment: f.equipment.some((x) => x.toLowerCase() === item.toLowerCase())
        ? f.equipment
        : [...f.equipment, item],
    }));
    setNewEquipment('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.capacity) {
      setError('Room name, type, and capacity are required.');
      return;
    }
    if (!floorId) {
      setError('Floor not found. Refresh and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addRoom(buildingId, floorId, floor, { ...form, capacity: Number(form.capacity) });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add room.');
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
        <h2 className="text-xl font-black mb-1" style={{ color: '#7A0808' }}>Add New Room</h2>
        <p className="text-xs text-gray-400 mb-6">Add a room to Floor {floor}</p>

        {error && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Room Name / Number</label>
            <input
              className="form-input"
              placeholder="e.g., ENG-301"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="form-label">Room Type</label>
            <select
              className="form-input"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              required
            >
              <option value="">Select room type</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-2">
              <input
                className="form-input"
                placeholder="Custom type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <button type="button" className="btn-outline-maroon" onClick={addCustomType}>
                Add Type
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">Capacity</label>
            <input
              className="form-input"
              type="number"
              placeholder="e.g., 40"
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
            <label className="form-label">Equipment / Facilities</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {equipmentChoices.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEquip(e)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={
                    form.equipment.includes(e)
                      ? { background: '#7A0808', color: 'white', borderColor: '#7A0808' }
                      : { background: 'white', color: '#2B3235', borderColor: '#e2e5e8' }
                  }
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-7">
            <button type="button" onClick={onClose} className="btn-outline-maroon flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-maroon flex-1 justify-center" disabled={loading}>
              {loading ? 'Adding…' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

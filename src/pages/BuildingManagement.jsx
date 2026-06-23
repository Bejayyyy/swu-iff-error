import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { useRolePermissions } from '../hooks/useRolePermissions';
import AddBuildingModal from '../components/modals/AddBuildingModal';
import AddFloorModal from '../components/modals/AddFloorModal';

const statusBadge = { Available: 'badge-available', Occupied: 'badge-occupied', Maintenance: 'badge-maintenance' };

export default function BuildingManagement() {
  const navigate = useNavigate();
  const { buildingList, buildingsLoading, buildingsError } = useApp();
  const { canManageBuildings, canManageRoomMaintenance, canManageAssignedRooms, roleLabel } = useRolePermissions();
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);

  useEffect(() => {
    if (!buildingList.length) {
      setSelectedBuilding(null);
      return;
    }
    const stillExists = selectedBuilding && buildingList.some((b) => b.id === selectedBuilding.id);
    if (!stillExists) setSelectedBuilding(buildingList[0]);
  }, [buildingList, selectedBuilding]);

  const building = selectedBuilding;
  const allRooms =
    building?.floorData?.flatMap((f) => f.rooms.map((r) => ({ ...r, floor: f.floor, floorLabel: f.label }))) || [];

  return (
    <Layout
      title={canManageBuildings() ? 'Building & Room Management' : 'Buildings & Rooms'}
      subtitle={canManageRoomMaintenance() ? `${roleLabel} — manage room maintenance and view schedules` : canManageAssignedRooms() ? `${roleLabel} — manage assigned classrooms` : 'View buildings and room information'}
    >
      <div className="flex justify-end gap-2 mb-5 flex-wrap">
        {canManageBuildings() && building && (
          <button type="button" className="btn-outline-maroon" onClick={() => setShowAddFloor(true)}>
            <Plus size={16} /> Add Floor
          </button>
        )}
        {canManageBuildings() && <button type="button" className="btn-maroon" onClick={() => setShowAddBuilding(true)}>
          <Plus size={16} /> Add Building
        </button>}
      </div>

      {buildingsError && (
        <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {buildingsError}
        </p>
      )}

      {buildingsLoading && buildingList.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">Loading buildings…</p>
      ) : buildingList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500 mb-4">No buildings yet. Add your first building to get started.</p>
          {canManageBuildings() && <button type="button" className="btn-maroon" onClick={() => setShowAddBuilding(true)}>
            <Plus size={16} /> Add Building
          </button>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {buildingList.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBuilding(b)}
                className="px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all flex-shrink-0"
                style={
                  selectedBuilding?.id === b.id
                    ? { borderColor: '#7A0808', color: '#7A0808' }
                    : { borderColor: 'transparent', color: '#2B3235' }
                }
              >
                {b.name}
              </button>
            ))}
          </div>

          {building && (
            <div className="p-6">
              <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={18} style={{ color: '#7A0808' }} />
                    <h2 className="font-black text-lg text-dark">{building.name}</h2>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Floors: {building.floors}</span>
                    <span>Rooms: {building.totalRooms ?? allRooms.length}</span>
                  </div>
                </div>
                {building.manager ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center font-black text-xs text-dark">
                      {building.manager.charAt(0)}
                    </div>
                    <span className="font-semibold">{building.manager}</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-gray-400 italic">No manager assigned</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Building Manager</p>
                  <p className="text-sm font-bold text-dark mt-0.5">{building.manager || '—'}</p>
                  <p className="text-xs text-gray-400">{building.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Contact</p>
                  <p className="text-sm font-bold text-dark mt-0.5">{building.contact || '—'}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Room', 'Floor', 'Capacity', 'Facilities', 'Manage by', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left text-[10px] font-black uppercase tracking-wider text-gray-400 py-3 pr-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                          No rooms yet. Open building details to add rooms per floor.
                        </td>
                      </tr>
                    ) : (
                      allRooms.map((room) => {
                        const floorObj = building.floorData.find((f) => f.floor === room.floor);
                        return (
                          <tr key={room.docId || `${room.id}-${room.floor}`} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 pr-4 text-sm font-bold text-dark">{room.id}</td>
                            <td className="py-3 pr-4 text-sm text-gray-600">{room.floorLabel || room.floor}</td>
                            <td className="py-3 pr-4 text-sm text-gray-600">{room.capacity}</td>
                            <td className="py-3 pr-4">
                              <div className="text-xs text-gray-600">
                                {room.equipment?.slice(0, 2).map((e, i) => (
                                  <div key={i}>{e}</div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-xs text-gray-600">
                              {building.manager ? building.manager.split(' ').slice(0, 3).join(' ') : '—'}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={statusBadge[room.status] || 'badge-available'}>{room.status}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/room/${room.id}`, {
                                      state: {
                                        room,
                                        buildingId: building.id,
                                        buildingName: building.name,
                                        floor: room.floor,
                                        floorId: floorObj?.floorId,
                                      },
                                    })
                                  }
                                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  style={{ color: '#7A0808' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/building/${building.id}`)}
                className="w-full mt-5 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: '#7A0808', color: 'white' }}
              >
                Manage floors & rooms
              </button>
            </div>
          )}
        </div>
      )}

      {canManageBuildings() && showAddBuilding && <AddBuildingModal onClose={() => setShowAddBuilding(false)} />}
      {canManageBuildings() && showAddFloor && building && (
        <AddFloorModal
          buildingId={building.id}
          buildingName={building.name}
          onClose={() => setShowAddFloor(false)}
        />
      )}
    </Layout>
  );
}

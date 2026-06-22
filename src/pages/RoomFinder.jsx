import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users, Layers, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { CategoryFilterTabs, StatusFilterRow } from '../components/FilterControls';

const TYPE_BADGE = {
  'Lecture Room': 'bg-blue-100 text-blue-800',
  Classroom: 'bg-amber-100 text-amber-900',
  Laboratory: 'bg-purple-100 text-purple-900',
  'Seminar Room': 'bg-teal-100 text-teal-900',
  'Conference Room': 'bg-slate-200 text-slate-800',
};

export default function RoomFinder() {
  const navigate = useNavigate();
  const { buildingList } = useApp();
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('academic');
  const [statusFilter, setStatusFilter] = useState('All');
  const [buildingId, setBuildingId] = useState('all');
  const [roomType, setRoomType] = useState('all');
  const [capMin, setCapMin] = useState(0);
  const [chk, setChk] = useState({ Available: true, Occupied: true, Maintenance: true });

  const allRooms = useMemo(() => {
    const out = [];
    buildingList.forEach((b) => {
      b.floorData.forEach((f) => {
        f.rooms.forEach((r) => {
          out.push({ ...r, buildingName: b.name, buildingId: b.id, floor: f.floor });
        });
      });
    });
    return out;
  }, [buildingList]);

  const types = useMemo(() => ['all', ...new Set(allRooms.map((r) => r.type))], [allRooms]);

  const filtered = useMemo(() => {
    return allRooms.filter((r) => {
      const hay = `${r.id} ${r.name} ${r.type} ${r.buildingName}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (buildingId !== 'all' && String(r.buildingId) !== buildingId) return false;
      if (roomType !== 'all' && r.type !== roomType) return false;
      if ((r.capacity || 0) < capMin) return false;
      if (!chk[r.status]) return false;
      if (statusFilter === 'Available' && r.status !== 'Available') return false;
      if (statusFilter === 'Occupied' && r.status !== 'Occupied') return false;
      if (statusFilter === 'Maintenance' && r.status !== 'Maintenance') return false;
      return true;
    });
  }, [allRooms, q, buildingId, roomType, capMin, chk, statusFilter]);

  const academicSlots = allRooms.filter((_, i) => i % 2 === 0).length;
  const nonAcademicSlots = allRooms.length - academicSlots;

  return (
    <Layout title="Room Finder" subtitle="Search for available rooms">
      <div className="bg-white shadow-md border border-gray-100 p-5 mb-5" style={{ borderRadius: 10 }}>
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="form-input pl-10"
              placeholder="Search by room ID, name, building, or type..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button type="button" className="btn-maroon whitespace-nowrap" style={{ borderRadius: 10 }} onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-col gap-3 mb-4 w-fit max-w-full">
              <CategoryFilterTabs
                value={category}
                onChange={setCategory}
                academicCount={academicSlots}
                nonAcademicCount={nonAcademicSlots}
              />
              <StatusFilterRow
                value={statusFilter}
                onChange={setStatusFilter}
                options={['All', 'Available', 'Occupied', 'Maintenance']}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Building</label>
              <select className="form-input" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
                <option value="all">All Buildings</option>
                {buildingList.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Room Type</label>
              <select className="form-input" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                {types.map((t) => (
                  <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Minimum capacity: {capMin}</label>
              <input
                type="range"
                min={0}
                max={200}
                value={capMin}
                onChange={(e) => setCapMin(Number(e.target.value))}
                className="w-full accent-[#800000]"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4">
              {['Available', 'Occupied', 'Maintenance'].map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: '#2B3235' }}>
                  <input
                    type="checkbox"
                    checked={chk[s]}
                    onChange={() => setChk((c) => ({ ...c, [s]: !c[s] }))}
                    className="rounded border-gray-300 accent-[#800000]"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          </div>
        )}
      </div>

      <p className="text-sm font-bold mb-3" style={{ color: '#2B3235' }}>
        {filtered.length} room{filtered.length !== 1 ? 's' : ''} found
        {category === 'academic' ? ' · Academic use view' : ' · Non-academic use view'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((room) => (
            <div key={`${room.buildingId}-${room.id}`} className="bg-white shadow-md border border-gray-100 p-5 flex flex-col min-h-[280px]" style={{ borderRadius: 10 }}>
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-black text-lg" style={{ color: '#2B3235' }}>{room.id}</h3>
              <span className={room.status === 'Available' ? 'badge-available' : room.status === 'Occupied' ? 'badge-occupied' : 'badge-maintenance'}>
                {room.status}
              </span>
            </div>
            <p className="text-xs font-medium mb-4" style={{ color: '#2B3235', opacity: 0.65 }}>
              Rooms and availability summary
            </p>
            <div className="grid grid-cols-2 gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: '#FFFBFB', borderRadius: 10 }}>
                  <Building2 size={16} style={{ color: '#800000' }} />
                </div>
                <span className="text-xs font-bold leading-tight" style={{ color: '#2B3235' }}>{room.buildingName}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: '#FFFBFB', borderRadius: 10 }}>
                  <Users size={16} style={{ color: '#800000' }} />
                </div>
                <span className="text-xs font-bold" style={{ color: '#2B3235' }}>{room.capacity} Capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: '#FFFBFB', borderRadius: 10 }}>
                  <Layers size={16} style={{ color: '#800000' }} />
                </div>
                <span className="text-xs font-bold" style={{ color: '#2B3235' }}>Floor {room.floor}</span>
              </div>
              <div className="flex items-end justify-end">
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${TYPE_BADGE[room.type] || 'bg-gray-100 text-gray-800'}`}>
                  {room.type}
                </span>
              </div>
            </div>
              <button
                type="button"
                className="btn-maroon w-full justify-center mt-4 py-2.5 text-sm gap-2"
                style={{ borderRadius: 10 }}
              onClick={() =>
                navigate(`/room/${room.id}`, {
                  state: { room, buildingId: room.buildingId, buildingName: room.buildingName, floor: room.floor },
                })
              }
            >
              <Calendar size={16} /> View Schedule
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}

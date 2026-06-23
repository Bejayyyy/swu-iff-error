import React, { useMemo, useState } from 'react';
import { getInitialWeekStart } from '../utils/academicCalendarUtils';
import { addDays } from '../constants/scheduleGrid';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, MapPin, Clock, Users, Wrench, Edit2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { useRolePermissions } from '../hooks/useRolePermissions';
import EditRoomModal from '../components/modals/EditRoomModal';
import WeeklyScheduleGrid from '../components/scheduling/WeeklyScheduleGrid';

const sampleSchedules = [
  { id: 's1', day: 0, title: 'Advanced M...', course: 'MATH 301', instructor: 'Dr. Smith', start: 8, end: 9.5, type: 'CAS' },
  { id: 's2', day: 1, title: 'Physics Lab', course: 'PHYS 201L', instructor: 'Prof. J', start: 9.5, end: 12, type: 'Laboratory' },
];

export default function RoomDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();
  const { buildingList } = useApp();

  const { canEditRoom, canSubmitCourseSchedule, isRegistrar } = useRolePermissions();
  const [scheduleTab, setScheduleTab] = useState('regular');
  const [semesterTab, setSemesterTab] = useState('1');
  const [weekStartDate, setWeekStartDate] = useState(() => getInitialWeekStart(null));
  const [showEditRoom, setShowEditRoom] = useState(false);

  let room = state?.room;
  let buildingId = state?.buildingId;
  let buildingName = state?.buildingName || '';
  let floor = state?.floor || 1;
  let floorId = state?.floorId;

  if (!room) {
    for (const b of buildingList) {
      for (const f of b.floorData) {
        const found = f.rooms.find((r) => r.id === id || r.roomCode === id);
        if (found) {
          room = found;
          buildingId = b.id;
          buildingName = b.name;
          floor = f.floor;
          floorId = f.floorId;
          break;
        }
      }
      if (room) break;
    }
  }

  const liveRoom = useMemo(() => {
    if (!buildingId || !floorId) return room;
    const building = buildingList.find((b) => String(b.id) === String(buildingId));
    const floorEntry = building?.floorData?.find((f) => f.floorId === floorId);
    const docId = room?.docId;
    if (docId && floorEntry) {
      return floorEntry.rooms.find((r) => r.docId === docId) || room;
    }
    return floorEntry?.rooms?.find((r) => r.id === id) || room;
  }, [buildingList, buildingId, floorId, room, id]);

  const displayRoom = liveRoom || room;

  if (!displayRoom) {
    return (
      <Layout title="Room Details">
        <div className="text-center py-20 text-gray-400">Room not found.</div>
      </Layout>
    );
  }

  const statusBadge =
    displayRoom.status === 'Available'
      ? 'badge-available'
      : displayRoom.status === 'Occupied'
        ? 'badge-occupied'
        : 'badge-maintenance';
  return (
    <Layout title={displayRoom.name || displayRoom.id} subtitle={`${buildingName} · Floor ${floor}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold" style={{ color: '#2B3235' }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Back
        </button>
        <div className="flex gap-2 flex-wrap">
          {buildingId && floorId && displayRoom?.docId && canEditRoom({ ...displayRoom, buildingId }) && (
            <button type="button" className="btn-outline-maroon flex items-center gap-2" onClick={() => setShowEditRoom(true)}>
              <Edit2 size={14} /> Edit Room Details
            </button>
          )}
          {(isRegistrar || canSubmitCourseSchedule()) && (
            <button type="button" className="btn-maroon"><Plus size={16} /> Add Schedule</button>
          )}
          <button type="button" className="btn-outline-maroon flex items-center gap-2"><Printer size={14} /> Print Schedule</button>
        </div>
      </div>

      {/* Room info cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Room Type</p>
            <span className="text-xs font-black px-2 py-1 rounded" style={{ background: '#FFF0F0', color: '#7A0808' }}>
              {displayRoom.type || 'Lecture Room'}
            </span>
          </div>
          <div className="stat-icon-box"><MapPin size={18} /></div>
        </div>
        <div className="stat-card">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Status</p>
            <span className={statusBadge}>{displayRoom.status}</span>
          </div>
          <div className="stat-icon-box"><Clock size={18} /></div>
        </div>
        <div className="stat-card">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Capacity</p>
            <p className="text-2xl font-black" style={{ color: '#2B3235' }}>{displayRoom.capacity}</p>
            <p className="text-xs text-gray-400">People</p>
          </div>
          <div className="stat-icon-box"><Users size={18} /></div>
        </div>
        <div className="stat-card">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Equipments</p>
            <p className="text-2xl font-black" style={{ color: '#2B3235' }}>{displayRoom.equipment?.length || 0}</p>
            <p className="text-xs text-gray-400">Items</p>
          </div>
          <div className="stat-icon-box"><Wrench size={18} /></div>
        </div>
      </div>

      {/* Equipment */}
      {displayRoom.equipment?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="font-bold text-sm mb-3" style={{ color: '#2B3235' }}>Available Equipment</h3>
          <div className="flex flex-wrap gap-2">
            {displayRoom.equipment.map((e) => (
              <span key={e} className="text-xs font-semibold px-3 py-1.5 rounded-full border" style={{ borderColor: '#e2e5e8', color: '#2B3235' }}>{e}</span>
            ))}
          </div>
        </div>
      )}

      <WeeklyScheduleGrid
        blocks={sampleSchedules}
        scheduleTab={scheduleTab}
        onScheduleTabChange={setScheduleTab}
        semester={semesterTab}
        onSemesterChange={setSemesterTab}
        schoolYearLabel="SY 2025-2026"
        weekStartDate={weekStartDate}
        onPrevWeek={() => setWeekStartDate((d) => addDays(d, -7))}
        onNextWeek={() => setWeekStartDate((d) => addDays(d, 7))}
      />

      {showEditRoom && buildingId && floorId && displayRoom?.docId && (
        <EditRoomModal
          room={displayRoom}
          buildingId={buildingId}
          floorId={floorId}
          onClose={() => setShowEditRoom(false)}
        />
      )}
    </Layout>
  );
}

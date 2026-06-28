import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Clock, CheckCircle, XCircle, MoreVertical, MapPin, Users, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { useRoomReservationFlow } from '../hooks/useRoomReservationFlow';
import ProgressStatCards from '../components/ProgressStatCards';
import { CategoryFilterTabs, StatusFilterRow } from '../components/FilterControls';
import { buildApprovalFlowLabel } from '../constants/approvalWorkflow';
import { RESERVATION_STATUS } from '../constants/approvalWorkflow';

export default function ApprovalManagement() {
  const navigate = useNavigate();
  const { requests } = useApp();
  const {
    roleLabel,
    canSubmitReservation,
    canCreateRequestType,
    filterRequests,
    canEndorseActivity,
    canManageRoomActivityApproval,
    canManageStudentActivityApproval,
    isRegistrar,
  } = useRolePermissions();

  const showAcademicTab = isRegistrar || canEndorseActivity() || canCreateRequestType('academic');
  const showNonAcademicTab = isRegistrar || canSubmitReservation() || canManageRoomActivityApproval() || canManageStudentActivityApproval();

  const [tab, setTab] = useState(showNonAcademicTab && !showAcademicTab ? 'non-academic' : 'academic');
  const [filter, setFilter] = useState('All');
  const { openReservation, modals } = useRoomReservationFlow();

  const roleRequests = filterRequests(requests);

  const filtered = roleRequests.filter((r) => {
    const typeMatch = tab === 'academic' ? r.type === 'academic' : r.type === 'non-academic';
    const normalizedStatus = r.status === RESERVATION_STATUS.IN_PROGRESS ? 'Pending' : r.status;
    const statusMatch = filter === 'All' || r.status === filter || (filter === 'Pending' && normalizedStatus === 'Pending');
    return typeMatch && statusMatch;
  });

  const academicReqs = roleRequests.filter((r) => r.type === 'academic');
  const nonAcademicReqs = roleRequests.filter((r) => r.type === 'non-academic');

  const canCreateAny = canCreateRequestType('academic') || canCreateRequestType('non-academic');
  const subtitle = isRegistrar
    ? 'Review and approve schedules and room utilization requests'
    : `${roleLabel} — view and manage requests within your role`;

  const counts = {
    total: filtered.length,
    pending: filtered.filter((r) => r.status === 'Pending' || r.status === RESERVATION_STATUS.IN_PROGRESS).length,
    approved: filtered.filter((r) => r.status === 'Approved').length,
    rejected: filtered.filter((r) => r.status === 'Rejected').length,
  };

  const stats = [
    { label: 'Total Request', value: counts.total, icon: ClipboardList, accent: 'total' },
    { label: 'Pending', value: counts.pending, icon: Clock, accent: 'pending' },
    { label: 'Approved', value: counts.approved, icon: CheckCircle, accent: 'approved' },
    { label: 'Rejected', value: counts.rejected, icon: XCircle, accent: 'rejected' },
  ];

  return (
    <Layout title="Approval Management" subtitle={subtitle}>
      {canCreateAny && (
      <div className="flex justify-end mb-5 relative">
        <button className="btn-maroon" onClick={() => openReservation()}>
          <Plus size={16} /> New Reservation
        </button>
      </div>
      )}

      <div className="mb-6">
        <ProgressStatCards items={stats} />
      </div>

      {/* Request History */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-base mb-4" style={{ color: '#2B3235' }}>Request History</h2>

        <div className="flex flex-col gap-3 mb-5 w-fit max-w-full">
          {(showAcademicTab || showNonAcademicTab) && (
            <CategoryFilterTabs
              value={tab}
              onChange={(v) => { setTab(v); setFilter('All'); }}
              academicCount={showAcademicTab ? academicReqs.length : 0}
              nonAcademicCount={showNonAcademicTab ? nonAcademicReqs.length : 0}
              hideAcademic={!showAcademicTab}
              hideNonAcademic={!showNonAcademicTab}
            />
          )}
          <StatusFilterRow value={filter} onChange={setFilter} />
        </div>

        {/* Request Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No requests found.</div>
        ) : (
          filtered.map(req => (
            <div key={req.id} className="request-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={req.priority === 'High' ? 'priority-high' : 'priority-medium'}>
                    {req.priority || 'Medium'} Priority
                  </span>
                  <span className={`badge-${req.status?.toLowerCase()}`}>{req.status}</span>
                </div>
                <button type="button" className="p-1 rounded-lg hover:bg-gray-100" style={{ color: '#2B3235', opacity: 0.4 }}><MoreVertical size={16} /></button>
              </div>

              <h3 className="font-bold text-sm mb-0.5" style={{ color: '#2B3235' }}>{req.title}</h3>
              <p className="text-xs font-medium mb-3" style={{ color: '#2B3235', opacity: 0.65 }}>{req.department}</p>
              <p className="text-xs font-semibold mb-3" style={{ color: '#2B3235', opacity: 0.75 }}>A &nbsp; {req.requestor}</p>
              <p className="text-[11px] font-bold mb-3" style={{ color: '#800000' }}>
                Approval flow: {buildApprovalFlowLabel(req.approvalRecords || req.approvalSteps || []) || 'Not configured'}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#2B3235', opacity: 0.55 }}>Objectives</p>
                  <p className="text-xs line-clamp-2" style={{ color: '#2B3235', opacity: 0.85 }}>{req.objectives || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#2B3235', opacity: 0.55 }}>Venue & Participation</p>
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin size={10} style={{ color: '#2B3235', opacity: 0.45 }} />
                    <span className="text-xs" style={{ color: '#2B3235' }}>{req.venue || req.designatedVenue || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={10} style={{ color: '#2B3235', opacity: 0.45 }} />
                    <span className="text-xs" style={{ color: '#2B3235' }}>{req.participants || req.numStudents || 0} Students</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#2B3235', opacity: 0.55 }}>Date & Schedule</p>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Calendar size={10} style={{ color: '#2B3235', opacity: 0.45 }} />
                    <span className="text-xs" style={{ color: '#2B3235' }}>{req.dateStart || req.dateOfActivity || req.dateField || 'TBD'}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#2B3235', opacity: 0.7 }}>{req.timeStart} - {req.timeEnd}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="btn-maroon text-xs py-1.5 px-4"
                  onClick={() => {
                    if (req.type === 'non-academic') {
                      navigate(`/request/${req.id}`, { state: { request: req } });
                    } else {
                      navigate(`/academic-request/${req.id}`, { state: { request: req } });
                    }
                  }}
                >
                  Review Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modals}
    </Layout>
  );
}

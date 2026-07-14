import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Clock, CheckCircle, XCircle, MoreVertical, MapPin, Users, Calendar, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useRolePermissions } from '../hooks/useRolePermissions';
import { useRoomReservationFlow } from '../hooks/useRoomReservationFlow';
import { useModal } from '../hooks/useModal';
import ProgressStatCards from '../components/ProgressStatCards';
import { CategoryFilterTabs, StatusFilterRow } from '../components/FilterControls';
import { buildApprovalFlowLabel } from '../constants/approvalWorkflow';
import { RESERVATION_STATUS } from '../constants/approvalWorkflow';
import { ModalRenderer } from '../components/modals/ModalProvider';
import LoadingModal from '../components/modals/LoadingModal';
import { deleteRoomReservation } from '../services/reservationService';

export default function ApprovalManagement() {
  const navigate = useNavigate();
  const { requests } = useApp();
  const { profile } = useAuth();
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
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();

  const showAcademicTab = isRegistrar || canEndorseActivity() || canCreateRequestType('academic');
  const showNonAcademicTab = isRegistrar || canSubmitReservation() || canManageRoomActivityApproval() || canManageStudentActivityApproval();

  const [tab, setTab] = useState(showNonAcademicTab && !showAcademicTab ? 'non-academic' : 'academic');
  const [filter, setFilter] = useState('All');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
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

  const handleDeleteReservation = async (reservation) => {
    // Check if user can delete (only own reservations or registrar)
    const canDelete = isRegistrar || reservation.createdByUid === profile?.uid;
    
    if (!canDelete) {
      showNotification({
        type: 'warning',
        title: 'Not authorized',
        message: 'You can only delete your own reservations.',
        autoCloseMs: 3000,
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Delete reservation?',
      message: `Are you sure you want to delete "${reservation.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    setIsLoading(true);
    setLoadingMessage('Deleting reservation...');
    setActionMenuOpen(null);

    try {
      await deleteRoomReservation(reservation.id);
      showNotification({
        type: 'success',
        title: 'Reservation deleted',
        message: 'The reservation has been deleted successfully.',
        autoCloseMs: 2000,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Delete failed',
        message: error.message || 'Failed to delete reservation.',
        autoCloseMs: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          filtered.map(req => {
            const canDelete = isRegistrar || req.createdByUid === profile?.uid;
            
            return (
            <div key={req.id} className="request-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={req.priority === 'High' ? 'priority-high' : 'priority-medium'}>
                    {req.priority || 'Medium'} Priority
                  </span>
                  <span className={`badge-${req.status?.toLowerCase()}`}>{req.status}</span>
                </div>
                
                {/* Action Menu */}
                <div className="relative">
                  <button 
                    type="button" 
                    className="p-1 rounded-lg hover:bg-gray-100" 
                    style={{ color: '#2B3235', opacity: 0.4 }}
                    onClick={() => setActionMenuOpen(actionMenuOpen === req.id ? null : req.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {actionMenuOpen === req.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActionMenuOpen(null)}
                      />
                      <div 
                        className="absolute right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                        style={{ minWidth: '160px' }}
                      >
                        {canDelete && (
                          <button
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm font-semibold hover:bg-red-50 flex items-center gap-2 transition-colors"
                            style={{ color: '#991B1B' }}
                            onClick={() => handleDeleteReservation(req)}
                          >
                            <Trash2 size={14} />
                            Delete Reservation
                          </button>
                        )}
                        {!canDelete && (
                          <div className="px-4 py-2 text-xs text-gray-400">
                            No actions available
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
            );
          })
        )}
      </div>

      {modals}
      <LoadingModal isOpen={isLoading} message={loadingMessage} />
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </Layout>
  );
}

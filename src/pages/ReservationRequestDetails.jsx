import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ApprovalTimeline from '../components/reservations/ApprovalTimeline';
import ReservationApprovalActions from '../components/reservations/ReservationApprovalActions';
import { fetchRoomReservation } from '../services/reservationService';
import { RESERVATION_STATUS } from '../constants/approvalWorkflow';
import { buildApprovalFlowLabel } from '../constants/approvalWorkflow';

export default function ReservationRequestDetails({ defaultType = 'non-academic' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { requests, approveReservation } = useApp();
  const { profile } = useAuth();

  const fromState = state?.request;
  const fromList = requests.find((r) => String(r.id) === String(id));
  const [request, setRequest] = useState(fromState || fromList || null);
  const [loading, setLoading] = useState(!fromState && !fromList);

  useEffect(() => {
    if (fromState || fromList) {
      setRequest(fromState || fromList);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchRoomReservation(id)
      .then((data) => {
        if (!cancelled) {
          setRequest(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, fromState, fromList]);

  if (loading) {
    return (
      <Layout title="Reservation Details">
        <p className="text-sm text-gray-500 py-12 text-center">Loading reservation…</p>
      </Layout>
    );
  }

  if (!request || (defaultType && request.type !== defaultType)) {
    return (
      <Layout title="Reservation Details" subtitle="Request not found">
        <button type="button" className="btn-maroon text-sm" onClick={() => navigate('/approvals')}>
          Back to approvals
        </button>
      </Layout>
    );
  }

  const approvalRecords = request.approvalRecords || request.approvalSteps || [];
  const isAcademic = request.type === 'academic';
  const subtitle = isAcademic ? 'Academic · Room Reservation' : 'Non-Academic · Room Reservation';

  const handleApprove = async ({ remarks }) => {
    await approveReservation(request.id, {
      action: 'approve',
      remarks,
      approverUid: profile.uid,
      approverName: profile.displayName || profile.email,
      approverRole: profile.role,
    });
    navigate('/approvals');
  };

  const handleReject = async ({ remarks }) => {
    await approveReservation(request.id, {
      action: 'reject',
      remarks,
      approverUid: profile.uid,
      approverName: profile.displayName || profile.email,
      approverRole: profile.role,
    });
    navigate('/approvals');
  };

  const statusBadge = {
    [RESERVATION_STATUS.APPROVED]: 'badge-approved',
    [RESERVATION_STATUS.REJECTED]: 'badge-rejected',
    [RESERVATION_STATUS.IN_PROGRESS]: 'badge-pending',
    [RESERVATION_STATUS.PENDING]: 'badge-pending',
    [RESERVATION_STATUS.DRAFT]: 'badge-pending',
  }[request.status] || 'badge-pending';

  return (
    <Layout title="Room Reservation" subtitle={subtitle}>
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold" style={{ color: '#2B3235' }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Back
        </button>
        <button type="button" onClick={() => window.print()} className="btn-outline-maroon text-xs">Print</button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-8">
            <p className="text-lg font-black tracking-widest" style={{ color: '#7A0808' }}>SOUTHWESTERN UNIVERSITY</p>
            <p className="text-sm font-bold tracking-widest" style={{ color: '#7A0808' }}>PHINMA</p>
            <p className="font-bold text-base mt-2 text-dark">ROOM RESERVATION REQUEST</p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className={statusBadge}>{request.status}</span>
            <span className="text-xs text-gray-400">{buildApprovalFlowLabel(approvalRecords)}</span>
          </div>

          <h4 className="font-bold text-sm mb-4 uppercase tracking-wider" style={{ color: '#7A0808' }}>Reservation Information</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
            {[
              ['Name of Organization / College / Department', request.nameOfOrg || request.department],
              ['Name of Activity', request.activity || request.title],
              ['Objective of the Activity', request.objectives],
              ['Designated Venue', request.designatedVenue || request.specificVenue],
              ['Date of Activity', request.dateOfActivity || request.dateStart || request.dateField],
              ['Time of Activity', `${request.timeStart || '—'} - ${request.timeEnd || '—'}`],
              ['Number of Participants', request.participants],
              ['Requested By', request.requestedBy || request.requestor],
              ['Contact Number', request.contactNumber || '—'],
              ['Date Filed', request.dateFiled],
            ].map(([label, value]) => (
              <div key={label} className={label.includes('Objective') ? 'col-span-2' : ''}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-dark border-b border-gray-200 pb-1">{value || '—'}</p>
              </div>
            ))}
          </div>

          {request.specialRequirements && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Special Requirements</p>
              <p className="text-sm text-dark">{request.specialRequirements}</p>
            </div>
          )}

          {request.rejectReason && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-800">{request.rejectReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-sm mb-4" style={{ color: '#2B3235' }}>Approval Timeline</h3>
            <ApprovalTimeline approvalRecords={approvalRecords} />
          </div>

          <ReservationApprovalActions
            reservation={request}
            profile={profile}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      </div>
    </Layout>
  );
}

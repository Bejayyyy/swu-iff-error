import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp, defaultAcademicSteps } from '../context/AppContext';

export default function AcademicRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { requests, updateRequest } = useApp();
  const fromState = state?.request;
  const fromList = requests.find((r) => String(r.id) === String(id));
  const request = fromState || fromList;

  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (!request || request.type !== 'academic') return;
    setSteps(
      request.approvalSteps?.length
        ? request.approvalSteps.map((s) => ({ ...s }))
        : defaultAcademicSteps(request.gsdApplicable !== false)
    );
  }, [request?.id]);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (!request || request.type !== 'academic') {
    return (
      <Layout title="Academic Request" subtitle="Request not found">
        <button type="button" className="btn-maroon text-sm" onClick={() => navigate('/approvals')}>
          Back to approvals
        </button>
      </Layout>
    );
  }

  const allApproved = steps.every((s) => s.approved || s.signed);
  const firstPending = steps.findIndex((s) => !(s.approved || s.signed));

  const approveStep = (i) => {
    if (i !== firstPending) return;
    const updated = steps.map((s, i) =>
      i === firstPending ? { ...s, approved: true, approvedBy: s.approvedBy || 'Approver', signed: true } : s
    );
    setSteps(updated);
    updateRequest(request.id, { approvalSteps: updated });
  };

  const handleApprove = () => {
    if (!allApproved) return;
    updateRequest(request.id, { status: 'Approved', approvalSteps: steps });
    navigate(-1);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setShowReject(true);
      return;
    }
    updateRequest(request.id, { status: 'Rejected', rejectReason });
    navigate(-1);
  };

  const detailRows = [
    ['Request type', request.reqType || 'Academic'],
    ['Course code', request.courseCode],
    ['Course / subject', request.courseDesc || request.title],
    ['Department / college', request.department],
    ['Instructor', request.instructor || request.requestor],
    ['Semester', request.semester],
    ['Students', request.numStudents || request.participants],
    ['Building', request.building],
    ['Floor / room', `${request.floor || '—'} · ${request.room || request.venue || '—'}`],
    ['Date', request.dateField || request.dateStart],
    ['Time', `${request.timeStart} – ${request.timeEnd}`],
    ['Venue detail', request.specificVenue || request.venue],
    ['Delivery mode', request.deliveryMode || 'Face-to-Face'],
    ['Filed', request.dateFiled],
  ];

  return (
    <Layout title="Academic Review Details" subtitle="Academic · Room & schedule request (no permit document)">
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold" style={{ color: '#2B3235' }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-gray-100 shadow-md">
          <h4 className="font-bold text-sm mb-4 uppercase tracking-wider" style={{ color: '#800000' }}>
            Request details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6">
            {detailRows.map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#2B3235', opacity: 0.65 }}>
                  {label}
                </p>
                <p className="text-sm font-semibold border-b border-gray-200 pb-1" style={{ color: '#2B3235' }}>
                  {value || '—'}
                </p>
              </div>
            ))}
          </div>
          {request.objectives && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#2B3235', opacity: 0.65 }}>
                Objectives
              </p>
              <p className="text-sm" style={{ color: '#2B3235' }}>{request.objectives}</p>
            </div>
          )}

          <h4 className="font-bold text-sm mb-4 uppercase tracking-wider" style={{ color: '#800000' }}>
            Approval chain
          </h4>
          <p className="text-xs mb-3" style={{ color: '#2B3235', opacity: 0.75 }}>
            Dean → {request.gsdApplicable !== false ? 'GSD (if applicable) → ' : ''}Registrar (Super Admin)
          </p>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  step.approved || step.signed ? 'border-green-200 bg-green-50/40' : i === firstPending ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-gray-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2B3235' }}>
                    {step.role}
                  </p>
                  {step.approved || step.signed ? (
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Approved</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>
                  )}
                </div>
                {step.approved || step.signed ? (
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#2B3235' }}>
                      Approved by {step.approvedBy || step.name || 'Approver'}
                    </p>
                  </div>
                ) : (
                  <div className="h-12 border-b border-dashed border-gray-300 flex items-end justify-between pb-1">
                    <p className="text-xs italic" style={{ color: '#2B3235', opacity: 0.45 }}>
                      Waiting for approval
                    </p>
                    <button type="button" className="btn-maroon text-xs py-1 px-3" onClick={() => approveStep(i)} disabled={i !== firstPending} style={{ opacity: i === firstPending ? 1 : 0.5 }}>
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md">
            <h3 className="font-bold text-sm mb-4" style={{ color: '#2B3235' }}>Approval progress</h3>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      step.approved || step.signed ? 'bg-green-500' : i === firstPending ? 'bg-amber-400' : 'bg-gray-200'
                    }`}
                  >
                    {step.approved || step.signed ? <CheckCircle size={12} className="text-white" /> : <span className="text-white text-[10px] font-black">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: '#2B3235' }}>{step.role}</p>
                    <p className="text-[10px]" style={{ color: '#2B3235', opacity: 0.6 }}>
                      {step.approved || step.signed ? (step.approvedBy || step.name || 'Approved') : 'Pending approval'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md">
            <h3 className="font-bold text-sm mb-1" style={{ color: '#2B3235' }}>Approval actions</h3>
            <p className="text-[11px] mb-4" style={{ color: '#2B3235', opacity: 0.6 }}>
              Approval only flow: Dean, then GSD (if applicable), then Registrar.
            </p>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={step.approved || step.signed || i > firstPending}
                  onClick={() => approveStep(i)}
                  className="w-full text-left p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold"
                  style={
                    step.approved || step.signed
                      ? { background: '#D1FAE5', borderColor: '#6EE7B7', color: '#065F46', cursor: 'default' }
                      : i === firstPending
                      ? { background: '#FFF0F0', borderColor: '#800000', color: '#800000', cursor: 'pointer' }
                      : { background: '#f9f9f9', borderColor: '#e2e5e8', color: '#9ca3af', cursor: 'not-allowed' }
                  }
                >
                  <CheckCircle size={14} />
                  {step.approved || step.signed ? `Approved: ${step.role}` : `Approve as ${step.role}`}
                </button>
              ))}
            </div>
          </div>

          {request.status === 'Pending' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-md space-y-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!allApproved}
                className="btn-maroon w-full justify-center py-2.5 rounded-xl text-sm"
                style={{ opacity: allApproved ? 1 : 0.5 }}
              >
                Approve request
              </button>
              <button type="button" onClick={() => (showReject ? handleReject() : setShowReject(true))} className="btn-outline-maroon w-full justify-center py-2.5 rounded-xl text-sm">
                Reject
              </button>
              {showReject && (
                <textarea
                  className="form-input text-xs mt-2"
                  rows={3}
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}

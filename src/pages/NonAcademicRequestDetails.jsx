import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, PenTool } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

const roles = [
  { role: 'Requestor Signature', title: 'Step 1: Requestor Signature' },
  { role: 'Student Life', title: 'Step 2: Student Life Approval' },
  { role: 'College Department', title: 'Step 3: College Department Approval' },
  { role: 'GSD', title: 'Step 4: GSD Approval' },
  { role: 'Registrar', title: 'Step 5: Registrar Final Approval' },
];

export default function NonAcademicRequestDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { updateRequest } = useApp();
  const request = state?.request;

  const [steps, setSteps] = useState(
    request?.approvalSteps || roles.map(r => ({ ...r, name: '', signature: '', signed: false }))
  );
  const [signingStep, setSigningStep] = useState(null);
  const [tempName, setTempName] = useState('');
  const [tempSig, setTempSig] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (!request) return null;

  const allSigned = steps.every(s => s.signed);
  const firstUnsigned = steps.findIndex(s => !s.signed);

  const handleSign = (i) => {
    setSigningStep(i);
    setTempName(steps[i].name || '');
    setTempSig(steps[i].signature || '');
  };

  const confirmSign = () => {
    if (!tempName.trim()) return;
    const updated = steps.map((s, i) => i === signingStep ? { ...s, name: tempName, signature: tempSig || tempName, signed: true } : s);
    setSteps(updated);
    if (request?.id) updateRequest(request.id, { approvalSteps: updated });
    setSigningStep(null);
  };

  const handleApprove = () => {
    if (!allSigned) return;
    if (request?.id) updateRequest(request.id, { status: 'Approved', approvalSteps: steps });
    navigate(-1);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { setShowReject(true); return; }
    if (request?.id) updateRequest(request.id, { status: 'Rejected', rejectReason });
    navigate(-1);
  };

  return (
    <Layout title="Request Details" subtitle="Non-Academic · On-Campus Activity Permit">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold" style={{ color: '#2B3235' }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={16} />
          </div>
          Back
        </button>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-outline-maroon text-xs">Print Permit</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Permit document */}
        <div className="col-span-2 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="text-center mb-8">
            <p className="text-lg font-black tracking-widest" style={{ color: '#7A0808' }}>SOUTHWESTERN UNIVERSITY</p>
            <p className="text-sm font-bold tracking-widest" style={{ color: '#7A0808' }}>PHINMA</p>
            <p className="font-bold text-base mt-2 text-dark">ON-CAMPUS ACTIVITY PERMIT</p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-gray-400">Procedure:</h4>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Secure a permit from the Student Life Office. Make sure all entries are completely filled out.</li>
              <li>Permit must be filed One (1) week before the scheduled date of the proposed activity.</li>
            </ol>
          </div>

          <h4 className="font-bold text-sm mb-4 uppercase tracking-wider" style={{ color: '#7A0808' }}>Requestor's Information</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
            {[
              ['Name of Organization / College / Department', request.nameOfOrg || request.department],
              ['Date of Activity', request.dateOfActivity || request.dateStart],
              ['Name of Activity', request.activity || request.title],
              ['Time of Activity', `${request.timeStart} - ${request.timeEnd}`],
              ['Max. of Participants', request.participants],
              ['Requested by', request.requestor],
              ['Contact Number', '000-000-0000'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-dark border-b border-gray-200 pb-1">{value || '—'}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Designated Venue</p>
            <p className="text-sm font-semibold text-dark border-b border-gray-200 pb-1">{request.designatedVenue || '—'}</p>
          </div>
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Objectives of the Activity</p>
            <p className="text-sm text-dark">{request.objectives || '—'}</p>
          </div>
          {request.specialRequirements && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Special Requirements</p>
              <p className="text-sm text-dark">{request.specialRequirements}</p>
            </div>
          )}

          {/* Signature fields */}
          <h4 className="font-bold text-sm mb-4 uppercase tracking-wider" style={{ color: '#7A0808' }}>Approval Signatures</h4>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className={`p-4 rounded-xl border ${step.signed ? 'border-green-200 bg-green-50/40' : i === firstUnsigned ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100 bg-gray-50/40'}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2B3235' }}>{step.role}</p>
                  {step.signed
                    ? <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Signed</span>
                    : <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Pending</span>}
                </div>
                {step.signed ? (
                  <div>
                    <p className="text-sm font-bold italic" style={{ color: '#7A0808', fontFamily: 'Georgia, serif', fontSize: 18 }}>{step.signature}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.name}</p>
                  </div>
                ) : (
                  <div className="h-12 border-b border-dashed border-gray-300 flex items-end pb-1">
                    <p className="text-xs text-gray-300 italic">Signature above printed name</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Approval Progress */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-sm mb-4" style={{ color: '#2B3235' }}>Approval Progress</h3>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.signed ? 'bg-green-500' : i === firstUnsigned ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                    {step.signed ? <CheckCircle size={12} className="text-white" /> : <span className="text-white text-[10px] font-black">{i+1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-dark">{step.role}</p>
                    <p className="text-[10px] text-gray-400">{step.signed ? step.name : 'Pending signature'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Digital Signature */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-sm mb-1" style={{ color: '#2B3235' }}>Apply Digital Signature</h3>
            <p className="text-[11px] text-gray-400 mb-4">Select your role to sign this permit</p>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <button
                  key={i}
                  disabled={step.signed || i > firstUnsigned}
                  onClick={() => handleSign(i)}
                  className="w-full text-left p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold"
                  style={step.signed
                    ? { background: '#D1FAE5', borderColor: '#6EE7B7', color: '#065F46', cursor: 'default' }
                    : i === firstUnsigned
                    ? { background: '#FFF0F0', borderColor: '#7A0808', color: '#7A0808', cursor: 'pointer' }
                    : { background: '#f9f9f9', borderColor: '#e2e5e8', color: '#9ca3af', cursor: 'not-allowed' }}
                >
                  {step.signed ? <CheckCircle size={14} /> : <PenTool size={14} />}
                  {step.signed ? `Signed: ${step.role}` : step.role}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {request.status === 'Pending' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
              <button
                onClick={handleApprove}
                disabled={!allSigned}
                className="btn-maroon w-full justify-center py-2.5 rounded-xl text-sm"
                style={{ opacity: allSigned ? 1 : 0.5 }}
              >
                <CheckCircle size={16} /> Approve & Confirm
              </button>
              <button
                onClick={() => showReject ? handleReject() : setShowReject(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all"
                style={{ borderColor: '#991B1B', color: '#991B1B' }}
              >
                <XCircle size={16} /> {showReject ? 'Confirm Reject' : 'Request Modification'}
              </button>
              {showReject && (
                <textarea
                  className="form-input resize-none mt-1"
                  rows={3}
                  placeholder="Provide reason for rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sign Modal */}
      {signingStep !== null && (
        <div className="modal-overlay" onClick={() => setSigningStep(null)}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-base mb-1" style={{ color: '#7A0808' }}>Sign as {steps[signingStep]?.role}</h3>
            <p className="text-xs text-gray-400 mb-5">Enter your name and signature to proceed</p>
            <div className="space-y-3">
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="Your full name" value={tempName} onChange={e => setTempName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Signature (type or draw)</label>
                <input className="form-input" placeholder="Your signature" style={{ fontFamily: 'Georgia, serif', fontSize: 18 }} value={tempSig} onChange={e => setTempSig(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSigningStep(null)} className="btn-outline-maroon flex-1">Cancel</button>
              <button onClick={confirmSign} className="btn-maroon flex-1 justify-center">Apply Signature</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

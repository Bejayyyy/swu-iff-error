import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useApp, defaultNonAcademicSteps } from '../../context/AppContext';
import { useModal } from '../../hooks/useModal';
import { ModalRenderer } from './ModalProvider';

export default function NonAcademicRequestModal({ onClose }) {
  const { addRequest, buildingList } = useApp();
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();
  const [form, setForm] = useState({
    nameOfOrg: '', activity: '', dateOfActivity: '', timeStart: '', timeEnd: '',
    participants: '', building: '', room: '', designatedVenue: '', objectives: '', specialRequirements: '',
    dateFiled: new Date().toLocaleDateString('en-GB'),
    utilityUnderMedicine: false,
    approvalSteps: defaultNonAcademicSteps(false),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedBuilding = useMemo(
    () => buildingList.find((b) => b.name === form.building),
    [buildingList, form.building]
  );
  const roomsInSelectedBuilding = useMemo(() => {
    if (!selectedBuilding) return [];
    return selectedBuilding.floorData.flatMap((f) =>
      f.rooms.map((r) => ({ id: r.id, floor: f.floor }))
    );
  }, [selectedBuilding]);

  const handleSubmit = async (draft = false) => {
    const isDraft = draft === true;
    
    // Validate required fields for submission
    if (!isDraft && (!form.nameOfOrg.trim() || !form.activity.trim())) {
      showNotification({
        type: 'warning',
        title: 'Missing information',
        message: 'Please provide organization name and activity name.',
        autoCloseMs: 3000,
      });
      return;
    }

    const confirmed = await showConfirm({
      title: isDraft ? 'Save as draft?' : 'Submit request?',
      message: isDraft 
        ? 'The request will be saved as a draft and can be submitted later.'
        : 'This will submit the non-academic request for approval.',
      confirmText: isDraft ? 'Save Draft' : 'Submit',
      cancelText: 'Cancel',
      variant: 'primary',
    });

    if (!confirmed) return;

    try {
      addRequest({
        type: 'non-academic',
        title: form.activity,
        department: form.nameOfOrg,
        requestor: form.nameOfOrg,
        ...form, 
        status: isDraft ? 'Draft' : 'Pending',
      });
      
      showNotification({
        type: 'success',
        title: isDraft ? 'Draft saved' : 'Request submitted',
        message: isDraft 
          ? 'Your non-academic request has been saved as a draft.'
          : 'Your non-academic request has been submitted for approval.',
        autoCloseMs: 2000,
      });
      
      onClose();
    } catch (error) {
      showNotification({
        type: 'error',
        title: isDraft ? 'Save failed' : 'Submit failed',
        message: error.message || 'An error occurred. Please try again.',
        autoCloseMs: 0,
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl relative flex flex-col" style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <div className="px-8 pt-7 pb-4 border-b border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700"><X size={20} /></button>
          <div className="text-center mb-2">
            <p className="text-sm font-black tracking-widest" style={{ color: '#7A0808' }}>SOUTHWESTERN UNIVERSITY</p>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#7A0808' }}>PHINMA</p>
            <p className="font-bold text-sm mt-1 text-dark">ON-CAMPUS ACTIVITY PERMIT</p>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 text-center py-2 rounded-lg font-bold text-sm cursor-default" style={{ background: '#7A0808', color: 'white' }}>Non-Academic</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-5">
          <div className="bg-red-50/40 rounded-xl p-4 mb-5">
            <h4 className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: '#7A0808' }}>Procedure:</h4>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Secure a permit from the Student Life Office.</li>
              <li>Make sure all entries are completely filled out.</li>
              <li>Permit must be filed One (1) week before the scheduled date.</li>
            </ol>
          </div>

          <h3 className="font-bold text-base mb-4 text-dark">Requestor's Information</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="col-span-2">
              <label className="form-label">Name of Organization / College / Department</label>
              <input className="form-input" placeholder="Organization name" value={form.nameOfOrg} onChange={e => set('nameOfOrg', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Name of Activity</label>
              <input className="form-input" placeholder="Activity name" value={form.activity} onChange={e => set('activity', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Date of Activity</label>
              <input className="form-input" type="date" value={form.dateOfActivity} onChange={e => set('dateOfActivity', e.target.value)} />
            </div>
            <div>
              <label className="form-label">No. of Participants</label>
              <input className="form-input" type="number" placeholder="e.g., 100" value={form.participants} onChange={e => set('participants', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Time Start</label>
              <input className="form-input" type="time" value={form.timeStart} onChange={e => set('timeStart', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Time End</label>
              <input className="form-input" type="time" value={form.timeEnd} onChange={e => set('timeEnd', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Building</label>
              <select
                className="form-input"
                value={form.building}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({ ...f, building: value, room: '', designatedVenue: '' }));
                }}
              >
                <option value="">Select Building</option>
                {buildingList.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Room</label>
              <select
                className="form-input"
                value={form.room}
                onChange={(e) => {
                  const selectedRoom = roomsInSelectedBuilding.find((r) => r.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    room: e.target.value,
                    designatedVenue: selectedRoom ? `${e.target.value}, ${f.building} Floor ${selectedRoom.floor}` : '',
                  }));
                }}
                disabled={!form.building}
              >
                <option value="">{form.building ? 'Select Room' : 'Select building first'}</option>
                {roomsInSelectedBuilding.map((r) => (
                  <option key={r.id} value={r.id}>{`${r.id} (Floor ${r.floor})`}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Designated Venue</label>
              <input className="form-input" placeholder="e.g., Gymnasium, Main Campus" value={form.designatedVenue} onChange={e => set('designatedVenue', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Objectives of the Activity</label>
              <textarea className="form-input resize-none" rows={3} placeholder="Describe the objectives..." value={form.objectives} onChange={e => set('objectives', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Special Requirements</label>
              <textarea className="form-input resize-none" rows={2} placeholder="e.g., Sound system, stage, etc." value={form.specialRequirements} onChange={e => set('specialRequirements', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer" style={{ color: '#2B3235' }}>
                <input
                  type="checkbox"
                  checked={form.utilityUnderMedicine}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      utilityUnderMedicine: checked,
                      approvalSteps: defaultNonAcademicSteps(checked),
                    }));
                  }}
                  className="accent-[#800000]"
                />
                Utility is under Medicine (adds Medicine approver before GSD)
              </label>
            </div>
            <div>
              <label className="form-label">Date of Filed</label>
              <input className="form-input" value={new Date().toLocaleDateString()} readOnly style={{ background: '#f9f9f9' }} />
            </div>
          </div>

          {/* Approval Steps Preview */}
          <div className="mb-4">
            <h3 className="font-bold text-base mb-3 text-dark">Approval Signatories</h3>
            <p className="text-xs text-gray-400 mb-3">The following officials must sign this permit for approval.</p>
            <div className="space-y-2">
              {form.approvalSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#7A0808', color: 'white' }}>{i+1}</div>
                  <div>
                    <p className="text-xs font-bold text-dark">{step.role}</p>
                    <p className="text-[11px] text-gray-400">Pending signature</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={() => handleSubmit(true)} className="btn-outline-maroon flex-1">Save as Draft</button>
          <button onClick={() => handleSubmit(false)} className="btn-maroon flex-1 justify-center">Submit Request</button>
        </div>
      </div>
      
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </div>
  );
}

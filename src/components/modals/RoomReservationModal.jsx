import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { APPROVAL_TYPES } from '../../constants/approvalWorkflow';
import { requiresCollege } from '../../constants/colleges';
import { subscribeColleges } from '../../services/collegeService';
import { fetchWorkflowLevels } from '../../services/approvalWorkflowService';
import { useModal } from '../../hooks/useModal';
import { ModalRenderer } from './ModalProvider';
import LoadingModal from './LoadingModal';
import ApprovalTimeline from '../reservations/ApprovalTimeline';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { COLLECTIONS } from '../../firebase/constants';

const emptyForm = {
  nameOfOrg: '',
  activity: '',
  objectives: '',
  designatedVenue: '',
  dateOfActivity: '',
  timeStart: '',
  timeEnd: '',
  participants: '',
  requestedBy: '',
  contactNumber: '',
  specialRequirements: '',
  college: '', // Added college field for filtering
};

export default function RoomReservationModal({ onClose, eventType, prefill = {} }) {
  const { addRequest, buildingList } = useApp();
  const { profile } = useAuth();
  const { showConfirm, showNotification, confirmState, notificationState } = useModal();
  const [form, setForm] = useState({
    ...emptyForm,
    requestedBy: profile?.displayName || '',
    college: profile?.college || '', // Pre-fill from profile if exists
    dateFiled: new Date().toLocaleDateString('en-GB'),
    building: prefill.building || '',
    room: prefill.room || '',
    designatedVenue: prefill.designatedVenue || '',
  });
  const [colleges, setColleges] = useState([]); // Dynamic colleges from Firestore
  const [workflowPreview, setWorkflowPreview] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');

  // Show college dropdown if user is teacher or organization head
  const showCollegeField = requiresCollege(profile?.role);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Subscribe to colleges from Firestore
  useEffect(() => {
    return subscribeColleges(
      (data) => setColleges(data),
      (err) => console.error('Error loading colleges:', err)
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    const loadWorkflowPreview = async () => {
      try {
        // Check if the selected room/floor has a manager
        let roomManager = null;
        let roomManagerName = null;
        
        if (prefill.buildingId && prefill.floorId && prefill.roomDocId) {
          // Check room manager
          const buildingRef = doc(db, COLLECTIONS.BUILDINGS, prefill.buildingId);
          const floorRef = doc(buildingRef, COLLECTIONS.FLOORS, prefill.floorId);
          const roomRef = doc(floorRef, COLLECTIONS.ROOMS, prefill.roomDocId);
          
          const roomSnap = await getDoc(roomRef);
          if (roomSnap.exists()) {
            const roomData = roomSnap.data();
            roomManager = roomData.managedBy;
            roomManagerName = roomData.managedByName;
            
            // If room doesn't have manager, check floor
            if (!roomManager) {
              const floorSnap = await getDoc(floorRef);
              if (floorSnap.exists()) {
                const floorData = floorSnap.data();
                roomManager = floorData.managedBy;
                roomManagerName = floorData.managedByName;
              }
            }
          }
        }
        
        // Determine which workflow to use
        let workflowType = eventType;
        if (roomManager && roomManagerName) {
          // Use dean-managed workflow based on reservation type
          workflowType = eventType === APPROVAL_TYPES.ACADEMIC 
            ? APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC 
            : APPROVAL_TYPES.DEAN_MANAGED_NON_ACADEMIC;
        }
        
        const levels = await fetchWorkflowLevels(workflowType);
        
        if (cancelled) return;
        
        // Map levels to preview records
        let previewRecords = levels.map((level, index) => ({
          id: level.id,
          levelNumber: level.levelNumber,
          roleId: level.roleId,
          roleLabel: level.roleLabel,
          status: index === 0 ? 'Pending' : 'Waiting',
        }));
        
        // If using dean-managed workflow, replace room-manager-dean placeholder
        if ((workflowType === APPROVAL_TYPES.DEAN_MANAGED_ACADEMIC || 
             workflowType === APPROVAL_TYPES.DEAN_MANAGED_NON_ACADEMIC) && 
            roomManager && roomManagerName) {
          previewRecords = previewRecords.map(record => {
            if (record.roleId === 'room-manager-dean') {
              return {
                ...record,
                roleLabel: `${roomManagerName} (Room Manager)`,
              };
            }
            return record;
          });
        }
        
        setWorkflowPreview(previewRecords);
      } catch (err) {
        console.error('Error loading workflow preview:', err);
        if (!cancelled) setWorkflowPreview([]);
      }
    };
    
    loadWorkflowPreview();
    
    return () => { cancelled = true; };
  }, [eventType, prefill.buildingId, prefill.floorId, prefill.roomDocId]);

  const selectedBuilding = useMemo(
    () => buildingList.find((b) => b.name === form.building || String(b.id) === String(prefill.buildingId)),
    [buildingList, form.building, prefill.buildingId],
  );

  const roomsInBuilding = useMemo(() => {
    if (prefill.room && prefill.buildingId) {
      return [{ id: prefill.room, floor: prefill.floor }];
    }
    if (!selectedBuilding) return [];
    return selectedBuilding.floorData.flatMap((f) => f.rooms.map((r) => ({ id: r.id, floor: f.floor, floorId: f.floorId, docId: r.docId })));
  }, [selectedBuilding, prefill]);

  const isPrefilledRoom = Boolean(prefill.room && prefill.buildingId);

  const submit = async (draft = false) => {
    const isDraft = draft === true;
    
    setError('');
    
    if (!form.nameOfOrg.trim() || !form.activity.trim() || !form.dateOfActivity) {
      setError('Organization, activity name, and date are required.');
      showNotification({
        type: 'warning',
        title: 'Missing information',
        message: 'Please provide organization, activity name, and date.',
        autoCloseMs: 3000,
      });
      return;
    }
    
    if (showCollegeField && !form.college) {
      setError('College is required.');
      showNotification({
        type: 'warning',
        title: 'Missing information',
        message: 'Please select your college.',
        autoCloseMs: 3000,
      });
      return;
    }
    
    if (!isDraft && !workflowPreview.length) {
      setError('No approval workflow configured. Contact the Registrar.');
      showNotification({
        type: 'error',
        title: 'No workflow configured',
        message: 'Contact the Registrar to configure the approval workflow.',
        autoCloseMs: 0,
      });
      return;
    }

    const confirmed = await showConfirm({
      title: isDraft ? 'Save as draft?' : 'Submit reservation?',
      message: isDraft 
        ? 'The reservation will be saved as a draft and can be submitted later.'
        : 'This will submit the room reservation request for approval.',
      confirmText: isDraft ? 'Save Draft' : 'Submit',
      cancelText: 'Cancel',
      variant: 'primary',
    });

    if (!confirmed) return;

    setIsLoading(true);
    setLoadingMessage(isDraft ? 'Saving draft...' : 'Submitting reservation...');
    setBusy(true);
    try {
      await addRequest(
        {
          type: eventType,
          ...form,
          college: form.college || profile?.college || '', // Include college for filtering
          buildingId: prefill.buildingId || selectedBuilding?.id || null,
          roomId: prefill.roomDocId || null,
          floor: prefill.floor ?? null,
          floorId: prefill.floorId || null,
          requestorEmail: profile?.email,
          createdByUid: profile?.uid,
        },
        { draft: isDraft },
      );
      
      showNotification({
        type: 'success',
        title: isDraft ? 'Draft saved' : 'Reservation submitted',
        message: isDraft 
          ? 'Your room reservation has been saved as a draft.'
          : 'Your room reservation has been submitted for approval.',
        autoCloseMs: 2000,
      });
      
      onClose();
    } catch (err) {
      const errorMessage = err.message || 'Failed to submit reservation.';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: isDraft ? 'Save failed' : 'Submit failed',
        message: errorMessage,
        autoCloseMs: 0,
      });
    } finally {
      setBusy(false);
      setIsLoading(false);
    }
  };

  const title = eventType === APPROVAL_TYPES.ACADEMIC ? 'Academic Room Reservation' : 'Non-Academic Room Reservation';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-xl relative flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-7 pb-4 border-b border-gray-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="absolute right-5 top-5 text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
          <div className="text-center mb-2">
            <p className="text-sm font-black tracking-widest" style={{ color: '#7A0808' }}>SOUTHWESTERN UNIVERSITY</p>
            <p className="text-xs font-bold tracking-widest" style={{ color: '#7A0808' }}>PHINMA</p>
            <p className="font-bold text-sm mt-1 text-dark">ROOM RESERVATION REQUEST</p>
          </div>
          <div className="flex gap-2 mt-4">
            <div
              className="flex-1 text-center py-2 rounded-lg font-bold text-sm"
              style={{ background: '#7A0808', color: 'white' }}
            >
              {title}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-5">
          {error && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <h3 className="font-bold text-base mb-4 text-dark">Reservation Details</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="col-span-2">
              <label className="form-label">Name of Organization / College / Department</label>
              <input className="form-input" value={form.nameOfOrg} onChange={(e) => set('nameOfOrg', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Name of Activity</label>
              <input className="form-input" value={form.activity} onChange={(e) => set('activity', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Objective of the Activity</label>
              <textarea className="form-input resize-none" rows={3} value={form.objectives} onChange={(e) => set('objectives', e.target.value)} />
            </div>
            {!isPrefilledRoom && (
              <>
                <div className="col-span-2">
                  <label className="form-label">Building</label>
                  <select
                    className="form-input"
                    value={form.building}
                    onChange={(e) => setForm((f) => ({ ...f, building: e.target.value, room: '', designatedVenue: '' }))}
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
                      const room = roomsInBuilding.find((r) => r.id === e.target.value);
                      setForm((f) => ({
                        ...f,
                        room: e.target.value,
                        designatedVenue: room ? `${e.target.value}, ${f.building} Floor ${room.floor}` : f.designatedVenue,
                      }));
                    }}
                    disabled={!form.building}
                  >
                    <option value="">{form.building ? 'Select Room' : 'Select building first'}</option>
                    {roomsInBuilding.map((r) => (
                      <option key={r.id} value={r.id}>{`${r.id} (Floor ${r.floor})`}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="col-span-2">
              <label className="form-label">Designated Venue</label>
              <input
                className="form-input"
                value={form.designatedVenue}
                onChange={(e) => set('designatedVenue', e.target.value)}
                readOnly={isPrefilledRoom}
                style={isPrefilledRoom ? { background: '#f9f9f9' } : undefined}
              />
            </div>
            <div>
              <label className="form-label">Date of Activity</label>
              <input className="form-input" type="date" value={form.dateOfActivity} onChange={(e) => set('dateOfActivity', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Number of Participants</label>
              <input className="form-input" type="number" value={form.participants} onChange={(e) => set('participants', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Time Start</label>
              <input className="form-input" type="time" value={form.timeStart} onChange={(e) => set('timeStart', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Time End</label>
              <input className="form-input" type="time" value={form.timeEnd} onChange={(e) => set('timeEnd', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Requested By</label>
              <input className="form-input" value={form.requestedBy} onChange={(e) => set('requestedBy', e.target.value)} />
            </div>
            {showCollegeField && (
              <div className="col-span-2">
                <label className="form-label">Your College <span className="text-red-600">*</span></label>
                <select className="form-input" value={form.college} onChange={(e) => set('college', e.target.value)} required>
                  <option value="">Select College</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.code}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Your request will be routed to the dean of this college for approval
                </p>
              </div>
            )}
            <div className="col-span-2">
              <label className="form-label">Contact Number</label>
              <input className="form-input" value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Special Requirements</label>
              <textarea className="form-input resize-none" rows={2} value={form.specialRequirements} onChange={(e) => set('specialRequirements', e.target.value)} placeholder="e.g., Audio Visual System, Air Conditioning, Podium" />
            </div>
            <div>
              <label className="form-label">Date Filed</label>
              <input className="form-input" value={form.dateFiled} readOnly style={{ background: '#f9f9f9' }} />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-base mb-3 text-dark">Approval Workflow Preview</h3>
            <p className="text-xs text-gray-400 mb-3">Configured by the Registrar — only Level 1 will be pending on submit.</p>
            <ApprovalTimeline approvalRecords={workflowPreview} compact />
          </div>
        </div>

        <div className="px-8 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={() => submit(true)} disabled={busy} className="btn-outline-maroon flex-1">
            {busy ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="button" onClick={() => submit(false)} disabled={busy} className="btn-maroon flex-1 justify-center">
            {busy ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
      
      <LoadingModal isOpen={isLoading} message={loadingMessage} />
      <ModalRenderer confirmState={confirmState} notificationState={notificationState} />
    </div>
  );
}

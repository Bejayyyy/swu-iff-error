import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  orderBy,
  runTransaction,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { COLLECTIONS } from '../firebase/constants';
import {
  APPROVAL_RECORD_STATUS,
  APPROVAL_TYPES,
  RESERVATION_STATUS,
} from '../constants/approvalWorkflow';
import { getWorkflowSnapshot } from './approvalWorkflowService';

function reservationsCollection() {
  return collection(db, COLLECTIONS.ROOM_RESERVATIONS);
}

function reservationRef(id) {
  return doc(db, COLLECTIONS.ROOM_RESERVATIONS, id);
}

function mapReservationDoc(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    approvalRecords: data.approvalRecords || [],
    approvalSteps: data.approvalRecords || data.approvalSteps || [],
  };
}

export function subscribeRoomReservations(onData, onError) {
  const q = query(reservationsCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(mapReservationDoc)),
    onError,
  );
}

export async function fetchRoomReservation(reservationId) {
  const snap = await getDoc(reservationRef(reservationId));
  if (!snap.exists()) return null;
  return mapReservationDoc(snap);
}

function buildApprovalRecords(workflowSnapshot, submit = true) {
  if (!workflowSnapshot?.length) {
    throw new Error('No approval workflow configured. Contact the Registrar to set up approval levels.');
  }

  return workflowSnapshot.map((level, index) => ({
    id: `lvl_${level.levelNumber}_${level.roleId}`,
    workflowId: level.workflowId || null,
    levelNumber: level.levelNumber,
    roleId: level.roleId,
    roleLabel: level.roleLabel,
    status: submit
      ? index === 0
        ? APPROVAL_RECORD_STATUS.PENDING
        : APPROVAL_RECORD_STATUS.WAITING
      : APPROVAL_RECORD_STATUS.WAITING,
    approvedByUid: null,
    approvedByName: null,
    approvedAt: null,
    remarks: null,
  }));
}

export async function createRoomReservation(payload, { draft = false } = {}) {
  const approvalType = payload.type === APPROVAL_TYPES.ACADEMIC
    ? APPROVAL_TYPES.ACADEMIC
    : APPROVAL_TYPES.NON_ACADEMIC;

  const workflowSnapshot = await getWorkflowSnapshot(approvalType);
  const approvalRecords = buildApprovalRecords(workflowSnapshot, !draft);
  const ref = doc(reservationsCollection());

  const reservation = {
    type: approvalType,
    status: draft ? RESERVATION_STATUS.DRAFT : RESERVATION_STATUS.IN_PROGRESS,
    title: payload.activity?.trim() || payload.title?.trim() || 'Room Reservation',
    department: payload.nameOfOrg?.trim() || payload.department?.trim() || '',
    college: payload.college?.trim() || '', // Added college field for filtering
    requestor: payload.requestedBy?.trim() || payload.requestor?.trim() || '',
    requestorEmail: payload.requestorEmail || null,
    createdByUid: payload.createdByUid || null,
    nameOfOrg: payload.nameOfOrg?.trim() || '',
    activity: payload.activity?.trim() || '',
    objectives: payload.objectives?.trim() || '',
    designatedVenue: payload.designatedVenue?.trim() || '',
    dateOfActivity: payload.dateOfActivity || '',
    timeStart: payload.timeStart || '',
    timeEnd: payload.timeEnd || '',
    participants: Number(payload.participants) || 0,
    requestedBy: payload.requestedBy?.trim() || '',
    contactNumber: payload.contactNumber?.trim() || '',
    dateFiled: payload.dateFiled || new Date().toLocaleDateString('en-GB'),
    specialRequirements: payload.specialRequirements?.trim() || '',
    building: payload.building || '',
    buildingId: payload.buildingId || null,
    room: payload.room || '',
    roomId: payload.roomId || null,
    floor: payload.floor ?? null,
    floorId: payload.floorId || null,
    workflowSnapshot,
    approvalRecords,
    rejectReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, reservation);
  return { id: ref.id, ...reservation };
}

export async function submitDraftReservation(reservationId) {
  const ref = reservationRef(reservationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Reservation not found.');

  const data = snap.data();
  if (data.status !== RESERVATION_STATUS.DRAFT) {
    throw new Error('Only draft reservations can be submitted.');
  }

  const workflowSnapshot = data.workflowSnapshot?.length
    ? data.workflowSnapshot
    : await getWorkflowSnapshot(data.type);

  const approvalRecords = buildApprovalRecords(workflowSnapshot, true);

  await setDoc(
    ref,
    {
      status: RESERVATION_STATUS.IN_PROGRESS,
      workflowSnapshot,
      approvalRecords,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function processApprovalAction({
  reservationId,
  approverUid,
  approverName,
  approverRole,
  action,
  remarks = '',
}) {
  if (!['approve', 'reject'].includes(action)) {
    throw new Error('Invalid approval action.');
  }

  await runTransaction(db, async (transaction) => {
    const ref = reservationRef(reservationId);
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error('Reservation not found.');

    const data = snap.data();
    const records = [...(data.approvalRecords || [])];
    const pendingIndex = records.findIndex((r) => r.status === APPROVAL_RECORD_STATUS.PENDING);

    if (pendingIndex === -1) {
      throw new Error('No pending approval step for this reservation.');
    }

    const pending = records[pendingIndex];
    if (pending.roleId !== approverRole) {
      throw new Error('You are not authorized to act on this approval step.');
    }

    const now = new Date().toISOString();

    if (action === 'reject') {
      records[pendingIndex] = {
        ...pending,
        status: APPROVAL_RECORD_STATUS.REJECTED,
        approvedByUid: approverUid,
        approvedByName: approverName,
        approvedAt: now,
        remarks: remarks.trim() || null,
      };
      for (let i = pendingIndex + 1; i < records.length; i += 1) {
        if (records[i].status === APPROVAL_RECORD_STATUS.WAITING) {
          records[i] = { ...records[i], status: APPROVAL_RECORD_STATUS.CANCELLED };
        }
      }
      transaction.update(ref, {
        approvalRecords: records,
        status: RESERVATION_STATUS.REJECTED,
        rejectReason: remarks.trim() || 'Rejected by approver.',
        updatedAt: serverTimestamp(),
      });
      return;
    }

    records[pendingIndex] = {
      ...pending,
      status: APPROVAL_RECORD_STATUS.APPROVED,
      approvedByUid: approverUid,
      approvedByName: approverName,
      approvedAt: now,
      remarks: remarks.trim() || null,
    };

    const nextIndex = records.findIndex((r) => r.status === APPROVAL_RECORD_STATUS.WAITING);
    if (nextIndex === -1) {
      transaction.update(ref, {
        approvalRecords: records,
        status: RESERVATION_STATUS.APPROVED,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    records[nextIndex] = { ...records[nextIndex], status: APPROVAL_RECORD_STATUS.PENDING };
    transaction.update(ref, {
      approvalRecords: records,
      status: RESERVATION_STATUS.IN_PROGRESS,
      updatedAt: serverTimestamp(),
    });
  });
}

/** Backward-compatible update for legacy in-memory fields */
export async function updateRoomReservation(reservationId, updates) {
  await setDoc(
    reservationRef(reservationId),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteRoomReservation(reservationId) {
  if (!reservationId) throw new Error('Reservation ID is required.');
  
  const ref = reservationRef(reservationId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) {
    throw new Error('Reservation not found.');
  }
  
  await deleteDoc(ref);
}

/**
 * Service for Controlled Course Scheduling
 * Registrar-managed workflow with base template creation and sequential adoption
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { COLLECTIONS } from '../firebase/constants';
import {
  SCHEDULE_SESSION_STATUS,
  BASE_SCHEDULE_STATUS,
  PARTICIPANT_STATUS,
} from '../constants/controlledScheduling';

const SCHEDULE_SESSIONS_COLLECTION = 'schedule_control_sessions';

function sessionsCollection() {
  return collection(db, SCHEDULE_SESSIONS_COLLECTION);
}

function sessionRef(id) {
  return doc(db, SCHEDULE_SESSIONS_COLLECTION, id);
}

/**
 * Subscribe to all schedule control sessions (Registrar view)
 */
export function subscribeScheduleSessions(onData, onError) {
  const q = query(sessionsCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

/**
 * Subscribe to sessions where user is a participant (Dean view)
 */
export function subscribeMyScheduleSessions(userUid, onData, onError) {
  if (!userUid) {
    onData([]);
    return () => {};
  }

  // We need to query for sessions where user is base creator OR participant
  // Since we can't do OR queries easily, we'll get all sessions and filter in memory
  const q = query(sessionsCollection(), orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q,
    (snap) => {
      const allSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const mySessions = allSessions.filter(
        (session) =>
          session.baseCreatorUid === userUid ||
          (session.participants || []).some((p) => p.uid === userUid)
      );
      onData(mySessions);
    },
    onError
  );
}

/**
 * Subscribe to a specific session
 */
export function subscribeScheduleSession(sessionId, onData, onError) {
  if (!sessionId) {
    onData(null);
    return () => {};
  }

  return onSnapshot(sessionRef(sessionId), (snap) => {
    if (snap.exists()) {
      onData({ id: snap.id, ...snap.data() });
    } else {
      onData(null);
    }
  }, onError);
}

/**
 * Create a new schedule control session (Registrar only)
 */
export async function createScheduleSession({
  title,
  schoolYearId,
  schoolYearLabel,
  semester,
  baseCreatorUid,
  baseCreatorName,
  baseCreatorEmail,
  baseCreatorCollege,
  participants = [],
  createdBy,
}) {
  const ref = doc(sessionsCollection());

  // Build participants with initial status
  const orderedParticipants = participants.map((p, index) => ({
    uid: p.uid,
    name: p.name,
    email: p.email,
    college: p.college || p.department || '',
    order: index,
    status: PARTICIPANT_STATUS.WAITING,
    canEdit: false,
    startedAt: null,
    completedAt: null,
    adoptedBaseTemplate: false,
  }));

  const session = {
    title: title.trim(),
    schoolYearId,
    schoolYearLabel: schoolYearLabel || '',
    semester: Number(semester),
    status: SCHEDULE_SESSION_STATUS.BASE_CREATION,
    
    // Base creator info
    baseCreatorUid,
    baseCreatorName,
    baseCreatorEmail,
    baseCreatorCollege,
    baseScheduleStatus: BASE_SCHEDULE_STATUS.PENDING,
    baseScheduleReadyAt: null,
    baseScheduleApprovedAt: null,
    
    // Participants
    participants: orderedParticipants,
    currentTurnUid: null, // Will be set when base is approved
    
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, session);
  return ref.id;
}

/**
 * Base creator marks schedule as ready for review
 */
export async function markBaseScheduleReady(sessionId) {
  const ref = sessionRef(sessionId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Session not found.');
  
  const session = snap.data();
  if (session.status !== SCHEDULE_SESSION_STATUS.BASE_CREATION) {
    throw new Error('Session is not in base creation phase.');
  }

  await updateDoc(ref, {
    baseScheduleStatus: BASE_SCHEDULE_STATUS.READY,
    baseScheduleReadyAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Registrar approves base schedule and starts adoption phase
 */
export async function approveBaseSchedule(sessionId) {
  const ref = sessionRef(sessionId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Session not found.');
  
  const session = snap.data();
  if (session.baseScheduleStatus !== BASE_SCHEDULE_STATUS.READY) {
    throw new Error('Base schedule is not ready for approval.');
  }

  const participants = [...(session.participants || [])];
  
  // Activate first participant
  if (participants.length > 0) {
    participants[0] = {
      ...participants[0],
      status: PARTICIPANT_STATUS.ACTIVE,
      canEdit: true,
      startedAt: new Date().toISOString(),
    };
  }

  await updateDoc(ref, {
    baseScheduleStatus: BASE_SCHEDULE_STATUS.APPROVED,
    baseScheduleApprovedAt: serverTimestamp(),
    status: SCHEDULE_SESSION_STATUS.ADOPTION_PHASE,
    participants,
    currentTurnUid: participants[0]?.uid || null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Participant marks they copied the base template
 */
export async function markBaseTemplateAdopted(sessionId, participantUid) {
  const ref = sessionRef(sessionId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Session not found.');
  
  const session = snap.data();
  const participants = [...(session.participants || [])];
  const idx = participants.findIndex((p) => p.uid === participantUid);
  
  if (idx < 0) throw new Error('Participant not found.');
  
  participants[idx] = {
    ...participants[idx],
    adoptedBaseTemplate: true,
  };

  await updateDoc(ref, {
    participants,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Participant completes their schedule
 */
export async function completeParticipantSchedule(sessionId, participantUid) {
  const ref = sessionRef(sessionId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Session not found.');
  
  const session = snap.data();
  const participants = [...(session.participants || [])];
  const idx = participants.findIndex((p) => p.uid === participantUid);
  
  if (idx < 0) throw new Error('Participant not found.');
  if (participants[idx].status !== PARTICIPANT_STATUS.ACTIVE) {
    throw new Error('It is not your turn.');
  }

  // Mark current participant as completed
  participants[idx] = {
    ...participants[idx],
    status: PARTICIPANT_STATUS.COMPLETED,
    canEdit: false,
    completedAt: new Date().toISOString(),
  };

  // Find next participant
  const nextIdx = participants.findIndex(
    (p, i) => i > idx && p.status === PARTICIPANT_STATUS.WAITING
  );

  let updates = {
    participants,
    updatedAt: serverTimestamp(),
  };

  if (nextIdx >= 0) {
    // Activate next participant
    participants[nextIdx] = {
      ...participants[nextIdx],
      status: PARTICIPANT_STATUS.ACTIVE,
      canEdit: true,
      startedAt: new Date().toISOString(),
    };
    updates.currentTurnUid = participants[nextIdx].uid;
  } else {
    // All participants completed
    updates.status = SCHEDULE_SESSION_STATUS.COMPLETED;
    updates.currentTurnUid = null;
  }

  await updateDoc(ref, updates);
}

/**
 * Registrar skips a participant and moves to next
 */
export async function skipParticipant(sessionId, participantUid) {
  const ref = sessionRef(sessionId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Session not found.');
  
  const session = snap.data();
  const participants = [...(session.participants || [])];
  const idx = participants.findIndex((p) => p.uid === participantUid);
  
  if (idx < 0) throw new Error('Participant not found.');

  // Mark as skipped
  participants[idx] = {
    ...participants[idx],
    status: PARTICIPANT_STATUS.SKIPPED,
    canEdit: false,
  };

  // Find next participant
  const nextIdx = participants.findIndex(
    (p, i) => i > idx && p.status === PARTICIPANT_STATUS.WAITING
  );

  let updates = {
    participants,
    updatedAt: serverTimestamp(),
  };

  if (nextIdx >= 0) {
    participants[nextIdx] = {
      ...participants[nextIdx],
      status: PARTICIPANT_STATUS.ACTIVE,
      canEdit: true,
      startedAt: new Date().toISOString(),
    };
    updates.currentTurnUid = participants[nextIdx].uid;
  } else {
    updates.status = SCHEDULE_SESSION_STATUS.COMPLETED;
    updates.currentTurnUid = null;
  }

  await updateDoc(ref, updates);
}

/**
 * Registrar manually activates a specific participant
 */
export async function activateParticipant(sessionId, participantUid) {
  const ref = sessionRef(sessionId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Session not found.');
  
  const session = snap.data();
  const participants = [...(session.participants || [])];
  const idx = participants.findIndex((p) => p.uid === participantUid);
  
  if (idx < 0) throw new Error('Participant not found.');

  participants[idx] = {
    ...participants[idx],
    status: PARTICIPANT_STATUS.ACTIVE,
    canEdit: true,
    startedAt: new Date().toISOString(),
  };

  await updateDoc(ref, {
    participants,
    currentTurnUid: participantUid,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a schedule session
 */
export async function deleteScheduleSession(sessionId) {
  await deleteDoc(sessionRef(sessionId));
}

/**
 * Update session status
 */
export async function updateSessionStatus(sessionId, status) {
  await updateDoc(sessionRef(sessionId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Copy base template schedule to a dean's section
 * This reads all entries from base creator and copies them to target dean/section
 */
export async function copyBaseScheduleToSection({
  sessionId,
  baseCreatorUid,
  targetDeanUid,
  targetSection,
  semester,
}) {
  // Get all schedule entries from base creator
  const baseScheduleRef = collection(
    db,
    COLLECTIONS.USERS,
    baseCreatorUid,
    'course_schedules',
    'BASE_TEMPLATE', // Base creator uses a special section name
    'entries'
  );

  const baseEntriesSnap = await getDocs(baseScheduleRef);
  const baseEntries = baseEntriesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  if (baseEntries.length === 0) {
    throw new Error('No base template entries found to copy.');
  }

  // Copy each entry to target dean's section
  const targetScheduleRef = collection(
    db,
    COLLECTIONS.USERS,
    targetDeanUid,
    'course_schedules',
    targetSection,
    'entries'
  );

  const copyPromises = baseEntries.map((entry) => {
    const newEntryRef = doc(targetScheduleRef);
    const newEntry = {
      ...entry,
      // Update metadata
      copiedFromTemplate: true,
      templateCreatorUid: baseCreatorUid,
      scheduleControlSessionId: sessionId,
      section: targetSection,
      deanUid: targetDeanUid,
      // Remove base template marker
      isBaseTemplate: false,
      // Keep original timestamps, add copy timestamp
      copiedAt: serverTimestamp(),
    };
    // Remove Firestore-generated fields
    delete newEntry.id;
    delete newEntry.createdAt;
    delete newEntry.updatedAt;

    return setDoc(newEntryRef, {
      ...newEntry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await Promise.all(copyPromises);
  
  return baseEntries.length;
}

/**
 * Get session by ID
 */
export async function getScheduleSession(sessionId) {
  const snap = await getDoc(sessionRef(sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

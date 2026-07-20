import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { COLLECTIONS } from '../firebase/constants';
import {
  PLOT_REQUEST_STATUS,
  RECIPIENT_PLOT_STATUS,
  collegeTierFromValue,
  collegePriorityFromValue,
  sortRecipientsByPlotOrder,
} from '../constants/plotScheduling';
import {
  SCHEDULE_START_HOUR,
  SCHEDULE_END_HOUR,
  hourToTimeInput as gridHourToTimeInput,
  clampScheduleHours,
} from '../constants/scheduleGrid';

function plotRef(id) {
  return doc(db, COLLECTIONS.SCHEDULE_PLOT_REQUESTS, id);
}

function entriesRef(plotId) {
  return collection(db, COLLECTIONS.SCHEDULE_PLOT_REQUESTS, plotId, COLLECTIONS.SCHEDULE_ENTRIES);
}

export function subscribePlotRequests(onData, onError) {
  const q = query(collection(db, COLLECTIONS.SCHEDULE_PLOT_REQUESTS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError,
  );
}

function sortPlotsByCreatedAt(plots) {
  return [...plots].sort((a, b) => {
    const ta = a.createdAt?.seconds ?? a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.seconds ?? b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

function mapPlotDocs(docs) {
  return docs.map((d) => ({ id: d.id, ...d.data() }));
}

function normalizePlotEmail(email) {
  return (email || '').trim().toLowerCase() || null;
}

/** Dean view — scoped queries only (Firestore rejects full-collection reads for non-registrars). */
export function subscribePlotRequestsForUser(userId, userEmail, onData, onError) {
  const authEmail = (userEmail || '').trim();
  const col = collection(db, COLLECTIONS.SCHEDULE_PLOT_REQUESTS);

  if (!userId && !authEmail) {
    onData([]);
    return () => {};
  }

  const uidResults = userId ? { docs: null } : { docs: [] };
  const emailResults = !userId && authEmail ? { docs: null } : { docs: [] };

  const mergeAndEmit = () => {
    if (userId && uidResults.docs === null) return;
    if (!userId && authEmail && emailResults.docs === null) return;

    const byId = new Map();
    [...mapPlotDocs(uidResults.docs || []), ...mapPlotDocs(emailResults.docs || [])].forEach((plot) => {
      byId.set(plot.id, plot);
    });
    onData(sortPlotsByCreatedAt(Array.from(byId.values())));
  };

  const unsubs = [];

  if (userId) {
    const qUid = query(
      col,
      where('recipientUids', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
    );
    unsubs.push(onSnapshot(
      qUid,
      (snap) => {
        uidResults.docs = snap.docs;
        mergeAndEmit();
      },
      onError,
    ));
  } else if (authEmail) {
    const qEmail = query(
      col,
      where('recipientEmails', 'array-contains', authEmail),
      orderBy('createdAt', 'desc'),
    );
    unsubs.push(onSnapshot(
      qEmail,
      (snap) => {
        emailResults.docs = snap.docs;
        mergeAndEmit();
      },
      onError,
    ));
  }

  return () => unsubs.forEach((unsub) => unsub());
}

export function subscribePlotEntries(plotId, onData, onError) {
  if (!plotId) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    entriesRef(plotId),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

function buildRecipientRecord(raw, plotOrder) {
  const college = raw.college || raw.department || '';
  const tier = collegeTierFromValue(college);
  const priority = collegePriorityFromValue(college);
  return {
    id: raw.id || `rcp_${Date.now()}_${plotOrder}`,
    assignType: raw.assignType,
    uid: raw.uid || null,
    email: normalizePlotEmail(raw.email),
    name: raw.name || '',
    college,
    deanTier: tier,
    priority,
    plotOrder,
    status: plotOrder === 0 ? RECIPIENT_PLOT_STATUS.ACTIVE : RECIPIENT_PLOT_STATUS.WAITING,
  };
}

export function buildRecipientsFromSelection(selectedRecipients) {
  const mapped = selectedRecipients.map((r, idx) => buildRecipientRecord(r, idx));
  return sortRecipientsByPlotOrder(mapped).map((r, idx) => ({
    ...r,
    plotOrder: idx,
    status: idx === 0 ? RECIPIENT_PLOT_STATUS.ACTIVE : RECIPIENT_PLOT_STATUS.WAITING,
  }));
}

export async function createAndSendPlotRequest({
  title,
  notes,
  schoolYearId,
  schoolYearLabel,
  semester,
  restrictRooms,
  assignedRooms,
  recipients,
  createdBy,
}) {
  if (!title?.trim()) throw new Error('Title is required.');
  if (!schoolYearId) throw new Error('School year is required.');
  if (!recipients?.length) throw new Error('Select at least one recipient.');

  const orderedRecipients = buildRecipientsFromSelection(recipients);
  const ref = doc(collection(db, COLLECTIONS.SCHEDULE_PLOT_REQUESTS));

  const recipientUids = orderedRecipients.map((r) => r.uid).filter(Boolean);
  const recipientEmails = orderedRecipients.map((r) => r.email).filter(Boolean);

  await setDoc(ref, {
    title: title.trim(),
    notes: (notes || '').trim(),
    schoolYearId,
    schoolYearLabel: schoolYearLabel || '',
    semester: Number(semester) || 1,
    restrictRooms: Boolean(restrictRooms),
    assignedRooms: restrictRooms ? (assignedRooms || []) : [],
    recipients: orderedRecipients,
    recipientUids,
    recipientEmails,
    currentTurnRecipientId: orderedRecipients[0]?.id || null,
    activeRecipientUid: orderedRecipients[0]?.uid || null,
    activeRecipientEmail: orderedRecipients[0]?.email || null,
    status: PLOT_REQUEST_STATUS.SENT,
    createdBy: createdBy || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function deletePlotRequest(plotId) {
  await deleteDoc(plotRef(plotId));
}

export async function addPlotEntry(plotId, entry) {
  const ref = doc(entriesRef(plotId));
  await setDoc(ref, {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlotEntry(plotId, entryId, patch) {
  await updateDoc(doc(entriesRef(plotId), entryId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePlotEntry(plotId, entryId) {
  await deleteDoc(doc(entriesRef(plotId), entryId));
}

function findRecipientIndex(recipients, profile) {
  const profileUid = profile?.uid;
  const profileEmail = normalizePlotEmail(profile?.email);
  return recipients.findIndex(
    (r) => (profileUid && r.uid === profileUid)
      || (profileEmail && normalizePlotEmail(r.email) === profileEmail),
  );
}

/** Dean marks their plotting turn complete and passes to the next college dean (or finishes the request). */
export async function completePlotTurn(plotId, profile) {
  const snap = await getDoc(plotRef(plotId));
  if (!snap.exists()) throw new Error('Plot schedule not found.');

  const plot = snap.data();
  const recipients = [...(plot.recipients || [])];
  const myIdx = findRecipientIndex(recipients, profile);
  if (myIdx < 0) throw new Error('You are not assigned to this plot schedule.');

  const me = recipients[myIdx];
  if (me.status !== RECIPIENT_PLOT_STATUS.ACTIVE) {
    throw new Error('It is not your turn to submit yet.');
  }

  recipients[myIdx] = { ...me, status: RECIPIENT_PLOT_STATUS.COMPLETED };
  const nextIdx = recipients.findIndex(
    (r, idx) => idx > myIdx && r.status !== RECIPIENT_PLOT_STATUS.COMPLETED,
  );

  const patch = {
    recipients,
    updatedAt: serverTimestamp(),
  };

  if (nextIdx >= 0) {
    recipients[nextIdx] = { ...recipients[nextIdx], status: RECIPIENT_PLOT_STATUS.ACTIVE };
    const next = recipients[nextIdx];
    patch.currentTurnRecipientId = next.id;
    patch.activeRecipientUid = next.uid || null;
    patch.activeRecipientEmail = next.email || null;
    patch.status = PLOT_REQUEST_STATUS.IN_PROGRESS;
  } else {
    patch.currentTurnRecipientId = null;
    patch.activeRecipientUid = null;
    patch.activeRecipientEmail = null;
    patch.status = PLOT_REQUEST_STATUS.COMPLETED;
  }

  await updateDoc(plotRef(plotId), patch);
}

export function entriesToGridBlocks(entries, weekDates = []) {
  console.log('entriesToGridBlocks called with entries:', entries.length, 'weekDates:', weekDates);
  
  // Helper function to extract first name from full name
  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  };
  
  const blocks = (entries || [])
    .filter((e) => {
      // For regular schedule (weekday-0, weekday-1, etc.), we don't filter by date
      // because entries use day names like "Monday" not "weekday-0"
      // Instead, we rely on the day index being valid (0-6)
      if (!weekDates.length) return true;
      
      // For exam schedule or when we have actual dates, check if date matches
      const isWeekdayFormat = weekDates[0]?.startsWith('weekday-');
      if (isWeekdayFormat) {
        // Regular schedule: don't filter by date, let day index handle it
        return true;
      }
      
      // Exam schedule: filter by actual dates
      return weekDates.includes(e.date);
    })
    .map((e) => {
      const dayIndex = weekDates.length ? weekDates.indexOf(e.date) : (e.day ?? 0);
      return {
        id: e.id,
        date: e.date,
        day: dayIndex >= 0 ? dayIndex : e.day,
        title: e.title || e.subject || 'Untitled',
        course: e.courseCode || e.course || '',
        instructor: getFirstName(e.instructor || ''), // Extract first name only
        start: e.startHour,
        end: e.endHour,
        type: e.type || 'Lecture',
        roomCode: e.roomCode || '',
        scheduleMode: e.scheduleMode || 'regular',
      };
    })
    .filter((e) => e.day >= 0 && e.day <= 6); // Only include valid days (0-6)
  
  console.log('entriesToGridBlocks result:', blocks.length, 'blocks');
  return blocks;
}

export function parseTimeToHour(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h + (m || 0) / 60;
}

export function hourToTimeInput(hour) {
  return gridHourToTimeInput(hour);
}

export function validateScheduleHours(startHour, endHour) {
  if (startHour == null || endHour == null) {
    return { valid: false, message: 'Enter a valid start and end time.' };
  }
  if (startHour < SCHEDULE_START_HOUR || endHour > SCHEDULE_END_HOUR) {
    return { valid: false, message: `Schedule must be between ${gridHourToTimeInput(SCHEDULE_START_HOUR)} and ${gridHourToTimeInput(SCHEDULE_END_HOUR)}.` };
  }
  if (endHour <= startHour) {
    return { valid: false, message: 'End time must be after start time.' };
  }
  const clamped = clampScheduleHours(startHour, endHour);
  return { valid: true, startHour: clamped.start, endHour: clamped.end };
}

/**
 * NEW FUNCTIONS FOR PER-DEAN, PER-SECTION COURSE SCHEDULING
 */

// Collection path for dean's section schedules
function deanSectionEntriesRef(deanUid, section) {
  return collection(
    db, 
    COLLECTIONS.USERS, 
    deanUid, 
    'course_schedules', 
    section, 
    'entries'
  );
}

/**
 * Subscribe to plot entries for a specific dean and section
 * For regular schedule: returns all entries regardless of semester (weekly basis)
 * For exam schedule: filters by semester, scheduleMode, and optionally examPeriod
 */
export function subscribePlotEntriesForDeanSection(deanUid, section, semester, scheduleMode, examPeriod, onData, onError) {
  if (!deanUid || !section) {
    onData([]);
    return () => {};
  }

  console.log('subscribePlotEntriesForDeanSection called with:', {
    deanUid,
    section,
    semester,
    scheduleMode,
    examPeriod
  });

  let q;
  
  if (scheduleMode === 'exam') {
    // Exam schedule: filter by semester, scheduleMode, and examPeriod
    if (examPeriod) {
      q = query(
        deanSectionEntriesRef(deanUid, section),
        where('semester', '==', Number(semester)),
        where('scheduleMode', '==', 'exam'),
        where('examPeriod', '==', examPeriod),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        deanSectionEntriesRef(deanUid, section),
        where('semester', '==', Number(semester)),
        where('scheduleMode', '==', 'exam'),
        orderBy('createdAt', 'desc')
      );
    }
  } else {
    // Regular schedule: get all entries with scheduleMode 'regular' OR no scheduleMode field
    // Since we can't use OR queries easily, we'll get all entries and filter in memory
    q = query(
      deanSectionEntriesRef(deanUid, section),
      orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(
    q,
    (snap) => {
      const allEntries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      console.log('Raw entries from Firestore:', allEntries);
      
      // For regular schedule, filter to only include regular entries
      let filteredEntries = allEntries;
      if (scheduleMode === 'regular') {
        filteredEntries = allEntries.filter(entry => 
          !entry.scheduleMode || entry.scheduleMode === 'regular'
        );
      }
      
      console.log('Filtered entries:', filteredEntries);
      onData(filteredEntries);
    },
    (err) => {
      console.error('Error in subscribePlotEntriesForDeanSection:', err);
      onError(err);
    }
  );
}

/**
 * Add a plot entry for a specific dean and section
 */
export async function addPlotEntryForSection(deanUid, section, entry) {
  const ref = doc(deanSectionEntriesRef(deanUid, section));
  await setDoc(ref, {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Update a plot entry for a specific dean and section
 */
export async function updatePlotEntryForSection(deanUid, section, entryId, patch) {
  const ref = doc(deanSectionEntriesRef(deanUid, section), entryId);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a plot entry for a specific dean and section
 */
export async function deletePlotEntryForSection(deanUid, section, entryId) {
  const ref = doc(deanSectionEntriesRef(deanUid, section), entryId);
  await deleteDoc(ref);
}

/**
 * Get all sections for a specific dean
 */
export async function getDeanSections(deanUid) {
  if (!deanUid) return [];
  
  try {
    const schedulesRef = collection(db, COLLECTIONS.USERS, deanUid, 'course_schedules');
    const snapshot = await getDocs(schedulesRef);
    
    // Get unique sections (collection IDs)
    const sections = snapshot.docs.map(doc => doc.id);
    return sections.sort(); // Sort alphabetically
  } catch (error) {
    console.error('Error fetching dean sections:', error);
    return [];
  }
}

/**
 * Subscribe to sections for a specific dean
 * Returns section objects with metadata (name, yearLevel)
 */
export function subscribeDeanSections(deanUid, onData, onError) {
  if (!deanUid) {
    onData([]);
    return () => {};
  }

  const schedulesRef = collection(db, COLLECTIONS.USERS, deanUid, 'course_schedules');
  
  return onSnapshot(
    schedulesRef,
    (snapshot) => {
      const sections = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.id, // Section name is the document ID
        ...doc.data(), // Includes yearLevel, createdAt, etc.
      }));
      // Sort by year level first, then by name
      sections.sort((a, b) => {
        const yearA = a.yearLevel || '';
        const yearB = b.yearLevel || '';
        if (yearA !== yearB) {
          return yearA.localeCompare(yearB);
        }
        return a.name.localeCompare(b.name);
      });
      onData(sections);
    },
    onError
  );
}

/**
 * Create a new section for a dean
 */
export async function createDeanSection(deanUid, sectionName, yearLevel) {
  if (!deanUid || !sectionName) {
    throw new Error('Dean UID and section name are required.');
  }

  // Create the section document directly in course_schedules
  const sectionRef = doc(db, COLLECTIONS.USERS, deanUid, 'course_schedules', sectionName);
  
  await setDoc(sectionRef, {
    sectionName,
    yearLevel: yearLevel || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return sectionName;
}

/**
 * Delete a section for a dean (and all its entries)
 */
export async function deleteDeanSection(deanUid, sectionName) {
  if (!deanUid || !sectionName) {
    throw new Error('Dean UID and section name are required.');
  }

  // Get all entries in this section
  const entriesRef = deanSectionEntriesRef(deanUid, sectionName);
  const snapshot = await getDocs(entriesRef);

  // Delete all entries
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);

  // Delete the section document itself
  const sectionRef = doc(db, COLLECTIONS.USERS, deanUid, 'course_schedules', sectionName);
  await deleteDoc(sectionRef);
}

/**
 * Subscribe to all plot entries for a specific room code
 * Used by RoomScheduleViewer to show room availability
 * 
 * NOTE: This currently only shows schedules from the CURRENT dean's sections.
 * For a full implementation across all deans, consider:
 * - Creating a separate room_schedules collection
 * - Using Cloud Functions to aggregate room schedules
 * - Or implementing a more complex multi-user query
 */
export function subscribePlotEntriesForRoom(roomCode, semester, scheduleMode, deanUid, onData, onError) {
  if (!roomCode || !deanUid) {
    onData([]);
    return () => {};
  }

  console.log('subscribePlotEntriesForRoom called with:', {
    roomCode,
    semester,
    scheduleMode,
    deanUid
  });

  // Query the current dean's schedules across all sections
  // This is a simplified version - in production you'd want to aggregate across all deans
  const userRef = doc(db, COLLECTIONS.USERS, deanUid);
  const schedulesColl = collection(userRef, 'course_schedules');

  // We need to query all sections for this dean to find entries with this room
  // Since we can't query subcollections directly, we'll need to aggregate in the client
  
  const unsubscribers = [];
  const sectionData = new Map(); // Track entries from each section

  // First, get all sections for this dean
  getDocs(schedulesColl).then(sectionsSnapshot => {
    console.log(`Found ${sectionsSnapshot.docs.length} sections for dean`);
    
    sectionsSnapshot.docs.forEach(sectionDoc => {
      const sectionName = sectionDoc.id;
      const entriesRef = collection(userRef, 'course_schedules', sectionName, 'entries');
      
      // Subscribe to entries in this section that match the room
      const q = query(
        entriesRef,
        where('roomCode', '==', roomCode),
        where('scheduleMode', '==', scheduleMode)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          console.log(`Section ${sectionName} has ${entries.length} entries for room ${roomCode}`);
          
          // Store entries from this section
          sectionData.set(sectionName, entries);
          
          // Aggregate all entries from all sections
          const allEntries = Array.from(sectionData.values()).flat();
          console.log(`Total entries for room ${roomCode}: ${allEntries.length}`);
          onData(allEntries);
        },
        (err) => {
          console.error(`Error subscribing to section ${sectionName}:`, err);
          if (onError) onError(err);
        }
      );
      
      unsubscribers.push(unsubscribe);
    });
  }).catch(err => {
    console.error('Error getting sections:', err);
    if (onError) onError(err);
  });

  // Return a function that unsubscribes from all sections
  return () => {
    console.log('Unsubscribing from all room schedule listeners');
    unsubscribers.forEach(unsub => unsub());
  };
}

/**
 * Subscribe to all plot entries for a specific teacher across all sections
 * Used for displaying teacher's personal schedule view
 * @param {string} teacherName - Full name of the teacher
 * @param {string} semester - Semester number ('1' or '2')
 * @param {function} onData - Callback with array of entries
 * @param {function} onError - Error callback
 * @returns {function} Unsubscribe function
 */
export function subscribePlotEntriesForTeacher(teacherName, semester, onData, onError) {
  if (!teacherName) {
    console.warn('subscribePlotEntriesForTeacher: teacherName is required');
    onData([]);
    return () => {};
  }

  console.log('subscribePlotEntriesForTeacher called with:', { teacherName, semester });

  // Query all entries where instructor matches the teacher name
  // This searches across all deans' sections
  const entriesRef = collectionGroup(db, 'entries');
  
  // Simplified query - only filter by instructor to avoid needing composite index
  const q = query(
    entriesRef,
    where('instructor', '==', teacherName)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      let entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('subscribePlotEntriesForTeacher: raw entries', entries.length);
      
      // Filter by scheduleMode and semester in memory
      entries = entries.filter(e => {
        const isRegular = !e.scheduleMode || e.scheduleMode === 'regular';
        const matchesSemester = !semester || !e.semester || e.semester === semester || e.semester === Number(semester);
        return isRegular && matchesSemester;
      });

      // Sort by date and time in memory
      entries.sort((a, b) => {
        // Sort by day first (Monday=0, Tuesday=1, etc.)
        const dayA = a.day ?? 0;
        const dayB = b.day ?? 0;
        if (dayA !== dayB) return dayA - dayB;
        
        // Then by start hour
        const hourA = a.startHour ?? 0;
        const hourB = b.startHour ?? 0;
        return hourA - hourB;
      });

      console.log('subscribePlotEntriesForTeacher: filtered/sorted', entries.length, 'entries');
      onData(entries);
    },
    (err) => {
      console.error('subscribePlotEntriesForTeacher error:', err);
      if (onError) onError(err);
    }
  );
}

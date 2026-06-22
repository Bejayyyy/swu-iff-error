import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { COLLECTIONS } from '../firebase/constants';
import { EMPTY_EXAM_PERIODS } from '../utils/academicCalendarUtils';

function schoolYearRef(id) {
  return doc(db, COLLECTIONS.ACADEMIC_CALENDARS, id);
}

function holidaysRef(schoolYearId) {
  return collection(db, COLLECTIONS.ACADEMIC_CALENDARS, schoolYearId, COLLECTIONS.HOLIDAYS);
}

function noClassRef(schoolYearId) {
  return collection(db, COLLECTIONS.ACADEMIC_CALENDARS, schoolYearId, COLLECTIONS.NO_CLASS_PERIODS);
}

export function buildSchoolYearId(label) {
  return `sy_${(label || '').replace(/\s+/g, '_').toLowerCase()}`;
}

export function subscribeSchoolYears(onData, onError) {
  const q = query(collection(db, COLLECTIONS.ACADEMIC_CALENDARS), orderBy('label'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    },
    onError,
  );
}

export function subscribeCalendarBundle(schoolYearId, onData, onError) {
  if (!schoolYearId) {
    onData({ config: null, holidays: [], noClassPeriods: [] });
    return () => {};
  }

  let config = null;
  let holidays = [];
  let noClassPeriods = [];

  const emit = () => onData({ config, holidays, noClassPeriods });

  const unsubConfig = onSnapshot(
    schoolYearRef(schoolYearId),
    (snap) => {
      config = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      emit();
    },
    onError,
  );

  const unsubHolidays = onSnapshot(
    query(holidaysRef(schoolYearId), orderBy('date')),
    (snap) => {
      holidays = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    onError,
  );

  const unsubNoClass = onSnapshot(
    query(noClassRef(schoolYearId), orderBy('start')),
    (snap) => {
      noClassPeriods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      emit();
    },
    onError,
  );

  return () => {
    unsubConfig();
    unsubHolidays();
    unsubNoClass();
  };
}

export async function saveSchoolYearConfig(schoolYearId, {
  label,
  semester1Start,
  semester1End,
  semester2Start,
  semester2End,
}) {
  const displayLabel = label.startsWith('SY ') ? label : `SY ${label}`;
  await setDoc(
    schoolYearRef(schoolYearId),
    {
      label,
      displayLabel,
      semester1Start,
      semester1End,
      semester2Start,
      semester2End,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  const snap = await getDoc(schoolYearRef(schoolYearId));
  if (!snap.data()?.examPeriods) {
    await updateDoc(schoolYearRef(schoolYearId), { examPeriods: EMPTY_EXAM_PERIODS });
  }
}

export async function addHoliday(schoolYearId, { date, name, desc }) {
  const ref = doc(holidaysRef(schoolYearId));
  await setDoc(ref, {
    date,
    name: name.trim(),
    desc: (desc || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteHoliday(schoolYearId, holidayId) {
  await deleteDoc(doc(holidaysRef(schoolYearId), holidayId));
}

export async function addNoClassPeriod(schoolYearId, { start, end, reason, desc }) {
  const ref = doc(noClassRef(schoolYearId));
  await setDoc(ref, {
    start,
    end,
    reason: reason.trim(),
    desc: (desc || '').trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteNoClassPeriod(schoolYearId, periodId) {
  await deleteDoc(doc(noClassRef(schoolYearId), periodId));
}

export async function saveExamPeriodRange(schoolYearId, semester, periodKey, level, start, end) {
  const ref = schoolYearRef(schoolYearId);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().examPeriods || EMPTY_EXAM_PERIODS : EMPTY_EXAM_PERIODS;
  const semKey = String(semester);
  const updated = {
    ...existing,
    [semKey]: {
      ...(existing[semKey] || EMPTY_EXAM_PERIODS[semKey]),
      [periodKey]: {
        ...(existing[semKey]?.[periodKey] || EMPTY_EXAM_PERIODS[semKey][periodKey]),
        [level]: { start, end },
      },
    },
  };
  await updateDoc(ref, { examPeriods: updated, updatedAt: serverTimestamp() });
}

import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COURSES_COLLECTION = 'courses';

/**
 * Subscribe to courses for a specific college
 */
export function subscribeCollegeCourses(collegeCode, onData, onError) {
  if (!collegeCode) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, COURSES_COLLECTION),
    where('collegeCode', '==', collegeCode),
    orderBy('yearLevel', 'asc'),
    orderBy('code', 'asc')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      onData(courses);
    },
    onError
  );
}

/**
 * Subscribe to all courses (for Registrar)
 */
export function subscribeAllCourses(onData, onError) {
  const q = query(
    collection(db, COURSES_COLLECTION),
    orderBy('collegeCode', 'asc'),
    orderBy('yearLevel', 'asc'),
    orderBy('code', 'asc')
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      onData(courses);
    },
    onError
  );
}

/**
 * Add a new course
 */
export async function addCourse(courseData) {
  const docRef = await addDoc(collection(db, COURSES_COLLECTION), {
    ...courseData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing course
 */
export async function updateCourse(courseId, updates) {
  const docRef = doc(db, COURSES_COLLECTION, courseId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a course
 */
export async function deleteCourse(courseId) {
  const docRef = doc(db, COURSES_COLLECTION, courseId);
  await deleteDoc(docRef);
}

/**
 * Assign a teacher to a course
 */
export async function assignTeacherToCourse(courseId, teacherUid, teacherName, teacherEmail) {
  const docRef = doc(db, COURSES_COLLECTION, courseId);
  await updateDoc(docRef, {
    assignedTeacherUid: teacherUid,
    assignedTeacherName: teacherName,
    assignedTeacherEmail: teacherEmail,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Unassign a teacher from a course
 */
export async function unassignTeacherFromCourse(courseId) {
  const docRef = doc(db, COURSES_COLLECTION, courseId);
  await updateDoc(docRef, {
    assignedTeacherUid: null,
    assignedTeacherName: null,
    assignedTeacherEmail: null,
    updatedAt: serverTimestamp(),
  });
}

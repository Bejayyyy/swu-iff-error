import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COLLEGES_COLLECTION = 'colleges';

/**
 * Subscribe to colleges in real-time
 */
export function subscribeColleges(onData, onError) {
  const q = query(collection(db, COLLEGES_COLLECTION), orderBy('code', 'asc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const colleges = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      onData(colleges);
    },
    onError
  );
}

/**
 * Add a new college
 */
export async function addCollege(collegeData) {
  const docRef = await addDoc(collection(db, COLLEGES_COLLECTION), {
    ...collegeData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing college
 */
export async function updateCollege(collegeId, updates) {
  const docRef = doc(db, COLLEGES_COLLECTION, collegeId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a college
 */
export async function deleteCollege(collegeId) {
  const docRef = doc(db, COLLEGES_COLLECTION, collegeId);
  await deleteDoc(docRef);
}

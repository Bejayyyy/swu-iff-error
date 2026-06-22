import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { COLLECTIONS, ROLES, USER_STATUS } from '../firebase/constants';
import { getInitials, normalizeEmail, validateInstitutionalEmail } from '../firebase/authHelpers';
import { isDevSignupEnabled } from '../firebase/constants';

/**
 * Temporary bootstrap: creates Firebase Auth + Firestore users/{uid} with role developer.
 * Remove VITE_ALLOW_DEV_SIGNUP in production.
 */
export async function registerDeveloperAccount({ email, password, displayName, department = 'IT' }) {
  if (!isDevSignupEnabled()) {
    throw new Error('Developer self-registration is disabled.');
  }

  const validation = validateInstitutionalEmail(email);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  if (!displayName?.trim()) {
    throw new Error('Full name is required.');
  }

  const normalized = normalizeEmail(email);
  const credential = await createUserWithEmailAndPassword(auth, normalized, password);
  const { uid } = credential.user;

  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    throw new Error('Account already exists. Sign in instead.');
  }

  const profile = {
    email: normalized,
    displayName: displayName.trim(),
    role: ROLES.DEVELOPER,
    status: USER_STATUS.ACTIVE,
    permissions: [],
    department: (department || 'IT').trim(),
    phone: '',
    initials: getInitials(displayName, normalized),
    provisionalDeveloper: true,
    createdBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: null,
  };

  try {
    await setDoc(userRef, profile);
  } catch (err) {
    await deleteUser(credential.user);
    throw err;
  }

  return { uid, ...profile };
}

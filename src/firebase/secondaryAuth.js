import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from './firebase';

/**
 * Creates a Firebase Auth user without signing out the current Developer session.
 */
export async function createAuthUserWithEmail(email, password) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return credential.user;
  } finally {
    await deleteApp(secondaryApp);
  }
}

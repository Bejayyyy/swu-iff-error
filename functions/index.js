/**
 * Optional Cloud Functions (Firebase Admin SDK) for production:
 * - Delete Auth user when Developer removes a Registrar
 * - Create users without client secondary-app pattern
 *
 * Deploy: firebase deploy --only functions
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteRegistrarAuthUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required.');
  }

  const caller = await admin.firestore().doc(`users/${context.auth.uid}`).get();
  if (!caller.exists || caller.data().role !== 'developer' || caller.data().status !== 'active') {
    throw new functions.https.HttpsError('permission-denied', 'Developers only.');
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid is required.');
  }

  const target = await admin.firestore().doc(`users/${uid}`).get();
  if (!target.exists || target.data().role !== 'registrar') {
    throw new functions.https.HttpsError('failed-precondition', 'Target is not a registrar.');
  }

  await admin.auth().deleteUser(uid);
  await admin.firestore().doc(`users/${uid}`).delete();
  await admin.firestore().doc(`registrar_management/${uid}`).delete();

  return { success: true };
});

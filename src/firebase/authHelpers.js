import { INSTITUTIONAL_EMAIL_DOMAIN } from './constants';

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export function isInstitutionalEmail(email) {
  const normalized = normalizeEmail(email);
  return normalized.endsWith(`@${INSTITUTIONAL_EMAIL_DOMAIN}`);
}

export function validateInstitutionalEmail(email) {
  if (!normalizedEmailHasAt(email)) {
    return { valid: false, message: 'Email is required.' };
  }
  if (!isInstitutionalEmail(email)) {
    return {
      valid: false,
      message: `Only @${INSTITUTIONAL_EMAIL_DOMAIN} institutional emails are allowed.`,
    };
  }
  return { valid: true, message: '' };
}

function normalizedEmailHasAt(email) {
  return normalizeEmail(email).includes('@');
}

export function getInitials(displayName, email) {
  const source = (displayName || email || '').trim();
  if (!source) return '??';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function mapAuthError(error) {
  const code = typeof error === 'string' ? error : error?.code;
  const message = typeof error === 'object' ? error?.message : '';

  const messages = {
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found. Contact your Developer administrator.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-api-key': 'Firebase is misconfigured. Check your VITE_FIREBASE_* values in .env.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase API key is invalid. Check your .env file.',
    'permission-denied': 'Access denied loading your profile. Deploy updated Firestore rules or contact an administrator.',
  };

  if (code && messages[code]) return messages[code];
  if (message?.includes('not provisioned')) return message;
  if (message?.includes('inactive')) return message;
  if (message?.includes('do not have access')) return message;
  if (message?.includes('Missing Firebase env')) return message;
  if (message) return message;
  return 'Authentication failed. Please try again.';
}

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

export function mapAuthError(code) {
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
  };
  return messages[code] || 'Authentication failed. Please try again.';
}

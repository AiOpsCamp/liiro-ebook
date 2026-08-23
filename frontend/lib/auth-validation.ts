/**
 * Authentication Validation & Error Handling
 * Centralized validation rules and error message formatting
 */

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password requirements
 */
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate email format
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, strength: 'weak', errors: ['Password is required'] };
  }

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`At least ${PASSWORD_RULES.minLength} characters`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }

  if (PASSWORD_RULES.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('At least one number');
  }

  if (PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&*)');
  }

  // Calculate strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  const checksPass = [
    password.length >= PASSWORD_RULES.minLength,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  ].filter(Boolean).length;

  if (checksPass === 1) strength = 'weak';
  else if (checksPass === 2) strength = 'fair';
  else if (checksPass === 3) strength = 'good';
  else strength = 'strong';

  return {
    isValid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Validate username
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmedUsername.length > 20) {
    return { isValid: false, error: 'Username must be at most 20 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { isValid: true };
}

/**
 * Firebase / backend auth error codes → clean, safe, user-friendly copy.
 * Covers BOTH:
 *  - Firebase JS SDK codes ("auth/wrong-password")
 *  - Firebase Identity Toolkit REST codes forwarded by the backend
 *    ("EMAIL_EXISTS", "INVALID_LOGIN_CREDENTIALS", "EXPIRED_OOB_CODE", ...)
 *  - Our backend's own stable error codes ("trial_limit_exceeded", etc.)
 */
const AUTH_ERROR_MAP: Record<string, string> = {
  // ── Firebase JS SDK codes ─────────────────────────────────
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Please log in instead.',
  'auth/weak-password': 'Please choose a stronger password.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/credential-already-in-use': 'This account is already linked to another user.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/unauthorized-domain': 'Sign-in is not allowed from this domain.',
  'auth/requires-recent-login': 'Please log in again to continue.',
  'auth/expired-action-code': 'This reset link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This reset link is invalid or has already been used.',

  // ── Firebase Identity Toolkit REST codes (forwarded by backend) ──
  EMAIL_EXISTS: 'An account with this email already exists. Please log in instead.',
  EMAIL_NOT_FOUND: 'No account found with this email.',
  INVALID_PASSWORD: 'Incorrect email or password.',
  INVALID_LOGIN_CREDENTIALS: 'Incorrect email or password.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  USER_DISABLED: 'This account has been disabled. Please contact support.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many attempts. Please wait a few minutes and try again.',
  WEAK_PASSWORD: 'Please choose a stronger password (at least 8 characters).',
  OPERATION_NOT_ALLOWED: 'This sign-in method is not enabled. Please contact support.',
  EXPIRED_OOB_CODE: 'This reset link has expired. Please request a new one.',
  INVALID_OOB_CODE: 'This reset link is invalid or has already been used.',
  MISSING_PASSWORD: 'Please enter your password.',
  MISSING_EMAIL: 'Please enter your email address.',
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'Please log in again to continue.',

  // ── Our backend's own stable codes ──
  account_deleted: 'This account has been deleted.',
  account_suspended: 'This account has been suspended. Please contact support.',
  session_invalidated: 'Your session expired. Please log in again.',
  invalid_refresh_token: 'Your session expired. Please log in again.',
  trial_limit_exceeded: 'You have reached your daily limit. Please try again tomorrow.',
};

/** Pull every candidate string out of the many possible error shapes. */
function collectErrorSignals(error: any): { code?: string; message?: string; status?: number } {
  if (!error) return {};
  // RTK Query rejects with { status, data }, where data is the backend JSON body.
  const data = error?.data ?? error?.response?.data ?? undefined;
  const status =
    typeof error?.status === 'number'
      ? error.status
      : typeof error?.originalStatus === 'number'
        ? error.originalStatus
        : typeof error?.response?.status === 'number'
          ? error.response.status
          : undefined;

  const code =
    error?.code ??
    data?.code ??
    data?.error ?? // backend often puts a stable code in `error`
    undefined;

  const message =
    data?.message ??
    (typeof data?.error === 'string' ? data.error : undefined) ??
    error?.message ??
    undefined;

  return { code: code ? String(code) : undefined, message, status };
}

/**
 * Normalize ANY auth error (Firebase SDK, Firebase REST via backend, RTK Query,
 * axios, plain Error, HTTP status) into clean, safe, user-friendly copy.
 * NEVER returns a raw Firebase/backend technical string.
 */
export function getFriendlyErrorMessage(error: any): string {
  const { code, message, status } = collectErrorSignals(error);

  // 1. Exact code match (most reliable).
  if (code && AUTH_ERROR_MAP[code]) return AUTH_ERROR_MAP[code];

  // 2. Firebase REST error strings sometimes arrive with detail suffixes,
  //    e.g. "TOO_MANY_ATTEMPTS_TRY_LATER : ...". Match on a known prefix in the message.
  const haystack = `${code ?? ''} ${message ?? ''}`.toUpperCase();
  for (const key of Object.keys(AUTH_ERROR_MAP)) {
    if (key === key.toUpperCase() && key.length > 4 && haystack.includes(key)) {
      return AUTH_ERROR_MAP[key];
    }
  }

  // 3. Keyword heuristics on the message (last resort before generic).
  if (message) {
    const m = message.toLowerCase();
    if (m.includes('already exists') || m.includes('email_exists') || m.includes('already registered'))
      return 'An account with this email already exists. Please log in instead.';
    if (m.includes('no account') || m.includes('not found') || m.includes('email_not_found'))
      return 'No account found with this email.';
    if (m.includes('password') && (m.includes('incorrect') || m.includes('wrong') || m.includes('invalid')))
      return 'Incorrect email or password.';
    if (m.includes('network') || m.includes('connection') || m.includes('fetch'))
      return 'Network error. Please check your connection and try again.';
    if (m.includes('timeout')) return 'Request timed out. Please try again.';
    if (m.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.';
  }

  // 4. HTTP status fallback.
  if (status) {
    const statusErrors: Record<number, string> = {
      400: 'Please check your details and try again.',
      401: 'Incorrect email or password.',
      403: 'Access denied. Please contact support if this continues.',
      404: 'No account found with this email.',
      409: 'An account with this email already exists. Please log in instead.',
      422: 'Please check your details and try again.',
      429: 'Too many attempts. Please wait a few minutes and try again.',
      500: 'Something went wrong on our end. Please try again shortly.',
      502: 'Service temporarily unavailable. Please try again shortly.',
      503: 'Service temporarily unavailable. Please try again shortly.',
    };
    if (statusErrors[status]) return statusErrors[status];
    // FETCH_ERROR / network with no numeric status
  }
  if (error?.status === 'FETCH_ERROR' || error?.status === 'TIMEOUT_ERROR') {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Get password strength color and text
 */
export function getPasswordStrengthDisplay(strength: string): {
  color: string;
  text: string;
  percentage: number;
} {
  const strengthMap: Record<string, { color: string; text: string; percentage: number }> = {
    weak: { color: '#EF4444', text: 'Weak', percentage: 25 },
    fair: { color: '#F97316', text: 'Fair', percentage: 50 },
    good: { color: '#FBBF24', text: 'Good', percentage: 75 },
    strong: { color: '#10B981', text: 'Strong', percentage: 100 },
  };

  return strengthMap[strength] || strengthMap.weak;
}

/**
 * Get password strength requirements for display
 */
export function getPasswordRequirements(): {
  label: string;
  check: (password: string) => boolean;
}[] {
  return [
    {
      label: `At least ${PASSWORD_RULES.minLength} characters`,
      check: (pwd: string) => pwd.length >= PASSWORD_RULES.minLength,
    },
    {
      label: 'At least one uppercase letter (A-Z)',
      check: (pwd: string) => PASSWORD_RULES.requireUppercase ? /[A-Z]/.test(pwd) : true,
    },
    {
      label: 'At least one lowercase letter (a-z)',
      check: (pwd: string) => PASSWORD_RULES.requireLowercase ? /[a-z]/.test(pwd) : true,
    },
    {
      label: 'At least one number (0-9)',
      check: (pwd: string) => PASSWORD_RULES.requireNumbers ? /[0-9]/.test(pwd) : true,
    },
    {
      label: 'At least one special character (!@#$%^&*)',
      check: (pwd: string) =>
        PASSWORD_RULES.requireSpecialChars
          ? /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)
          : true,
    },
  ];
}

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  getFriendlyErrorMessage,
  getPasswordStrengthDisplay,
  getPasswordRequirements,
  PASSWORD_RULES,
};

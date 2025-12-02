/**
 * Unified password validation module
 * Provides consistent password policy across all authentication endpoints
 */

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSymbols: false,
};

// Common weak passwords to reject
const COMMON_WEAK_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty',
  'abc123',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
];

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Check uppercase requirement
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase requirement
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check number requirement
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check symbol requirement
  if (requirements.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }

  // Check for common weak passwords (only exact matches to avoid false positives)
  const lowerPassword = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.includes(lowerPassword)) {
    errors.push('Password is too common, please choose a different one');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get password requirements as a human-readable string
 */
export function getPasswordRequirementsText(
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string {
  const parts: string[] = [];
  
  parts.push(`At least ${requirements.minLength} characters`);
  
  if (requirements.requireUppercase) {
    parts.push('one uppercase letter');
  }
  
  if (requirements.requireLowercase) {
    parts.push('one lowercase letter');
  }
  
  if (requirements.requireNumbers) {
    parts.push('one number');
  }
  
  if (requirements.requireSymbols) {
    parts.push('one special character');
  }
  
  return `Password must contain: ${parts.join(', ')}`;
}

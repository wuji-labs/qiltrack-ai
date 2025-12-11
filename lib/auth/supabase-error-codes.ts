/**
 * Supabase Auth 官方错误代码
 * 参考: https://supabase.com/docs/guides/auth/error-codes
 */
export const SUPABASE_AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_grant',
  OTP_EXPIRED: 'otp_expired',
  RATE_LIMIT: 'over_request_rate_limit',
  EMAIL_EXISTS: 'email_address_already_exists',
  WEAK_PASSWORD: 'weak_password',
  INVALID_EMAIL: 'invalid_email',
  USER_NOT_FOUND: 'user_not_found',
  UNEXPECTED_FAILURE: 'unexpected_failure',
} as const;

export type SupabaseAuthErrorCode = typeof SUPABASE_AUTH_ERROR_CODES[keyof typeof SUPABASE_AUTH_ERROR_CODES];

/**
 * 映射 Supabase 错误代码到用户友好消息
 */
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case SUPABASE_AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return 'Invalid email or password';
    case SUPABASE_AUTH_ERROR_CODES.OTP_EXPIRED:
      return 'This link has expired. Please request a new one.';
    case SUPABASE_AUTH_ERROR_CODES.RATE_LIMIT:
      return 'Too many attempts. Please wait 60 seconds and try again.';
    case SUPABASE_AUTH_ERROR_CODES.EMAIL_EXISTS:
      return 'This email is already registered. Try signing in instead.';
    case SUPABASE_AUTH_ERROR_CODES.WEAK_PASSWORD:
      return 'Password must be at least 12 characters with uppercase, lowercase, number, and symbol.';
    case SUPABASE_AUTH_ERROR_CODES.INVALID_EMAIL:
      return 'Please enter a valid email address.';
    case SUPABASE_AUTH_ERROR_CODES.USER_NOT_FOUND:
      return 'No account found with this email.';
    case SUPABASE_AUTH_ERROR_CODES.UNEXPECTED_FAILURE:
      return 'Login is temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}

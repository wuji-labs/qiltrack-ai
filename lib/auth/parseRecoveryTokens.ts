/**
 * Parse Supabase password recovery tokens from URL query and hash parameters
 *
 * Supports multiple token formats:
 * - `code` (query or hash) → exchangeCodeForSession
 * - `token_hash` or `token` (query) → verifyOtp
 * - `access_token` + `refresh_token` (hash) → setSession
 */
export interface RecoveryTokens {
  code?: string;
  tokenHash?: string;
  accessToken?: string;
  refreshToken?: string;
}

export function parseRecoveryTokens(params: {
  searchParams: URLSearchParams;
  hash?: string;
}): RecoveryTokens {
  const { searchParams, hash = "" } = params;
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  return {
    code: searchParams.get("code") ?? hashParams.get("code") ?? undefined,
    tokenHash: searchParams.get("token_hash") ?? searchParams.get("token") ?? undefined,
    accessToken: hashParams.get("access_token") ?? undefined,
    refreshToken: hashParams.get("refresh_token") ?? undefined,
  };
}

/**
 * Check if recovery tokens are present (at least one valid token source)
 */
export function hasRecoveryTokens(tokens: RecoveryTokens): boolean {
  return !!(tokens.code || tokens.tokenHash || (tokens.accessToken && tokens.refreshToken));
}

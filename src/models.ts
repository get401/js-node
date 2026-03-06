/** Public key response from the get401 backend. */
export interface PublicKeyData {
  /** Base64-encoded Ed25519 public key. */
  publicKey: string
  /** Always `"EdDSA"`. */
  algorithm: string
  /** Unix timestamp after which the key must be re-fetched. */
  expiresAt: number
}

/** Verified and parsed claims from a get401 JWT access token. */
export interface TokenClaims {
  /** User's public ID — use this to uniquely identify the user. */
  sub: string
  /** Expiration Unix timestamp. */
  exp: number
  /** Issued-at Unix timestamp. */
  iat: number
  /** Token issuer. */
  iss: string
  /**
   * Roles granted to the user.
   * A fully authenticated user has `"USER"`. Intermediate auth-flow roles
   * include `"OTP_VERIFY"`, `"EMAIL_SETUP"`, and `"RECOVERY"`.
   */
  roles: string[]
  /** Comma-separated scope string (e.g. `"read,write"`). */
  scope: string
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

export const hasRole = (claims: TokenClaims, role: string): boolean =>
  claims.roles.includes(role)

export const hasAnyRole = (claims: TokenClaims, ...roles: string[]): boolean =>
  roles.some((r) => claims.roles.includes(r))

export const hasAllRoles = (claims: TokenClaims, ...roles: string[]): boolean =>
  roles.every((r) => claims.roles.includes(r))

export const isAuthenticatedUser = (claims: TokenClaims): boolean =>
  claims.roles.includes('USER')

// ---------------------------------------------------------------------------
// Scope helpers
// ---------------------------------------------------------------------------

export const getScopes = (claims: TokenClaims): string[] =>
  claims.scope
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const hasScope = (claims: TokenClaims, scope: string): boolean =>
  getScopes(claims).includes(scope)

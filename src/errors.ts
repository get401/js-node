export class Get401Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** The JWT `exp` claim is in the past. */
export class TokenExpiredError extends Get401Error {}

/** The token is malformed or its signature is invalid. */
export class InvalidTokenError extends Get401Error {}

/**
 * The token declares an algorithm other than EdDSA.
 *
 * Only EdDSA (Ed25519) is accepted. Tokens claiming `none`, `HS256`, `RS256`,
 * or any other algorithm are rejected immediately to prevent algorithm-substitution attacks.
 */
export class InvalidAlgorithmError extends Get401Error {}

/** The public key could not be retrieved from the get401 backend. */
export class PublicKeyFetchError extends Get401Error {}

/** The token does not carry the required roles or scope. */
export class InsufficientPermissionsError extends Get401Error {}

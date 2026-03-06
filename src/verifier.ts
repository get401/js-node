import { decodeProtectedHeader, errors as joseErrors, importSPKI, jwtVerify } from 'jose'
import type { KeyLike } from 'jose'

import type { Get401Client } from './client.js'
import {
  InvalidAlgorithmError,
  InvalidTokenError,
  TokenExpiredError,
} from './errors.js'
import type { TokenClaims } from './models.js'

const REQUIRED_ALGORITHM = 'EdDSA'

/**
 * Decode a base64 public key into a Web Crypto `CryptoKey` / jose `KeyLike`.
 *
 * Tries DER-encoded SubjectPublicKeyInfo first (the typical format returned by
 * the get401 backend), then falls back to a raw 32-byte Ed25519 key.
 */
async function loadPublicKey(publicKeyB64: string): Promise<KeyLike | CryptoKey> {
  const keyBytes = Buffer.from(publicKeyB64, 'base64')

  // Attempt 1 — DER SPKI → PEM → jose importSPKI
  try {
    const b64 = keyBytes.toString('base64')
    const pem = [
      '-----BEGIN PUBLIC KEY-----',
      ...(b64.match(/.{1,64}/g) ?? [b64]),
      '-----END PUBLIC KEY-----',
    ].join('\n')
    return await importSPKI(pem, 'EdDSA')
  } catch {
    // Fall through to raw-bytes path
  }

  // Attempt 2 — raw 32-byte Ed25519 key via SubtleCrypto
  return crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify'])
}

function parseClaims(payload: Record<string, unknown>): TokenClaims {
  return {
    sub: payload['sub'] as string,
    exp: payload['exp'] as number,
    iat: payload['iat'] as number,
    iss: (payload['iss'] as string) ?? '',
    roles: (payload['roles'] as string[]) ?? [],
    scope: (payload['scope'] as string) ?? '',
  }
}

/**
 * Verifies get401 JWT access tokens.
 *
 * Enforces EdDSA algorithm, validates the signature against the fetched public
 * key, and checks expiry before returning parsed {@link TokenClaims}.
 */
export class TokenVerifier {
  constructor(private readonly client: Get401Client) {}

  /**
   * Verify `token` and return its claims.
   *
   * @throws {InvalidAlgorithmError} Token does not declare `EdDSA`.
   * @throws {InvalidTokenError} Token is malformed or signature is invalid.
   * @throws {TokenExpiredError} Token `exp` claim is in the past.
   * @throws {PublicKeyFetchError} Public key could not be retrieved.
   */
  async verify(token: string): Promise<TokenClaims> {
    // Step 1 — reject any non-EdDSA algorithm before touching the network
    this.assertAlgorithm(token)

    // Step 2 — fetch (or return cached) public key
    const keyData = await this.client.getPublicKey()
    const publicKey = await loadPublicKey(keyData.publicKey)

    // Step 3 — verify signature and expiry
    try {
      const { payload } = await jwtVerify(token, publicKey as KeyLike, {
        algorithms: [REQUIRED_ALGORITHM],
      })
      return parseClaims(payload as Record<string, unknown>)
    } catch (error) {
      if (error instanceof joseErrors.JWTExpired) {
        throw new TokenExpiredError('Token has expired.')
      }
      throw new InvalidTokenError(`Token verification failed: ${error}`)
    }
  }

  private assertAlgorithm(token: string): void {
    let header: ReturnType<typeof decodeProtectedHeader>
    try {
      header = decodeProtectedHeader(token)
    } catch {
      throw new InvalidTokenError('Malformed token: could not decode header.')
    }

    if (header.alg !== REQUIRED_ALGORITHM) {
      throw new InvalidAlgorithmError(
        `Token algorithm '${header.alg}' is not allowed. ` +
          `Only '${REQUIRED_ALGORITHM}' (Ed25519) is accepted.`,
      )
    }
  }
}

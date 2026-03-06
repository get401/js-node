/**
 * @get401/node — Core Node.js SDK for get401 authentication.
 *
 * @example
 * ```ts
 * import { Get401Client, TokenVerifier } from '@get401/node'
 *
 * const client = new Get401Client({ appId: 'my-app', origin: 'https://myapp.com' })
 * const verifier = new TokenVerifier(client)
 *
 * const claims = await verifier.verify(token)
 * console.log(claims.sub)    // user public ID
 * console.log(claims.roles)  // ['USER']
 * ```
 */

export { Get401Client } from './client.js'
export type { Get401ClientOptions } from './client.js'

export { TokenVerifier } from './verifier.js'

export type { PublicKeyData, TokenClaims } from './models.js'
export {
  getScopes,
  hasAllRoles,
  hasAnyRole,
  hasRole,
  hasScope,
  isAuthenticatedUser,
} from './models.js'

export {
  Get401Error,
  InsufficientPermissionsError,
  InvalidAlgorithmError,
  InvalidTokenError,
  PublicKeyFetchError,
  TokenExpiredError,
} from './errors.js'

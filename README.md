# @get401/node

Core Node.js SDK for [get401](https://get401.com) authentication. Verifies EdDSA/Ed25519 JWTs, fetches and caches the public key, and parses token claims.

> **Backend only.** This library is designed for Node.js server environments (Express, Next.js route handlers, etc.), not browser code.
>
> Used directly by [`@get401/next`](../get401-next) and [`@get401/express`](../get401-express). You can also use it standalone in any Node.js application.

## Installation

```bash
npm install @get401/node
# or
pnpm add @get401/node
```

**Requires Node.js ≥ 18** (for native `fetch` and Web Crypto).

## Quick start

```ts
import { Get401Client, TokenVerifier } from '@get401/node'

const client = new Get401Client({
  appId: 'your-app-id',
  origin: 'https://yourapp.com',
})
const verifier = new TokenVerifier(client)

const claims = await verifier.verify(tokenString)

console.log(claims.sub)    // user public ID
console.log(claims.roles)  // ['USER']
console.log(claims.scope)  // 'read,write'
```

## Configuration

```ts
new Get401Client({
  appId: 'your-app-id',           // required — sent as X-App-Id header
  origin: 'https://yourapp.com',  // required — sent as Origin header
  host: 'https://app.get401.com', // optional — defaults to get401 cloud
})
```

## TokenClaims reference

| Field | Type | Description |
|-------|------|-------------|
| `sub` | `string` | User's public ID |
| `exp` | `number` | Expiration Unix timestamp |
| `iat` | `number` | Issued-at Unix timestamp |
| `iss` | `string` | Token issuer |
| `roles` | `string[]` | Roles granted — e.g. `['USER']` |
| `scope` | `string` | Comma-separated scope string |

### Helper functions

```ts
import {
  hasRole, hasAnyRole, hasAllRoles,
  hasScope, getScopes,
  isAuthenticatedUser,
} from '@get401/node'

hasRole(claims, 'USER')                  // boolean
hasAnyRole(claims, 'USER', 'ADMIN')      // boolean
hasAllRoles(claims, 'USER', 'PREMIUM')   // boolean

hasScope(claims, 'read')                 // boolean
getScopes(claims)                        // ['read', 'write']

isAuthenticatedUser(claims)              // true when roles includes 'USER'
```

## Error handling

All errors extend `Get401Error`.

| Error class | When thrown |
|-------------|-------------|
| `TokenExpiredError` | `exp` is in the past |
| `InvalidTokenError` | Malformed token or invalid signature |
| `InvalidAlgorithmError` | Token declares an algorithm other than `EdDSA` |
| `PublicKeyFetchError` | Could not reach the get401 backend |

```ts
import {
  TokenExpiredError,
  InvalidAlgorithmError,
  Get401Error,
} from '@get401/node'

try {
  const claims = await verifier.verify(token)
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // prompt re-login
  } else if (error instanceof Get401Error) {
    // catch-all for any get401 error
  }
}
```

## Public key caching

The client caches the public key automatically until the backend-provided `expiresAt` timestamp passes. Force a refresh when needed:

```ts
await client.getPublicKey({ forceRefresh: true })
```

import { PublicKeyFetchError } from './errors.js'
import type { PublicKeyData } from './models.js'

const DEFAULT_HOST = 'https://app.get401.com'

export interface Get401ClientOptions {
  /** Your application ID — sent as the `X-App-Id` request header. */
  appId: string
  /** Your application origin URL — sent as the `Origin` request header. */
  origin: string
  /** get401 API base URL. Defaults to `https://app.get401.com`. */
  host?: string
}

/**
 * Low-level HTTP client for the get401 backend.
 *
 * Handles public-key retrieval with automatic expiry-based caching.
 * You typically don't need to use this class directly — `TokenVerifier`
 * manages it for you.
 */
export class Get401Client {
  private readonly appId: string
  private readonly origin: string
  private readonly host: string
  private cachedKey: PublicKeyData | null = null

  constructor({ appId, origin, host = DEFAULT_HOST }: Get401ClientOptions) {
    this.appId = appId
    this.origin = origin
    this.host = host.replace(/\/$/, '')
  }

  private get requestHeaders(): Record<string, string> {
    return {
      'X-App-Id': this.appId,
      Origin: this.origin,
    }
  }

  private isCacheValid(): boolean {
    return this.cachedKey !== null && Date.now() / 1000 < this.cachedKey.expiresAt
  }

  private parseJson(json: Record<string, unknown>): PublicKeyData {
    return {
      publicKey: json['public_key'] as string,
      algorithm: json['algorithm'] as string,
      expiresAt: json['expires_at'] as number,
    }
  }

  /**
   * Return the current public key, fetching from the backend when the cache
   * has expired or does not exist yet.
   *
   * Pass `forceRefresh: true` to bypass the cache.
   */
  async getPublicKey(forceRefresh = false): Promise<PublicKeyData> {
    if (!forceRefresh && this.isCacheValid()) {
      return this.cachedKey!
    }

    let response: Response
    try {
      response = await fetch(`${this.host}/v1/apps/auth/public-key`, {
        headers: this.requestHeaders,
      })
    } catch (cause) {
      throw new PublicKeyFetchError(`Failed to reach get401 backend: ${cause}`)
    }

    if (!response.ok) {
      throw new PublicKeyFetchError(
        `Backend returned HTTP ${response.status} when fetching public key.`,
      )
    }

    const json = (await response.json()) as Record<string, unknown>
    const data = this.parseJson(json)
    this.cachedKey = data
    return data
  }
}

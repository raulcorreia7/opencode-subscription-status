import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SubscriptionClient } from '../../src/client.js'
import type { ProviderId, QuotaSnapshot } from '../../src/interfaces/types.js'

describe('SubscriptionClient Integration', () => {
  let client: SubscriptionClient

  beforeEach(() => {
    client = new SubscriptionClient({ cacheTtlMs: 1000 })
  })

  afterEach(() => {
    client.invalidateCache()
  })

  it('returns error snapshot for unavailable provider', async () => {
    const snapshot = await client.getStatus({
      providerId: 'chatgpt-codex' as ProviderId,
      skipCache: true,
    })

    expect(snapshot.provider).toBe('chatgpt-codex')
    expect(snapshot.error).toBeDefined()
    expect(['NO_AUTH', 'TOKEN_EXPIRED', 'NO_USAGE_DATA']).toContain(snapshot.error?.code)
  })

  it('caches snapshots', async () => {
    await client.getStatus({ providerId: 'chatgpt-codex' as ProviderId, skipCache: true })
    const cached = client.getStatus({ providerId: 'chatgpt-codex' as ProviderId })

    const snapshot = await cached
    expect(snapshot.error).toBeDefined()
  })

  it('invalidates cache', async () => {
    await client.getStatus({ providerId: 'chatgpt-codex' as ProviderId, skipCache: true })

    client.invalidateCache('chatgpt-codex')

    const snapshot = await client.getStatus({ providerId: 'chatgpt-codex' as ProviderId })
    expect(snapshot.fetchedAt).toBeDefined()
  })

  it('returns all provider statuses', async () => {
    const statuses = await client.getAllStatus()

    expect(statuses.size).toBeGreaterThan(0)

    for (const [_providerId, snapshot] of statuses) {
      expect(snapshot.provider).toBeDefined()
      expect(snapshot.windows).toBeInstanceOf(Array)
    }
  })

  it('handles unknown provider gracefully', async () => {
    const snapshot = await client.getStatus({
      providerId: 'unknown-provider' as ProviderId,
    })

    expect(snapshot.error).toBeDefined()
    expect(snapshot.error?.code).toBe('UNKNOWN_PROVIDER')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { SnapshotCache } from '../../src/core/cache.js'
import type { QuotaSnapshot } from '../../src/interfaces/types.js'

function createMockSnapshot(provider: string): QuotaSnapshot {
  return {
    provider: provider as QuotaSnapshot['provider'],
    windows: [
      {
        id: '5h',
        label: '5h',
        credit: { used: 50, limit: 100, remaining: 50, percentage: 50 },
        isExhausted: false,
        isLow: false,
      },
    ],
    fetchedAt: new Date(),
  }
}

describe('SnapshotCache', () => {
  let cache: SnapshotCache

  beforeEach(() => {
    cache = new SnapshotCache({ defaultTtlMs: 1000, staleWhileRevalidateMs: 500 })
  })

  it('returns undefined for missing key', () => {
    const result = cache.get('chatgpt-codex')
    expect(result).toBeUndefined()
  })

  it('stores and retrieves snapshot', () => {
    const snapshot = createMockSnapshot('chatgpt-codex')
    cache.set(snapshot)
    const result = cache.get('chatgpt-codex')
    expect(result).toEqual(snapshot)
  })

  it('stores with model key', () => {
    const snapshot = createMockSnapshot('chatgpt-codex')
    snapshot.model = 'gpt-5.3-codex'
    cache.set(snapshot, { modelId: 'gpt-5.3-codex' })
    const result = cache.get('chatgpt-codex', { modelId: 'gpt-5.3-codex' })
    expect(result).toEqual(snapshot)
  })

  it('returns undefined after TTL + stale period', async () => {
    const shortCache = new SnapshotCache({ defaultTtlMs: 10, staleWhileRevalidateMs: 5 })
    const snapshot = createMockSnapshot('chatgpt-codex')
    shortCache.set(snapshot)
    await new Promise((r) => setTimeout(r, 20))
    const result = shortCache.get('chatgpt-codex')
    expect(result).toBeUndefined()
  })

  it('invalidates single key', () => {
    const snapshot = createMockSnapshot('chatgpt-codex')
    cache.set(snapshot)
    cache.invalidate('chatgpt-codex')
    const result = cache.get('chatgpt-codex')
    expect(result).toBeUndefined()
  })

  it('invalidates all keys', () => {
    cache.set(createMockSnapshot('chatgpt-codex'))
    cache.set(createMockSnapshot('zai-coding-plan'))
    cache.invalidateAll()
    expect(cache.size()).toBe(0)
  })

  it('detects stale entries', async () => {
    const shortCache = new SnapshotCache({ defaultTtlMs: 10 })
    const snapshot = createMockSnapshot('chatgpt-codex')
    shortCache.set(snapshot)
    await new Promise((r) => setTimeout(r, 15))
    expect(shortCache.isStale('chatgpt-codex')).toBe(true)
  })

  it('returns stale data with getStale', async () => {
    const shortCache = new SnapshotCache({ defaultTtlMs: 10, staleWhileRevalidateMs: 100 })
    const snapshot = createMockSnapshot('chatgpt-codex')
    shortCache.set(snapshot)
    await new Promise((r) => setTimeout(r, 15))
    const result = shortCache.getStale('chatgpt-codex')
    expect(result).toEqual(snapshot)
  })
})

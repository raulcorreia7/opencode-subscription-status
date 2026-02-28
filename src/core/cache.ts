/**
 * Privacy-aware cache for subscription quota snapshots.
 *
 * IMPORTANT: This cache ONLY stores quota metadata:
 * - Provider ID
 * - Model name
 * - Usage percentages (5h/weekly windows)
 * - Reset timestamps
 *
 * This cache NEVER stores:
 * - Conversation content
 * - Request/response bodies
 * - User messages
 * - API payloads
 * - Any PII or user-generated content
 *
 * Data is derived exclusively from API response headers (x-codex-*-used-percent, etc.)
 * which contain only aggregate usage percentages.
 */

import type { ProviderId, QuotaSnapshot } from "../interfaces/types.js"
import { CACHE_DEFAULT_TTL_MS, CACHE_STALE_WHILE_REVALIDATE_MS } from "../interfaces/types.js"

export interface CacheEntry {
  snapshot: QuotaSnapshot
  cachedAt: number
  ttlMs: number
}

export interface CacheOptions {
  defaultTtlMs?: number
  staleWhileRevalidateMs?: number
}

function createCacheKey(
  providerId: ProviderId,
  options?: { account?: string; modelId?: string }
): string {
  const parts: string[] = [providerId]
  if (options?.account) parts.push(options.account)
  if (options?.modelId) parts.push(options.modelId)
  return parts.join(":")
}

export class SnapshotCache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTtlMs: number
  private readonly staleWhileRevalidateMs: number

  constructor(options?: CacheOptions) {
    this.defaultTtlMs = options?.defaultTtlMs ?? CACHE_DEFAULT_TTL_MS
    this.staleWhileRevalidateMs = options?.staleWhileRevalidateMs ?? CACHE_STALE_WHILE_REVALIDATE_MS
  }

  get(
    providerId: ProviderId,
    options?: { account?: string; modelId?: string }
  ): QuotaSnapshot | undefined {
    const key = createCacheKey(providerId, options)
    const entry = this.cache.get(key)

    if (!entry) return undefined

    const now = Date.now()
    const age = now - entry.cachedAt

    if (age > entry.ttlMs + this.staleWhileRevalidateMs) {
      this.cache.delete(key)
      return undefined
    }

    return entry.snapshot
  }

  getStale(
    providerId: ProviderId,
    options?: { account?: string; modelId?: string }
  ): QuotaSnapshot | undefined {
    const key = createCacheKey(providerId, options)
    const entry = this.cache.get(key)

    if (!entry) return undefined

    return entry.snapshot
  }

  isStale(providerId: ProviderId, options?: { account?: string; modelId?: string }): boolean {
    const key = createCacheKey(providerId, options)
    const entry = this.cache.get(key)

    if (!entry) return true

    return Date.now() - entry.cachedAt > entry.ttlMs
  }

  set(
    snapshot: QuotaSnapshot,
    options?: { account?: string; modelId?: string; ttlMs?: number }
  ): void {
    const key = createCacheKey(snapshot.provider, options)
    const ttlMs = options?.ttlMs ?? this.defaultTtlMs

    this.cache.set(key, {
      snapshot,
      cachedAt: Date.now(),
      ttlMs,
    })
  }

  invalidate(providerId: ProviderId, options?: { account?: string; modelId?: string }): void {
    const key = createCacheKey(providerId, options)
    this.cache.delete(key)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const snapshotCache = new SnapshotCache()

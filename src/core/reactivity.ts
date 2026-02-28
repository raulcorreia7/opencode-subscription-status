import type { ProviderId, QuotaSnapshot } from "../interfaces/types.js"
import { CACHE_DEFAULT_TTL_MS } from "../interfaces/types.js"

export type RefreshCallback = (snapshot: QuotaSnapshot) => void

export interface SchedulerOptions {
  refreshIntervalMs?: number
  debounceMs?: number
}

const DEFAULT_REFRESH_INTERVAL_MS = CACHE_DEFAULT_TTL_MS
const DEFAULT_DEBOUNCE_MS = 5000

export class ReactivityScheduler {
  private refreshCallbacks: RefreshCallback[] = []
  private readonly refreshIntervalMs: number
  private readonly debounceMs: number
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private intervalTimer: ReturnType<typeof setInterval> | null = null
  private refreshFn: (() => Promise<void>) | null = null

  constructor(options?: SchedulerOptions) {
    this.refreshIntervalMs = options?.refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS
    this.debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS
  }

  onRefresh(callback: RefreshCallback): () => void {
    this.refreshCallbacks.push(callback)
    return () => {
      const index = this.refreshCallbacks.indexOf(callback)
      if (index >= 0) {
        this.refreshCallbacks.splice(index, 1)
      }
    }
  }

  private emit(snapshot: QuotaSnapshot): void {
    for (const callback of this.refreshCallbacks) {
      callback(snapshot)
    }
  }

  setRefreshFn(fn: () => Promise<void>): void {
    this.refreshFn = fn
  }

  requestRefresh(providerId: ProviderId, modelId?: string): void {
    const key = modelId ? `${providerId}:${modelId}` : providerId

    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key)
      if (this.refreshFn) {
        this.refreshFn()
      }
    }, this.debounceMs)

    this.debounceTimers.set(key, timer)
  }

  startBackgroundRefresh(): void {
    if (this.intervalTimer) return

    this.intervalTimer = setInterval(() => {
      if (this.refreshFn) {
        this.refreshFn()
      }
    }, this.refreshIntervalMs)
  }

  stopBackgroundRefresh(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer)
      this.intervalTimer = null
    }
  }

  emitRefresh(snapshot: QuotaSnapshot): void {
    this.emit(snapshot)
  }

  dispose(): void {
    this.stopBackgroundRefresh()

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()

    this.refreshCallbacks = []
  }
}

export const reactivityScheduler = new ReactivityScheduler()

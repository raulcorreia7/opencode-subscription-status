import type {
  ProviderId,
  ThresholdConfig,
  ThresholdState,
  QuotaSnapshot,
} from "../interfaces/types.js"
import { THRESHOLD_LEVELS, THRESHOLD_COOLDOWN_MS } from "../interfaces/types.js"

export interface ThresholdCrossing {
  level: number
  providerId: ProviderId
  modelId?: string
  percentage: number
  timestamp: Date
}

export type ThresholdCallback = (crossing: ThresholdCrossing) => void

export class ThresholdDetector {
  private states = new Map<string, ThresholdState>()
  private readonly levels: readonly number[]
  private readonly cooldownMs: number
  private callbacks: ThresholdCallback[] = []

  constructor(config?: Partial<ThresholdConfig>) {
    this.levels = config?.levels ?? THRESHOLD_LEVELS
    this.cooldownMs = config?.cooldownMs ?? THRESHOLD_COOLDOWN_MS
  }

  private createKey(providerId: ProviderId, modelId?: string): string {
    return modelId ? `${providerId}:${modelId}` : providerId
  }

  private getState(providerId: ProviderId, modelId?: string): ThresholdState {
    const key = this.createKey(providerId, modelId)
    let state = this.states.get(key)

    if (!state) {
      state = {
        providerId,
        modelId,
        lastNotifiedLevel: null,
        lastNotifiedAt: null,
      }
      this.states.set(key, state)
    }

    return state
  }

  onCrossing(callback: ThresholdCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index >= 0) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  private emit(crossing: ThresholdCrossing): void {
    for (const callback of this.callbacks) {
      callback(crossing)
    }
  }

  check(snapshot: QuotaSnapshot): ThresholdCrossing | null {
    if (snapshot.error || snapshot.windows.length === 0) {
      return null
    }

    const maxPercentage = Math.max(...snapshot.windows.map((w) => w.credit.percentage))

    const crossedLevel = this.findCrossedLevel(maxPercentage)
    if (crossedLevel === null) {
      return null
    }

    const state = this.getState(snapshot.provider, snapshot.model)

    if (state.lastNotifiedLevel !== null && state.lastNotifiedLevel >= crossedLevel) {
      return null
    }

    if (state.lastNotifiedAt !== null) {
      const elapsed = Date.now() - state.lastNotifiedAt.getTime()
      if (elapsed < this.cooldownMs) {
        return null
      }
    }

    state.lastNotifiedLevel = crossedLevel
    state.lastNotifiedAt = new Date()

    const crossing: ThresholdCrossing = {
      level: crossedLevel,
      providerId: snapshot.provider,
      modelId: snapshot.model,
      percentage: maxPercentage,
      timestamp: state.lastNotifiedAt,
    }

    this.emit(crossing)
    return crossing
  }

  private findCrossedLevel(percentage: number): number | null {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i]
      if (level !== undefined && percentage >= level) {
        return level
      }
    }
    return null
  }

  reset(providerId: ProviderId, modelId?: string): void {
    const key = this.createKey(providerId, modelId)
    this.states.delete(key)
  }

  resetAll(): void {
    this.states.clear()
  }
}

export const thresholdDetector = new ThresholdDetector()

export type ProviderId = "chatgpt-codex" | "zai-coding-plan" | "kimi"

export const PROVIDER_IDS: readonly ProviderId[] = [
  "chatgpt-codex",
  "zai-coding-plan",
  "kimi",
] as const

export const CACHE_DEFAULT_TTL_MS = 60_000
export const CACHE_STALE_WHILE_REVALIDATE_MS = 30_000
export const THRESHOLD_COOLDOWN_MS = 300_000
export const THRESHOLD_LEVELS = [50, 75, 90] as const
export const LOW_THRESHOLD_PERCENTAGE = 75
export const EXHAUSTED_THRESHOLD_PERCENTAGE = 100

export const BAR_SEGMENTS = 8

export interface QuotaCredit {
  used: number
  limit: number
  remaining: number
  percentage: number
}

export interface QuotaWindow {
  id: string
  label: string
  credit: QuotaCredit
  resetsAt?: Date
  isExhausted: boolean
  isLow: boolean
}

export interface QuotaSnapshot {
  provider: ProviderId
  account?: string
  model?: string
  windows: QuotaWindow[]
  fetchedAt: Date
  error?: {
    code: string
    message: string
  }
}

export interface ProviderCapabilities {
  supportsModelScopedUsage: boolean
  supportsHardLimits: boolean
  supportsMultipleWindows: boolean
  supportsResetTime: boolean
}

export interface StatusProvider {
  readonly id: ProviderId
  readonly name: string
  readonly capabilities: ProviderCapabilities

  fetchUsage(options?: { modelId?: string }): Promise<QuotaSnapshot>
  isAvailable(): Promise<boolean>
}

export interface ClientOptions {
  cacheTtlMs?: number
  staleWhileRevalidate?: boolean
}

export interface GetStatusOptions {
  providerId: ProviderId
  modelId?: string
  skipCache?: boolean
}

export interface ThresholdConfig {
  levels: number[]
  cooldownMs: number
}

export interface ThresholdState {
  providerId: ProviderId
  modelId?: string
  lastNotifiedLevel: number | null
  lastNotifiedAt: Date | null
}

export type ThemeColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "text"
  | "textMuted"

export interface RenderOptions {
  compact?: boolean
  showReset?: boolean
  colorize?: boolean
  maxLineLength?: number
}

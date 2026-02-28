import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import type {
  ProviderId,
  ProviderCapabilities,
  QuotaSnapshot,
  QuotaWindow,
  StatusProvider,
} from "../interfaces/types.js"
import {
  createProviderSnapshot,
  calculateCredit,
  isLowThreshold,
  isExhausted,
} from "../interfaces/provider.js"

export interface ZAIAuth {
  type: "api" | "oauth"
  key?: string
  access?: string
  refresh?: string
  expires?: number
}

export const ZAI_CAPABILITIES: ProviderCapabilities = {
  supportsModelScopedUsage: false,
  supportsHardLimits: true,
  supportsMultipleWindows: true,
  supportsResetTime: true,
}

const OPENCODE_AUTH_PATH = join(homedir(), ".local", "share", "opencode", "auth.json")
const FIVE_HOUR_WINDOW_ID = "5h"
const WEEKLY_WINDOW_ID = "weekly"
const FIVE_HOUR_LABEL = "5h"
const WEEKLY_LABEL = "weekly"

async function loadAuth(): Promise<ZAIAuth | null> {
  try {
    const content = await readFile(OPENCODE_AUTH_PATH, "utf-8")
    const authData = JSON.parse(content) as Record<string, ZAIAuth>

    const zaiAuth = authData["zai-coding-plan"]
    if (zaiAuth) return zaiAuth

    return null
  } catch {
    return null
  }
}

function parseResetTimestamp(value: string | null): Date | undefined {
  if (!value) return undefined
  const timestamp = parseInt(value, 10)
  if (isNaN(timestamp)) return undefined
  return new Date(timestamp * 1000)
}

function createWindowFromHeaders(
  id: string,
  label: string,
  usedPercent: string | null,
  resetAt: string | null
): QuotaWindow | null {
  if (!usedPercent) return null

  const percentage = parseFloat(usedPercent)
  if (isNaN(percentage)) return null

  const credit = calculateCredit(percentage, 100)

  return {
    id,
    label,
    credit,
    resetsAt: parseResetTimestamp(resetAt),
    isExhausted: isExhausted(percentage),
    isLow: isLowThreshold(percentage),
  }
}

export interface ZAIUsageHeaders {
  primaryUsedPercent: string | null
  primaryResetAt: string | null
  secondaryUsedPercent: string | null
  secondaryResetAt: string | null
}

export function extractUsageHeaders(headers: Headers): ZAIUsageHeaders {
  return {
    primaryUsedPercent: headers.get("x-zai-primary-used-percent"),
    primaryResetAt: headers.get("x-zai-primary-reset-at"),
    secondaryUsedPercent: headers.get("x-zai-secondary-used-percent"),
    secondaryResetAt: headers.get("x-zai-secondary-reset-at"),
  }
}

export function createSnapshotFromHeaders(
  headers: Headers,
  options?: { model?: string }
): QuotaSnapshot {
  const usage = extractUsageHeaders(headers)
  const windows: QuotaWindow[] = []

  const fiveHourWindow = createWindowFromHeaders(
    FIVE_HOUR_WINDOW_ID,
    FIVE_HOUR_LABEL,
    usage.primaryUsedPercent,
    usage.primaryResetAt
  )
  if (fiveHourWindow) windows.push(fiveHourWindow)

  const weeklyWindow = createWindowFromHeaders(
    WEEKLY_WINDOW_ID,
    WEEKLY_LABEL,
    usage.secondaryUsedPercent,
    usage.secondaryResetAt
  )
  if (weeklyWindow) windows.push(weeklyWindow)

  return {
    provider: "zai-coding-plan",
    model: options?.model,
    windows,
    fetchedAt: new Date(),
  }
}

class ZAIProvider implements StatusProvider {
  readonly id: ProviderId = "zai-coding-plan"
  readonly name = "Z.AI Coding Plan"
  readonly capabilities = ZAI_CAPABILITIES

  private cachedSnapshot: QuotaSnapshot | null = null

  updateFromHeaders(headers: Headers, options?: { model?: string }): void {
    this.cachedSnapshot = createSnapshotFromHeaders(headers, options)
  }

  async fetchUsage(options?: { modelId?: string }): Promise<QuotaSnapshot> {
    if (this.cachedSnapshot) {
      return {
        ...this.cachedSnapshot,
        model: options?.modelId ?? this.cachedSnapshot.model,
      }
    }

    const auth = await loadAuth()
    if (!auth) {
      return createProviderSnapshot("zai-coding-plan", {
        error: {
          code: "NO_AUTH",
          message: "No Z.AI Coding Plan authentication found. Run `opencode auth login` first.",
        },
      })
    }

    if (auth.type === "oauth" && auth.expires && Date.now() > auth.expires) {
      return createProviderSnapshot("zai-coding-plan", {
        error: {
          code: "TOKEN_EXPIRED",
          message: "Z.AI token has expired. Run `opencode auth login` to refresh.",
        },
      })
    }

    return createProviderSnapshot("zai-coding-plan", {
      model: options?.modelId,
      error: {
        code: "NO_USAGE_DATA",
        message: "Usage data not yet available. Make an API request first.",
      },
    })
  }

  async isAvailable(): Promise<boolean> {
    const auth = await loadAuth()
    if (!auth) return false

    if (auth.type === "oauth") {
      return !!auth.access && (!auth.expires || Date.now() < auth.expires)
    }

    return !!auth.key
  }
}

export const zaiProvider = new ZAIProvider()

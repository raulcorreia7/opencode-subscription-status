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

export interface KimiAuth {
  type: "api"
  key?: string
}

export const KIMI_CAPABILITIES: ProviderCapabilities = {
  supportsModelScopedUsage: false,
  supportsHardLimits: true,
  supportsMultipleWindows: false,
  supportsResetTime: true,
}

const OPENCODE_AUTH_PATH = join(homedir(), ".local", "share", "opencode", "auth.json")
const WINDOW_ID = "window"
const WINDOW_LABEL = "Window"

async function loadAuth(): Promise<KimiAuth | null> {
  try {
    const content = await readFile(OPENCODE_AUTH_PATH, "utf-8")
    const authData = JSON.parse(content) as Record<string, KimiAuth>

    const kimiAuth = authData["kimi-for-coding"]
    if (kimiAuth) return kimiAuth

    const moonshotAuth = authData["moonshot"]
    if (moonshotAuth) return moonshotAuth

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

export interface KimiUsageHeaders {
  usedPercent: string | null
  resetAt: string | null
}

export function extractUsageHeaders(headers: Headers): KimiUsageHeaders {
  return {
    usedPercent: headers.get("x-kimi-used-percent"),
    resetAt: headers.get("x-kimi-reset-at"),
  }
}

export function createSnapshotFromHeaders(
  headers: Headers,
  options?: { model?: string }
): QuotaSnapshot {
  const usage = extractUsageHeaders(headers)
  const windows: QuotaWindow[] = []

  const window = createWindowFromHeaders(WINDOW_ID, WINDOW_LABEL, usage.usedPercent, usage.resetAt)
  if (window) windows.push(window)

  return {
    provider: "kimi",
    model: options?.model,
    windows,
    fetchedAt: new Date(),
  }
}

class KimiProvider implements StatusProvider {
  readonly id: ProviderId = "kimi"
  readonly name = "Kimi"
  readonly capabilities = KIMI_CAPABILITIES

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
      return createProviderSnapshot("kimi", {
        error: {
          code: "NO_AUTH",
          message: "No Kimi authentication found. Run `opencode auth login` first.",
        },
      })
    }

    return createProviderSnapshot("kimi", {
      model: options?.modelId,
      error: {
        code: "NO_USAGE_DATA",
        message: "Usage data not yet available. Make an API request first.",
      },
    })
  }

  async isAvailable(): Promise<boolean> {
    const auth = await loadAuth()
    return auth?.type === "api" && !!auth.key
  }
}

export const kimiProvider = new KimiProvider()

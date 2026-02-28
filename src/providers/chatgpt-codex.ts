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

export interface ChatGPTAuth {
  type: "oauth" | "api"
  access?: string
  refresh?: string
  expires?: number
  accountId?: string
  key?: string
}

export const CHATGPT_CODEX_CAPABILITIES: ProviderCapabilities = {
  supportsModelScopedUsage: true,
  supportsHardLimits: true,
  supportsMultipleWindows: true,
  supportsResetTime: true,
}

const OPENCODE_AUTH_PATH = join(homedir(), ".local", "share", "opencode", "auth.json")
const FIVE_HOUR_WINDOW_ID = "5h"
const WEEKLY_WINDOW_ID = "weekly"
const FIVE_HOUR_LABEL = "5h"
const WEEKLY_LABEL = "weekly"

async function loadAuth(): Promise<ChatGPTAuth | null> {
  try {
    const content = await readFile(OPENCODE_AUTH_PATH, "utf-8")
    const authData = JSON.parse(content) as Record<string, ChatGPTAuth>

    const codexAuth = authData["codex"]
    if (codexAuth) return codexAuth

    const openaiAuth = authData["openai"]
    if (openaiAuth) return openaiAuth

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
  _windowMinutes: string | null,
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

export interface UsageHeaders {
  primaryUsedPercent: string | null
  primaryWindowMinutes: string | null
  primaryResetAt: string | null
  secondaryUsedPercent: string | null
  secondaryWindowMinutes: string | null
  secondaryResetAt: string | null
}

export function extractUsageHeaders(headers: Headers): UsageHeaders {
  return {
    primaryUsedPercent: headers.get("x-codex-primary-used-percent"),
    primaryWindowMinutes: headers.get("x-codex-primary-window-minutes"),
    primaryResetAt: headers.get("x-codex-primary-reset-at"),
    secondaryUsedPercent: headers.get("x-codex-secondary-used-percent"),
    secondaryWindowMinutes: headers.get("x-codex-secondary-window-minutes"),
    secondaryResetAt: headers.get("x-codex-secondary-reset-at"),
  }
}

export function createSnapshotFromHeaders(
  headers: Headers,
  options?: { account?: string; model?: string }
): QuotaSnapshot {
  const usage = extractUsageHeaders(headers)
  const windows: QuotaWindow[] = []

  const fiveHourWindow = createWindowFromHeaders(
    FIVE_HOUR_WINDOW_ID,
    FIVE_HOUR_LABEL,
    usage.primaryUsedPercent,
    usage.primaryWindowMinutes,
    usage.primaryResetAt
  )
  if (fiveHourWindow) windows.push(fiveHourWindow)

  const weeklyWindow = createWindowFromHeaders(
    WEEKLY_WINDOW_ID,
    WEEKLY_LABEL,
    usage.secondaryUsedPercent,
    usage.secondaryWindowMinutes,
    usage.secondaryResetAt
  )
  if (weeklyWindow) windows.push(weeklyWindow)

  return {
    provider: "chatgpt-codex",
    account: options?.account,
    model: options?.model,
    windows,
    fetchedAt: new Date(),
  }
}

class ChatGPTCodexProvider implements StatusProvider {
  readonly id: ProviderId = "chatgpt-codex"
  readonly name = "ChatGPT/Codex"
  readonly capabilities = CHATGPT_CODEX_CAPABILITIES

  private cachedSnapshot: QuotaSnapshot | null = null

  updateFromHeaders(headers: Headers, options?: { account?: string; model?: string }): void {
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
      return createProviderSnapshot("chatgpt-codex", {
        error: {
          code: "NO_AUTH",
          message: "No ChatGPT/Codex authentication found. Run `opencode auth login` first.",
        },
      })
    }

    if (auth.type === "oauth" && auth.expires && Date.now() > auth.expires) {
      return createProviderSnapshot("chatgpt-codex", {
        account: auth.accountId,
        error: {
          code: "TOKEN_EXPIRED",
          message: "ChatGPT token has expired. Run `opencode auth login` to refresh.",
        },
      })
    }

    return createProviderSnapshot("chatgpt-codex", {
      account: auth.accountId,
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

export const chatGPTCodexProvider = new ChatGPTCodexProvider()

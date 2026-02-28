import type { QuotaSnapshot, QuotaWindow, RenderOptions } from "../interfaces/types.js"
import { BAR_SEGMENTS } from "../interfaces/types.js"
import { colorize, getStatusColor, formatResetTime, formatShortTime } from "./theme.js"

const FILLED = "█"
const EMPTY = "░"

export function renderBar(percentage: number, options?: { colorize?: boolean }): string {
  const filled = Math.round((percentage / 100) * BAR_SEGMENTS)
  const empty = BAR_SEGMENTS - filled
  const bar = FILLED.repeat(filled) + EMPTY.repeat(empty)

  if (options?.colorize) {
    return colorize(bar, getStatusColor(percentage))
  }

  return bar
}

export function renderWindow(window: QuotaWindow, options?: RenderOptions): string {
  const compact = options?.compact ?? false
  const showReset = options?.showReset ?? true
  const colorizeOutput = options?.colorize ?? true

  const bar = renderBar(window.credit.percentage, { colorize: colorizeOutput })
  const pct = `${Math.round(window.credit.percentage)}%`

  if (compact) {
    const reset = showReset && window.resetsAt ? ` ${formatShortTime(window.resetsAt)}` : ""
    return `${window.label} [${bar}] ${pct}${reset}`
  }

  const reset = showReset && window.resetsAt ? `  reset ${formatResetTime(window.resetsAt)}` : ""
  const label = window.label.padEnd(8)
  return `${label} [${bar}] ${pct}${reset}`
}

export function renderSnapshot(snapshot: QuotaSnapshot, options?: RenderOptions): string {
  const compact = options?.compact ?? false
  const lines: string[] = []

  if (snapshot.error) {
    const errorMsg = colorize
      ? colorize(`error: ${snapshot.error.message}`, "error")
      : `error: ${snapshot.error.message}`
    return errorMsg
  }

  if (snapshot.windows.length === 0) {
    return colorize ? colorize("no usage data available", "textMuted") : "no usage data available"
  }

  if (compact) {
    const parts: string[] = []

    if (snapshot.model) {
      parts.push(snapshot.model)
    } else if (snapshot.provider) {
      parts.push(snapshot.provider)
    }

    const windowParts = snapshot.windows.map((w) => {
      const bar = renderBar(w.credit.percentage, { colorize: options?.colorize ?? true })
      return `${w.label.slice(0, 2)} [${bar}] ${Math.round(w.credit.percentage)}%`
    })

    parts.push(...windowParts)
    return parts.join("  ")
  }

  lines.push(colorize ? colorize("Usage", "primary") : "Usage")

  if (snapshot.model) {
    lines.push(
      colorize ? colorize(`Model   ${snapshot.model}`, "text") : `Model   ${snapshot.model}`
    )
  }

  for (const window of snapshot.windows) {
    lines.push(renderWindow(window, options))
  }

  return lines.join("\n")
}

export function renderDetailed(snapshot: QuotaSnapshot, options?: RenderOptions): string {
  const lines: string[] = []

  const providerName =
    {
      "chatgpt-codex": "ChatGPT/Codex",
      "zai-coding-plan": "Z.AI Coding Plan",
      kimi: "Kimi",
    }[snapshot.provider] ?? snapshot.provider

  lines.push(colorize ? colorize("─".repeat(40), "textMuted") : "─".repeat(40))
  lines.push(colorize ? colorize("Subscription Status", "primary") : "Subscription Status")
  lines.push(colorize ? colorize("─".repeat(40), "textMuted") : "─".repeat(40))
  lines.push("")

  if (snapshot.error) {
    lines.push(`Provider: ${providerName}`)
    lines.push(`Status:   ${colorize ? colorize("error", "error") : "error"}`)
    lines.push(`Message:  ${snapshot.error.message}`)
    lines.push("")
    lines.push(colorize ? colorize("─".repeat(40), "textMuted") : "─".repeat(40))
    return lines.join("\n")
  }

  lines.push(`Provider: ${providerName}`)
  if (snapshot.account) {
    lines.push(`Account:  ${snapshot.account}`)
  }
  if (snapshot.model) {
    lines.push(`Model:    ${snapshot.model}`)
  }
  lines.push("")

  for (const window of snapshot.windows) {
    const header = colorize
      ? colorize(window.label.toUpperCase(), "secondary")
      : window.label.toUpperCase()
    lines.push(header)

    const bar = renderBar(window.credit.percentage, { colorize: options?.colorize ?? true })
    lines.push(`  Usage:  [${bar}] ${Math.round(window.credit.percentage)}%`)
    lines.push(
      `  Used:   ${window.credit.used.toLocaleString()} / ${window.credit.limit.toLocaleString()}`
    )
    lines.push(`  Left:   ${window.credit.remaining.toLocaleString()}`)

    if (window.resetsAt) {
      lines.push(`  Reset:  ${formatResetTime(window.resetsAt)}`)
    }

    if (window.isExhausted) {
      lines.push(`  Status: ${colorize ? colorize("exhausted", "error") : "exhausted"}`)
    } else if (window.isLow) {
      lines.push(`  Status: ${colorize ? colorize("low", "warning") : "low"}`)
    }

    lines.push("")
  }

  lines.push(colorize ? colorize("─".repeat(40), "textMuted") : "─".repeat(40))
  return lines.join("\n")
}

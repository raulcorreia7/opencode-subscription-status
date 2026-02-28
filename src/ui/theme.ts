export const theme = {
  success: "\x1b[38;5;150m",
  warning: "\x1b[38;5;215m",
  error: "\x1b[38;5;180m",
  primary: "\x1b[38;5;117m",
  secondary: "\x1b[38;5;189m",
  text: "\x1b[38;5;254m",
  textMuted: "\x1b[38;5;246m",
  reset: "\x1b[0m",
} as const

export type ThemeKey = keyof typeof theme

export function colorize(text: string, color: ThemeKey): string {
  const code = theme[color]
  if (!code || code === theme.reset) return text
  return `${code}${text}${theme.reset}`
}

export function getStatusColor(percentage: number): ThemeKey {
  if (percentage >= 90) return "error"
  if (percentage >= 75) return "warning"
  return "success"
}

export function formatResetTime(resetsAt: Date | undefined): string {
  if (!resetsAt) return ""

  const now = new Date()
  const diff = resetsAt.getTime() - now.getTime()

  if (diff <= 0) return "now"

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`
    }
    return `${days}d`
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${hours}h`
  }

  return `${minutes}m`
}

export function formatShortTime(resetsAt: Date | undefined): string {
  if (!resetsAt) return ""

  const now = new Date()
  const diff = resetsAt.getTime() - now.getTime()

  if (diff <= 0) return "now"

  const hours = Math.floor(diff / 3600000)

  if (hours > 24) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return `${dayNames[resetsAt.getDay()]} ${String(resetsAt.getHours()).padStart(2, "0")}:${String(resetsAt.getMinutes()).padStart(2, "0")}`
  }

  if (hours > 0) {
    return `${hours}h`
  }

  const minutes = Math.floor(diff / 60000)
  return `${minutes}m`
}

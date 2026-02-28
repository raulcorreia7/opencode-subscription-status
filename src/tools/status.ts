import type { ProviderId } from "../interfaces/types.js"
import { subscriptionClient } from "../client.js"
import { renderSnapshot, renderDetailed } from "../ui/bar.js"

export interface StatusToolOptions {
  providerId?: ProviderId
  modelId?: string
  detailed?: boolean
  compact?: boolean
}

export async function getStatusOutput(options: StatusToolOptions = {}): Promise<string> {
  const { providerId, modelId, detailed = false, compact = false } = options

  if (providerId) {
    const snapshot = await subscriptionClient.getStatus({
      providerId,
      modelId,
      skipCache: false,
    })

    return detailed
      ? renderDetailed(snapshot, { colorize: true })
      : renderSnapshot(snapshot, { compact, colorize: true })
  }

  const allStatus = await subscriptionClient.getAllStatus()
  const outputs: string[] = []

  for (const [, snapshot] of allStatus) {
    if (detailed) {
      outputs.push(renderDetailed(snapshot, { colorize: true }))
    } else {
      outputs.push(renderSnapshot(snapshot, { compact, colorize: true }))
    }
  }

  if (outputs.length === 0) {
    return "No providers available. Run `opencode auth login` to configure a provider."
  }

  return outputs.join("\n\n")
}

export async function getDetailedStatusOutput(
  options: Omit<StatusToolOptions, "detailed"> = {}
): Promise<string> {
  return getStatusOutput({ ...options, detailed: true })
}

export async function getCompactStatusOutput(
  options: Omit<StatusToolOptions, "compact"> = {}
): Promise<string> {
  return getStatusOutput({ ...options, compact: true })
}

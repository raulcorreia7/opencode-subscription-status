import type { ProviderId } from "../interfaces/types.js"
import { subscriptionClient } from "../client.js"
import { renderDetailed, renderSnapshot } from "../ui/bar.js"

export interface StatusCommandOptions {
  providerId?: ProviderId
  modelId?: string
  verbose?: boolean
}

export async function handleStatusCommand(options: StatusCommandOptions = {}): Promise<string> {
  const { providerId, modelId, verbose = false } = options

  const available = await subscriptionClient.getAvailableProviders()

  if (available.length === 0) {
    return `No providers configured.

To set up a provider:
  1. Run: opencode auth login
  2. Select your provider (ChatGPT/Codex, Z.AI, or Kimi)
  3. Follow the authentication flow

After authentication, usage status will be available.`
  }

  if (providerId) {
    const snapshot = await subscriptionClient.getStatus({
      providerId,
      modelId,
      skipCache: false,
    })

    if (verbose) {
      return renderDetailed(snapshot, { colorize: true, showReset: true })
    }

    return renderSnapshot(snapshot, { colorize: true, showReset: true })
  }

  const outputs: string[] = []

  if (verbose) {
    for (const id of available) {
      const snapshot = await subscriptionClient.getStatus({
        providerId: id,
        modelId,
        skipCache: false,
      })
      outputs.push(renderDetailed(snapshot, { colorize: true, showReset: true }))
    }
  } else {
    for (const id of available) {
      const snapshot = await subscriptionClient.getStatus({
        providerId: id,
        modelId,
        skipCache: false,
      })
      outputs.push(renderSnapshot(snapshot, { compact: true, colorize: true, showReset: true }))
    }
  }

  return outputs.join("\n\n")
}

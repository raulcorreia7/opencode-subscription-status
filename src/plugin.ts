import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin/tool"
import { getStatusOutput } from "./tools/status.js"
import { handleStatusCommand } from "./commands/status.js"
import { subscriptionClient } from "./client.js"
import type { ProviderId } from "./interfaces/types.js"

const PROVIDER_HEADER_PATTERNS: Record<ProviderId, string[]> = {
  "chatgpt-codex": ["x-codex-primary-used-percent", "x-codex-secondary-used-percent"],
  "zai-coding-plan": ["x-zai-primary-used-percent", "x-zai-secondary-used-percent"],
  kimi: ["x-kimi-used-percent"],
}

function detectProviderFromHeaders(headers: Headers): ProviderId | null {
  for (const [providerId, patterns] of Object.entries(PROVIDER_HEADER_PATTERNS)) {
    for (const pattern of patterns) {
      if (headers.get(pattern)) {
        return providerId as ProviderId
      }
    }
  }
  return null
}

export const SubscriptionStatusPlugin: Plugin = async (_ctx) => {
  subscriptionClient.onHeaderUpdate((providerId) => {
    subscriptionClient.invalidateCache(providerId)
  })

  return {
    tool: {
      "subscription-status": tool({
        description:
          "Check subscription usage status for AI providers (ChatGPT/Codex, Z.AI, Kimi). Shows quota percentages for 5-hour and weekly usage windows.",
        args: {
          provider: tool.schema
            .string()
            .optional()
            .describe("Provider ID: chatgpt-codex, zai-coding-plan, or kimi"),
          model: tool.schema.string().optional().describe("Model ID to check usage for"),
          detailed: tool.schema
            .boolean()
            .optional()
            .describe("Show detailed output with all metadata"),
        },
        async execute(args, _context) {
          const providerId = args.provider as ProviderId | undefined
          const output = await getStatusOutput({
            providerId,
            modelId: args.model,
            detailed: args.detailed ?? false,
          })
          return output
        },
      }),
    },
    command: {
      status: {
        description: "Show subscription usage status for AI providers",
        async execute(args: { provider?: string; model?: string; verbose?: boolean }) {
          const providerId = args.provider as ProviderId | undefined
          return handleStatusCommand({
            providerId,
            modelId: args.model,
            verbose: args.verbose ?? false,
          })
        },
      },
    },
  }
}

export default SubscriptionStatusPlugin

export { subscriptionClient, SubscriptionClient } from "./client.js"
export type { ProviderId, QuotaSnapshot, QuotaWindow } from "./interfaces/types.js"
export { renderSnapshot, renderDetailed } from "./ui/bar.js"
export { detectProviderFromHeaders }

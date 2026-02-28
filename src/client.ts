import type { ProviderId, QuotaSnapshot } from "./interfaces/types.js"
import { providerRegistry } from "./interfaces/provider.js"
import { chatGPTCodexProvider } from "./providers/chatgpt-codex.js"
import { zaiProvider } from "./providers/zai-coding-plan.js"
import { kimiProvider } from "./providers/kimi.js"
import { SnapshotCache } from "./core/cache.js"

providerRegistry.register(chatGPTCodexProvider)
providerRegistry.register(zaiProvider)
providerRegistry.register(kimiProvider)

export type HeaderUpdateHandler = (providerId: ProviderId, headers: Headers) => void

export class SubscriptionClient {
  private cache: SnapshotCache
  private headerHandlers: HeaderUpdateHandler[] = []

  constructor(options?: { cacheTtlMs?: number }) {
    this.cache = new SnapshotCache({
      defaultTtlMs: options?.cacheTtlMs,
    })

    this.headerHandlers.push((providerId, headers) => {
      this.handleHeaderUpdate(providerId, headers)
    })
  }

  private handleHeaderUpdate(providerId: ProviderId, headers: Headers): void {
    switch (providerId) {
      case "chatgpt-codex":
        chatGPTCodexProvider.updateFromHeaders(headers)
        break
      case "zai-coding-plan":
        zaiProvider.updateFromHeaders(headers)
        break
      case "kimi":
        kimiProvider.updateFromHeaders(headers)
        break
    }
  }

  updateFromHeaders(providerId: ProviderId, headers: Headers): void {
    for (const handler of this.headerHandlers) {
      handler(providerId, headers)
    }
  }

  onHeaderUpdate(handler: HeaderUpdateHandler): () => void {
    this.headerHandlers.push(handler)
    return () => {
      const index = this.headerHandlers.indexOf(handler)
      if (index >= 0) {
        this.headerHandlers.splice(index, 1)
      }
    }
  }

  async getStatus(options: {
    providerId: ProviderId
    modelId?: string
    skipCache?: boolean
  }): Promise<QuotaSnapshot> {
    const { providerId, modelId, skipCache } = options

    if (!skipCache) {
      const cached = this.cache.get(providerId, { modelId })
      if (cached) return cached
    }

    const provider = providerRegistry.get(providerId)
    if (!provider) {
      return {
        provider: providerId,
        windows: [],
        fetchedAt: new Date(),
        error: {
          code: "UNKNOWN_PROVIDER",
          message: `Unknown provider: ${providerId}`,
        },
      }
    }

    const snapshot = await provider.fetchUsage({ modelId })
    this.cache.set(snapshot, { modelId })

    return snapshot
  }

  async getAvailableProviders(): Promise<ProviderId[]> {
    const available = await providerRegistry.getAvailable()
    return available.map((p) => p.id)
  }

  async getAllStatus(): Promise<Map<ProviderId, QuotaSnapshot>> {
    const results = new Map<ProviderId, QuotaSnapshot>()
    const providers = providerRegistry.getAll()

    for (const provider of providers) {
      const snapshot = await this.getStatus({
        providerId: provider.id,
        skipCache: false,
      })
      results.set(provider.id, snapshot)
    }

    return results
  }

  invalidateCache(providerId?: ProviderId, modelId?: string): void {
    if (providerId) {
      this.cache.invalidate(providerId, { modelId })
    } else {
      this.cache.invalidateAll()
    }
  }
}

export const subscriptionClient = new SubscriptionClient()

export { providerRegistry }
export type { ProviderId, QuotaSnapshot }

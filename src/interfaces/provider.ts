import type { ProviderId, ProviderCapabilities, QuotaSnapshot, StatusProvider } from "./types.js"

import { LOW_THRESHOLD_PERCENTAGE, EXHAUSTED_THRESHOLD_PERCENTAGE } from "./types.js"

export type { ProviderId, ProviderCapabilities, QuotaSnapshot, StatusProvider }

class ProviderRegistry {
  private providers = new Map<ProviderId, StatusProvider>()

  register(provider: StatusProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: ProviderId): StatusProvider | undefined {
    return this.providers.get(id)
  }

  getAll(): StatusProvider[] {
    return Array.from(this.providers.values())
  }

  async getAvailable(): Promise<StatusProvider[]> {
    const available: StatusProvider[] = []
    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        available.push(provider)
      }
    }
    return available
  }
}

export const providerRegistry = new ProviderRegistry()

export function createProviderSnapshot(
  provider: ProviderId,
  options?: {
    account?: string
    model?: string
    error?: { code: string; message: string }
  }
): QuotaSnapshot {
  return {
    provider,
    account: options?.account,
    model: options?.model,
    windows: [],
    fetchedAt: new Date(),
    error: options?.error,
  }
}

export function calculateCredit(used: number, limit: number) {
  const remaining = Math.max(0, limit - used)
  const percentage = limit > 0 ? (used / limit) * 100 : 0
  return {
    used,
    limit,
    remaining,
    percentage,
  }
}

export function isLowThreshold(percentage: number): boolean {
  return percentage >= LOW_THRESHOLD_PERCENTAGE
}

export function isExhausted(percentage: number): boolean {
  return percentage >= EXHAUSTED_THRESHOLD_PERCENTAGE
}

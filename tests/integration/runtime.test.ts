import { describe, it, expect, beforeEach } from 'vitest'
import { SubscriptionClient } from '../../src/client.js'
import type { ProviderId } from '../../src/interfaces/types.js'

describe('Runtime Integration', () => {
  let client: SubscriptionClient

  beforeEach(() => {
    client = new SubscriptionClient({ cacheTtlMs: 1000 })
  })

  describe('Header Updates', () => {
    it('routes headers to correct provider', () => {
      let chatgptUpdated = false
      let zaiUpdated = false
      let kimiUpdated = false

      client.onHeaderUpdate((providerId) => {
        if (providerId === 'chatgpt-codex') chatgptUpdated = true
        if (providerId === 'zai-coding-plan') zaiUpdated = true
        if (providerId === 'kimi') kimiUpdated = true
      })

      const chatgptHeaders = new Headers({
        'x-codex-primary-used-percent': '50',
      })
      client.updateFromHeaders('chatgpt-codex', chatgptHeaders)
      expect(chatgptUpdated).toBe(true)

      const zaiHeaders = new Headers({
        'x-zai-primary-used-percent': '60',
      })
      client.updateFromHeaders('zai-coding-plan', zaiHeaders)
      expect(zaiUpdated).toBe(true)

      const kimiHeaders = new Headers({
        'x-kimi-used-percent': '70',
      })
      client.updateFromHeaders('kimi', kimiHeaders)
      expect(kimiUpdated).toBe(true)
    })

    it('invalidates cache on header update', async () => {
      const headers = new Headers({
        'x-codex-primary-used-percent': '55',
        'x-codex-secondary-used-percent': '45',
      })

      client.updateFromHeaders('chatgpt-codex', headers)

      const snapshot = await client.getStatus({
        providerId: 'chatgpt-codex',
        skipCache: true,
      })

      expect(snapshot.provider).toBe('chatgpt-codex')
    })

    it('supports multiple header update handlers', () => {
      const updates: ProviderId[] = []

      client.onHeaderUpdate((providerId) => {
        updates.push(providerId)
      })
      client.onHeaderUpdate((providerId) => {
        updates.push(`${providerId}-2` as ProviderId)
      })

      const headers = new Headers({ 'x-codex-primary-used-percent': '50' })
      client.updateFromHeaders('chatgpt-codex', headers)

      expect(updates).toEqual(['chatgpt-codex', 'chatgpt-codex-2'])
    })

    it('allows unsubscribing from header updates', () => {
      const updates: ProviderId[] = []

      const unsubscribe = client.onHeaderUpdate((providerId) => {
        updates.push(providerId)
      })

      const headers = new Headers({ 'x-codex-primary-used-percent': '50' })
      client.updateFromHeaders('chatgpt-codex', headers)
      expect(updates).toHaveLength(1)

      unsubscribe()

      client.updateFromHeaders('chatgpt-codex', headers)
      expect(updates).toHaveLength(1)
    })
  })

  describe('Provider Detection', () => {
    it('detects ChatGPT from headers', async () => {
      const { detectProviderFromHeaders } = await import('../../src/plugin.js')

      const headers = new Headers({
        'x-codex-primary-used-percent': '50',
      })

      expect(detectProviderFromHeaders(headers)).toBe('chatgpt-codex')
    })

    it('detects Z.AI from headers', async () => {
      const { detectProviderFromHeaders } = await import('../../src/plugin.js')

      const headers = new Headers({
        'x-zai-primary-used-percent': '60',
      })

      expect(detectProviderFromHeaders(headers)).toBe('zai-coding-plan')
    })

    it('detects Kimi from headers', async () => {
      const { detectProviderFromHeaders } = await import('../../src/plugin.js')

      const headers = new Headers({
        'x-kimi-used-percent': '70',
      })

      expect(detectProviderFromHeaders(headers)).toBe('kimi')
    })

    it('returns null for unknown headers', async () => {
      const { detectProviderFromHeaders } = await import('../../src/plugin.js')

      const headers = new Headers({
        'x-unknown-header': 'value',
      })

      expect(detectProviderFromHeaders(headers)).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('handles missing auth gracefully when no usage data available', async () => {
      const snapshot = await client.getStatus({
        providerId: 'chatgpt-codex',
        skipCache: true,
      })

      expect(snapshot.provider).toBe('chatgpt-codex')
      expect(snapshot.fetchedAt).toBeInstanceOf(Date)
    })

    it('handles unknown provider', async () => {
      const snapshot = await client.getStatus({
        providerId: 'unknown' as ProviderId,
      })

      expect(snapshot.error?.code).toBe('UNKNOWN_PROVIDER')
    })
  })
})

import { describe, it, expect } from 'vitest'
import { renderSnapshot, renderDetailed } from '../../src/ui/bar.js'
import type { QuotaSnapshot } from '../../src/interfaces/types.js'

describe('E2E: Full Output Flow', () => {
  it('renders complete ChatGPT snapshot', () => {
    const snapshot: QuotaSnapshot = {
      provider: 'chatgpt-codex',
      account: 'user-abc123',
      model: 'gpt-5.3-codex',
      windows: [
        {
          id: '5h',
          label: '5h',
          credit: { used: 58, limit: 100, remaining: 42, percentage: 58 },
          resetsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          isExhausted: false,
          isLow: false,
        },
        {
          id: 'weekly',
          label: 'weekly',
          credit: { used: 52, limit: 100, remaining: 48, percentage: 52 },
          resetsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          isExhausted: false,
          isLow: false,
        },
      ],
      fetchedAt: new Date(),
    }

    const output = renderSnapshot(snapshot, { colorize: false })
    expect(output).toContain('Usage')
    expect(output).toContain('gpt-5.3-codex')
    expect(output).toContain('5h')
    expect(output).toContain('weekly')
    expect(output).toContain('58%')
    expect(output).toContain('52%')
  })

  it('renders Z.AI snapshot', () => {
    const snapshot: QuotaSnapshot = {
      provider: 'zai-coding-plan',
      model: 'glm-5',
      windows: [
        {
          id: 'window',
          label: 'Window',
          credit: { used: 80, limit: 100, remaining: 20, percentage: 80 },
          resetsAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
          isExhausted: false,
          isLow: true,
        },
      ],
      fetchedAt: new Date(),
    }

    const output = renderDetailed(snapshot, { colorize: false })
    expect(output).toContain('Z.AI Coding Plan')
    expect(output).toContain('glm-5')
    expect(output).toContain('WINDOW')
    expect(output).toContain('80%')
    expect(output).toContain('low')
  })

  it('renders Kimi snapshot', () => {
    const snapshot: QuotaSnapshot = {
      provider: 'kimi',
      model: 'kimi-k2',
      windows: [
        {
          id: 'window',
          label: 'Window',
          credit: { used: 100, limit: 100, remaining: 0, percentage: 100 },
          isExhausted: true,
          isLow: true,
        },
      ],
      fetchedAt: new Date(),
    }

    const output = renderSnapshot(snapshot, { colorize: false, compact: true })
    expect(output).toContain('kimi')
    expect(output).toContain('100%')
  })

  it('handles exhausted state in detailed view', () => {
    const snapshot: QuotaSnapshot = {
      provider: 'chatgpt-codex',
      model: 'gpt-5.3-codex',
      windows: [
        {
          id: '5h',
          label: '5h',
          credit: { used: 100, limit: 100, remaining: 0, percentage: 100 },
          isExhausted: true,
          isLow: true,
        },
      ],
      fetchedAt: new Date(),
    }

    const output = renderDetailed(snapshot, { colorize: false })
    expect(output).toContain('exhausted')
  })

  it('handles error state gracefully', () => {
    const snapshot: QuotaSnapshot = {
      provider: 'kimi',
      windows: [],
      fetchedAt: new Date(),
      error: { code: 'NO_AUTH', message: 'No authentication found' },
    }

    const compact = renderSnapshot(snapshot, { compact: true, colorize: false })
    const normal = renderSnapshot(snapshot, { colorize: false })
    const detailed = renderDetailed(snapshot, { colorize: false })

    expect(compact).toContain('error')
    expect(normal).toContain('error')
    expect(detailed).toContain('error')
  })
})

import { describe, it, expect } from 'vitest'
import { renderBar, renderSnapshot, renderDetailed } from '../../src/ui/bar.js'
import type { QuotaSnapshot, QuotaWindow } from '../../src/interfaces/types.js'

function createMockSnapshot(options: {
  provider?: 'chatgpt-codex' | 'zai-coding-plan' | 'kimi'
  model?: string
  windows?: Partial<QuotaWindow>[]
  error?: { code: string; message: string }
}): QuotaSnapshot {
  return {
    provider: options.provider ?? 'chatgpt-codex',
    model: options.model,
    windows:
      options.windows?.map((w, i) => ({
        id: w.id ?? `window-${i}`,
        label: w.label ?? '5h',
        credit: w.credit ?? { used: 50, limit: 100, remaining: 50, percentage: 50 },
        resetsAt: w.resetsAt,
        isExhausted: w.isExhausted ?? false,
        isLow: w.isLow ?? false,
      })) ?? [],
    fetchedAt: new Date(),
    error: options.error,
  }
}

describe('renderBar', () => {
  it('renders 0% correctly', () => {
    const bar = renderBar(0)
    expect(bar).toBe('░░░░░░░░')
  })

  it('renders 50% correctly', () => {
    const bar = renderBar(50)
    expect(bar).toBe('████░░░░')
  })

  it('renders 100% correctly', () => {
    const bar = renderBar(100)
    expect(bar).toBe('████████')
  })

  it('renders 25% correctly', () => {
    const bar = renderBar(25)
    expect(bar).toBe('██░░░░░░')
  })
})

describe('renderSnapshot', () => {
  it('renders error state', () => {
    const snapshot = createMockSnapshot({
      error: { code: 'NO_AUTH', message: 'No auth found' },
    })
    const output = renderSnapshot(snapshot, { colorize: false })
    expect(output).toContain('error: No auth found')
  })

  it('renders empty windows', () => {
    const snapshot = createMockSnapshot({ windows: [] })
    const output = renderSnapshot(snapshot, { colorize: false })
    expect(output).toContain('no usage data available')
  })

  it('renders with model name', () => {
    const snapshot = createMockSnapshot({
      model: 'gpt-5.3-codex',
      windows: [{ label: '5h' }],
    })
    const output = renderSnapshot(snapshot, { colorize: false })
    expect(output).toContain('Model')
    expect(output).toContain('gpt-5.3-codex')
  })

  it('renders compact mode', () => {
    const snapshot = createMockSnapshot({
      model: 'glm-5',
      provider: 'zai-coding-plan',
      windows: [{ label: '5h' }],
    })
    const output = renderSnapshot(snapshot, { compact: true, colorize: false })
    expect(output).toContain('glm-5')
  })
})

describe('renderDetailed', () => {
  it('renders detailed view with all sections', () => {
    const snapshot = createMockSnapshot({
      provider: 'chatgpt-codex',
      model: 'gpt-5.3-codex',
      windows: [
        { id: '5h', label: '5h', credit: { used: 50, limit: 100, remaining: 50, percentage: 50 } },
        {
          id: 'weekly',
          label: 'weekly',
          credit: { used: 30, limit: 100, remaining: 70, percentage: 30 },
        },
      ],
    })
    const output = renderDetailed(snapshot, { colorize: false })
    expect(output).toContain('Subscription Status')
    expect(output).toContain('ChatGPT/Codex')
    expect(output).toContain('gpt-5.3-codex')
    expect(output).toContain('5H')
    expect(output).toContain('WEEKLY')
    expect(output).toContain('Used:')
    expect(output).toContain('Left:')
  })

  it('renders error state in detailed view', () => {
    const snapshot = createMockSnapshot({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired' },
    })
    const output = renderDetailed(snapshot, { colorize: false })
    expect(output).toContain('error')
    expect(output).toContain('Token expired')
  })

  it('marks low threshold windows', () => {
    const snapshot = createMockSnapshot({
      windows: [
        {
          label: '5h',
          credit: { used: 80, limit: 100, remaining: 20, percentage: 80 },
          isLow: true,
        },
      ],
    })
    const output = renderDetailed(snapshot, { colorize: false })
    expect(output).toContain('low')
  })

  it('marks exhausted windows', () => {
    const snapshot = createMockSnapshot({
      windows: [
        {
          label: '5h',
          credit: { used: 100, limit: 100, remaining: 0, percentage: 100 },
          isExhausted: true,
        },
      ],
    })
    const output = renderDetailed(snapshot, { colorize: false })
    expect(output).toContain('exhausted')
  })
})

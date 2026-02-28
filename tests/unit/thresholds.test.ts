import { describe, it, expect, beforeEach } from 'vitest'
import { ThresholdDetector } from '../../src/core/thresholds.js'
import type { QuotaSnapshot } from '../../src/interfaces/types.js'

function createMockSnapshot(percentage: number): QuotaSnapshot {
  return {
    provider: 'chatgpt-codex',
    windows: [
      {
        id: '5h',
        label: '5h',
        credit: { used: percentage, limit: 100, remaining: 100 - percentage, percentage },
        isExhausted: percentage >= 100,
        isLow: percentage >= 75,
      },
    ],
    fetchedAt: new Date(),
  }
}

describe('ThresholdDetector', () => {
  let detector: ThresholdDetector

  beforeEach(() => {
    detector = new ThresholdDetector({ cooldownMs: 0 })
  })

  it('does not trigger for low percentage', () => {
    const snapshot = createMockSnapshot(25)
    const crossing = detector.check(snapshot)
    expect(crossing).toBeNull()
  })

  it('triggers at 50% threshold', () => {
    const snapshot = createMockSnapshot(50)
    const crossing = detector.check(snapshot)
    expect(crossing).not.toBeNull()
    expect(crossing?.level).toBe(50)
  })

  it('triggers at 75% threshold', () => {
    const snapshot = createMockSnapshot(75)
    const crossing = detector.check(snapshot)
    expect(crossing).not.toBeNull()
    expect(crossing?.level).toBe(75)
  })

  it('triggers at 90% threshold', () => {
    const snapshot = createMockSnapshot(90)
    const crossing = detector.check(snapshot)
    expect(crossing).not.toBeNull()
    expect(crossing?.level).toBe(90)
  })

  it('does not trigger again for same level', () => {
    const snapshot = createMockSnapshot(50)
    detector.check(snapshot)
    const crossing = detector.check(snapshot)
    expect(crossing).toBeNull()
  })

  it('triggers for higher level after lower', () => {
    detector.check(createMockSnapshot(50))
    const crossing = detector.check(createMockSnapshot(75))
    expect(crossing).not.toBeNull()
    expect(crossing?.level).toBe(75)
  })

  it('does not trigger for lower level after higher', () => {
    detector.check(createMockSnapshot(75))
    const crossing = detector.check(createMockSnapshot(50))
    expect(crossing).toBeNull()
  })

  it('resets state correctly', () => {
    detector.check(createMockSnapshot(50))
    detector.reset('chatgpt-codex')
    const crossing = detector.check(createMockSnapshot(50))
    expect(crossing).not.toBeNull()
  })

  it('emits crossing event via callback', () => {
    const crossings: number[] = []
    detector.onCrossing((c) => crossings.push(c.level))

    detector.check(createMockSnapshot(50))
    detector.check(createMockSnapshot(75))

    expect(crossings).toEqual([50, 75])
  })

  it('respects cooldown period', async () => {
    const shortDetector = new ThresholdDetector({ cooldownMs: 10 })
    shortDetector.check(createMockSnapshot(50))

    await new Promise((r) => setTimeout(r, 20))

    shortDetector.reset('chatgpt-codex')
    const crossing = shortDetector.check(createMockSnapshot(50))
    expect(crossing).not.toBeNull()
  })

  it('handles error snapshots gracefully', () => {
    const errorSnapshot: QuotaSnapshot = {
      provider: 'chatgpt-codex',
      windows: [],
      fetchedAt: new Date(),
      error: { code: 'API_ERROR', message: 'Failed' },
    }
    const crossing = detector.check(errorSnapshot)
    expect(crossing).toBeNull()
  })
})

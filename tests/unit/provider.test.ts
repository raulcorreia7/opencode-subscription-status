import { describe, it, expect } from 'vitest'
import { calculateCredit, isLowThreshold, isExhausted } from '../../src/interfaces/provider.js'

describe('calculateCredit', () => {
  it('calculates credit correctly for 0 used', () => {
    const result = calculateCredit(0, 100)
    expect(result).toEqual({
      used: 0,
      limit: 100,
      remaining: 100,
      percentage: 0,
    })
  })

  it('calculates credit correctly for 50 used', () => {
    const result = calculateCredit(50, 100)
    expect(result).toEqual({
      used: 50,
      limit: 100,
      remaining: 50,
      percentage: 50,
    })
  })

  it('calculates credit correctly for 100 used', () => {
    const result = calculateCredit(100, 100)
    expect(result).toEqual({
      used: 100,
      limit: 100,
      remaining: 0,
      percentage: 100,
    })
  })

  it('handles over-limit usage', () => {
    const result = calculateCredit(150, 100)
    expect(result.remaining).toBe(0)
    expect(result.percentage).toBe(150)
  })

  it('handles zero limit', () => {
    const result = calculateCredit(0, 0)
    expect(result.percentage).toBe(0)
    expect(result.remaining).toBe(0)
  })
})

describe('isLowThreshold', () => {
  it('returns false below 75%', () => {
    expect(isLowThreshold(50)).toBe(false)
    expect(isLowThreshold(74)).toBe(false)
  })

  it('returns true at 75% and above', () => {
    expect(isLowThreshold(75)).toBe(true)
    expect(isLowThreshold(80)).toBe(true)
    expect(isLowThreshold(99)).toBe(true)
  })
})

describe('isExhausted', () => {
  it('returns false below 100%', () => {
    expect(isExhausted(50)).toBe(false)
    expect(isExhausted(99)).toBe(false)
  })

  it('returns true at 100% and above', () => {
    expect(isExhausted(100)).toBe(true)
    expect(isExhausted(150)).toBe(true)
  })
})

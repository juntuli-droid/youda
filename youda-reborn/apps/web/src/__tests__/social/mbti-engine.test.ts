import { describe, expect, it } from 'vitest'
import { calculateMbtiCompatibility, calculateMbtiProfile } from '@youda/game-assets'

describe('mbti engine', () => {
  it('derives a four-letter MBTI profile from score map', () => {
    const profile = calculateMbtiProfile({
      A: 6,
      S: 3,
      E: 5,
      W: 4,
      C: 5,
      B: 2,
      P: 4,
      L: 3
    })

    expect(profile.type).toMatch(/^[A-Z]{4}$/)
    expect(profile.confidence).toBeGreaterThanOrEqual(0)
    expect(profile.recommendedPartners.length).toBeGreaterThan(0)
  })

  it('returns a high compatibility score for recommended pairings', () => {
    const compatibility = calculateMbtiCompatibility('INTJ', 'ENFP')
    expect(compatibility.score).toBeGreaterThan(0.85)
    expect(compatibility.band).toMatch(/极佳|优秀/)
  })
})

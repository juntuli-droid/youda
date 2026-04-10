import { MbtiProfile } from '@youda/game-assets'

const MBTI_STORAGE_KEY = 'mbtiProfile'

export function readStoredMbtiProfile() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const value = window.localStorage.getItem(MBTI_STORAGE_KEY)
    if (!value) {
      return null
    }

    return JSON.parse(value) as MbtiProfile
  } catch {
    return null
  }
}

export function writeStoredMbtiProfile(profile: MbtiProfile) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(MBTI_STORAGE_KEY, JSON.stringify(profile))
}

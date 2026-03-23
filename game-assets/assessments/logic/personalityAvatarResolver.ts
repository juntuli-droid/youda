import {
  calculatePersonality,
  getFrequencyLabel,
  getPersonalityMeta
} from "./personalityEngine"
import { getAvatarPathByCharacter, getResultImagePathByCharacter } from "./gameCharacterAvatar"

export function resolvePersonalityAvatarFromScores(scores: Record<string, number>) {
  const personality = calculatePersonality(scores)
  const meta = getPersonalityMeta(personality.code)
  const character = meta.character
  const avatarPath = getAvatarPathByCharacter(character)
  const resultImagePath = getResultImagePathByCharacter(character)
  return {
    personality,
    meta,
    character,
    avatarPath,
    resultImagePath,
    frequencyLabel: getFrequencyLabel(personality.frequency)
  }
}

import {
  calculatePersonality,
  getFrequencyLabel,
  getPersonalityMeta
} from "./personalityEngine"

const CHARACTER_ID_MAP: Record<string, string> = {
  "源氏": "genji",
  "奎托斯": "kratos",
  "猎空": "tracer",
  "布里吉塔": "brigitte",
  "克劳德": "cloud",
  "米法": "mipha",
  "林克": "link",
  "2B": "yorha-2b",
  "派蒙": "paimon",
  "艾希": "ashe",
  "杰洛特": "geralt",
  "吉尔": "jill",
  "温斯顿": "winston",
  "阿米娅": "amiya",
  "马力欧": "mario",
  "里昂": "leon",
  "蒂法": "tifa",
  "艾洛伊": "aloy",
  "卢西奥": "lucio",
  "芭芭拉": "barbara",
  "旅人": "traveler",
  "天使": "mercy",
  "吉安娜": "jaina",
  "塞尔达": "zelda",
  "卡比": "kirby",
  "西施惠": "isabelle",
  "皮克敏": "pikmin"
};

export function getAvatarPathByCharacter(character: string) {
  const id = CHARACTER_ID_MAP[character] || character.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Find the matching prefix number for the character
  const charFiles = [
    "char-01-genji", "char-02-kratos", "char-03-tracer", "char-04-brigitte", "char-05-cloud", 
    "char-06-mipha", "char-07-link", "char-08-yorha-2b", "char-09-paimon", "char-10-ashe", 
    "char-11-geralt", "char-12-jill", "char-13-winston", "char-14-amiya", "char-15-mario", 
    "char-16-leon", "char-17-tifa", "char-18-aloy", "char-19-lucio", "char-20-barbara", 
    "char-21-traveler", "char-22-mercy", "char-23-jaina", "char-24-zelda", "char-25-kirby", 
    "char-26-isabelle", "char-27-pikmin"
  ];
  
  const matchedFile = charFiles.find(file => file.endsWith(`-${id}`)) || `char-00-${id}`;
  
  return `/game-assets/avatars/characters/avatar/${matchedFile}-avatar.png`;
}

export function getResultImagePathByCharacter(character: string) {
  const id = CHARACTER_ID_MAP[character] || character.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const charFiles = [
    "char-01-genji", "char-02-kratos", "char-03-tracer", "char-04-brigitte", "char-05-cloud", 
    "char-06-mipha", "char-07-link", "char-08-yorha-2b", "char-09-paimon", "char-10-ashe", 
    "char-11-geralt", "char-12-jill", "char-13-winston", "char-14-amiya", "char-15-mario", 
    "char-16-leon", "char-17-tifa", "char-18-aloy", "char-19-lucio", "char-20-barbara", 
    "char-21-traveler", "char-22-mercy", "char-23-jaina", "char-24-zelda", "char-25-kirby", 
    "char-26-isabelle", "char-27-pikmin"
  ];
  
  const matchedFile = charFiles.find(file => file.endsWith(`-${id}`)) || `char-00-${id}`;
  
  return `/game-assets/avatars/characters/display/${matchedFile}-display.png`;
}

export function resolveAvatar(typeCode: string) {
  const meta = getPersonalityMeta(typeCode);
  return getAvatarPathByCharacter(meta.character);
}

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

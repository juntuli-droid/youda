import type {
  Question,
  QuestionCategory,
  ScoreKey
} from "../data/personalityQuestions"
type ScoreMap = Partial<Record<ScoreKey, number>>

const STYLE_KEYS: ScoreKey[] = ["A", "B", "S"]
const PERSONALITY_KEYS: ScoreKey[] = ["C", "T", "E"]
const PREFERENCE_KEYS: ScoreKey[] = ["P", "R", "W"]
const FREQUENCY_KEYS: ScoreKey[] = ["F", "L"]

export type QuestionSelectionPlan = Record<QuestionCategory, number>

export const DEFAULT_SELECTION_PLAN: QuestionSelectionPlan = {
  style: 5,
  personality: 4,
  preference: 4,
  frequency: 3
}

export type PersonalityResult = {
  code: string
  baseCode: string
  style: ScoreKey
  personality: ScoreKey
  preference: ScoreKey
  frequency: ScoreKey
  scores: ScoreMap
  confidence: {
    style: number
    personality: number
    preference: number
    frequency: number
  }
}

export function buildScoreMap(
  answers: Array<{ question: Question; optionIndex: number }>
) {
  return answers.reduce<ScoreMap>((acc, { question, optionIndex }) => {
    const option = question.options[optionIndex]
    if (!option) return acc

    for (const key in option.score) {
      if (!Object.prototype.hasOwnProperty.call(option.score, key)) continue
      const value = option.score[key as ScoreKey] ?? 0
      acc[key as ScoreKey] = (acc[key as ScoreKey] ?? 0) + value
    }

    return acc
  }, {})
}

export function calculatePersonality(scores: ScoreMap): PersonalityResult {
  const style = pickDimension(scores, STYLE_KEYS, "B")
  const personality = pickDimension(scores, PERSONALITY_KEYS, "T")
  const preference = pickDimension(scores, PREFERENCE_KEYS, "R")
  const frequency = pickDimension(scores, FREQUENCY_KEYS, "L")

  const baseCode = `${style}${personality}${preference}`
  const code = `${baseCode}-${frequency}`

  return {
    code,
    baseCode,
    style,
    personality,
    preference,
    frequency,
    scores,
    confidence: {
      style: getConfidence(scores, STYLE_KEYS),
      personality: getConfidence(scores, PERSONALITY_KEYS),
      preference: getConfidence(scores, PREFERENCE_KEYS),
      frequency: getConfidence(scores, FREQUENCY_KEYS)
    }
  }
}

function pickDimension(
  scores: ScoreMap,
  keys: ScoreKey[],
  fallback: ScoreKey
): ScoreKey {
  const max = Math.max(...keys.map((key) => scores[key] ?? 0))
  const winners = keys.filter((key) => (scores[key] ?? 0) === max)

  if (winners.length === 1) return winners[0]
  if (winners.indexOf(fallback) >= 0) return fallback

  return winners[0]
}

function getConfidence(scores: ScoreMap, keys: ScoreKey[]) {
  const sorted = keys
    .map((key) => scores[key] ?? 0)
    .sort((a, b) => b - a)

  const [top = 0, second = 0] = sorted
  return Number(((top - second) / Math.max(top, 1)).toFixed(2))
}

export function pickQuestions(
  questionBank: Question[],
  plan: QuestionSelectionPlan = DEFAULT_SELECTION_PLAN
) {
  const grouped: Record<QuestionCategory, Question[]> = {
    style: [],
    personality: [],
    preference: [],
    frequency: []
  }

  for (const question of questionBank) {
    grouped[question.category].push(question)
  }

  const selected: Question[] = []

  ;(Object.keys(plan) as QuestionCategory[]).forEach((category) => {
    const pool = shuffle(grouped[category])
    selected.push(...pool.slice(0, plan[category]))
  })

  return shuffle(selected)
}

function shuffle<T>(list: T[]) {
  const arr = [...list]

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

const STYLE_META = {
  A: {
    label: "主动进攻型",
    summary: "更敢于开节奏、抢先手，遇到机会时通常会先动起来"
  },
  B: {
    label: "稳健平衡型",
    summary: "更重视判断、节奏和容错，倾向于用更稳的方法赢"
  },
  S: {
    label: "沟通协作型",
    summary: "更在意配合和团队状态，擅长把大家拧成一股绳"
  }
} satisfies Record<"A" | "B" | "S", { label: string; summary: string }>

const PERSONALITY_META = {
  C: {
    label: "胜负驱动型",
    summary: "你会被挑战、对抗和明确结果激发动力"
  },
  T: {
    label: "组队共斗型",
    summary: "你会因为并肩作战和默契配合而持续投入"
  },
  E: {
    label: "体验探索型",
    summary: "你会被新鲜感、世界体验和过程乐趣吸引"
  }
} satisfies Record<"C" | "T" | "E", { label: string; summary: string }>

const PREFERENCE_META = {
  P: {
    label: "目标推进偏好",
    summary: "你喜欢清晰目标、明确阶段和看得见的进度感"
  },
  R: {
    label: "成长养成偏好",
    summary: "你享受 build、培养、数值成长和长期规划"
  },
  W: {
    label: "世界沉浸偏好",
    summary: "你会被地图、剧情、设定和内容细节持续吸引"
  }
} satisfies Record<"P" | "R" | "W", { label: string; summary: string }>

const FREQUENCY_META = {
  F: {
    label: "高频玩家",
    summary: "更适合高响应、能经常一起上线的搭子关系"
  },
  L: {
    label: "轻量玩家",
    summary: "更适合轻压力、弹性安排、不会互相绑时间的搭子关系"
  }
} satisfies Record<"F" | "L", { label: string; summary: string }>

const CHARACTER_MAP: Record<string, string> = {
  ACP: "源氏",
  ACR: "奎托斯",
  ACW: "猎空",
  ATP: "布里吉塔",
  ATR: "克劳德",
  ATW: "米法",
  AEP: "林克",
  AER: "2B",
  AEW: "派蒙",
  BCP: "艾希",
  BCR: "杰洛特",
  BCW: "吉尔",
  BTP: "温斯顿",
  BTR: "阿米娅",
  BTW: "马力欧",
  BEP: "里昂",
  BER: "蒂法",
  BEW: "艾洛伊",
  SCP: "卢西奥",
  SCR: "芭芭拉",
  SCW: "旅人",
  STP: "天使",
  STR: "吉安娜",
  STW: "塞尔达",
  SEP: "卡比",
  SER: "西施惠",
  SEW: "皮克敏"
}

export function getCharacterNameList() {
  return [...new Set(Object.values(CHARACTER_MAP))]
}

export function getCharacterByBaseCode(baseCode: string) {
  return CHARACTER_MAP[baseCode] || "神秘角色"
}

export function getPersonalityMeta(code: string) {
  const [baseCode, frequencyCode] = code.indexOf("-") >= 0
    ? (code.split("-") as [string, string])
    : [code, "L"]

  const [style, personality, preference] = baseCode.split("") as [
    "A" | "B" | "S",
    "C" | "T" | "E",
    "P" | "R" | "W"
  ]
  const frequency = (frequencyCode || "L") as "F" | "L"

  const styleMeta = STYLE_META[style]
  const personalityMeta = PERSONALITY_META[personality]
  const preferenceMeta = PREFERENCE_META[preference]
  const frequencyMeta = FREQUENCY_META[frequency]

  return {
    title: `${styleMeta.label} · ${personalityMeta.label} · ${preferenceMeta.label}`,
    description: `你在游戏里 ${styleMeta.summary}；同时 ${personalityMeta.summary}；并且 ${preferenceMeta.summary}。在搭子关系里，你属于 ${frequencyMeta.label}，${frequencyMeta.summary}。`,
    character: getCharacterByBaseCode(baseCode),
    tags: [
      styleMeta.label,
      personalityMeta.label,
      preferenceMeta.label,
      frequencyMeta.label
    ]
  }
}

export function getStyleLabel(style: string) {
  if (style === "A") return STYLE_META.A.label
  if (style === "B") return STYLE_META.B.label
  return STYLE_META.S.label
}

export function getPersonalityLabel(personality: string) {
  if (personality === "C") return PERSONALITY_META.C.label
  if (personality === "T") return PERSONALITY_META.T.label
  return PERSONALITY_META.E.label
}

export function getPreferenceLabel(preference: string) {
  if (preference === "P") return PREFERENCE_META.P.label
  if (preference === "R") return PREFERENCE_META.R.label
  return PREFERENCE_META.W.label
}

export function getFrequencyLabel(frequency: string) {
  if (frequency === "F") return FREQUENCY_META.F.label
  return FREQUENCY_META.L.label
}

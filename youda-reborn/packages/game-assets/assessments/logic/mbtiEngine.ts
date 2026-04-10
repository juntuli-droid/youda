import type { ScoreKey } from "../question-bank/personalityQuestions"

type ScoreMap = Partial<Record<ScoreKey, number>>

type MbtiLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P"
type MbtiAxis = "EI" | "SN" | "TF" | "JP"

export type MbtiType =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP"

export type MbtiProfile = {
  type: MbtiType
  title: string
  summary: string
  confidence: number
  dominantGameStyle: string
  recommendedPartners: MbtiType[]
  axes: Record<
    MbtiAxis,
    {
      left: MbtiLetter
      right: MbtiLetter
      leftScore: number
      rightScore: number
      winner: MbtiLetter
      confidence: number
    }
  >
}

type AxisDefinition = {
  axis: MbtiAxis
  left: MbtiLetter
  right: MbtiLetter
  leftWeights: Partial<Record<ScoreKey, number>>
  rightWeights: Partial<Record<ScoreKey, number>>
}

const AXIS_DEFINITIONS: AxisDefinition[] = [
  {
    axis: "EI",
    left: "E",
    right: "I",
    leftWeights: { A: 1.25, S: 1.1, T: 0.75, F: 0.35 },
    rightWeights: { B: 1.2, R: 0.6, L: 0.55, W: 0.25 }
  },
  {
    axis: "SN",
    left: "S",
    right: "N",
    leftWeights: { C: 1.1, P: 1.0, B: 0.5, T: 0.25 },
    rightWeights: { E: 1.2, W: 1.1, A: 0.45, R: 0.35 }
  },
  {
    axis: "TF",
    left: "T",
    right: "F",
    leftWeights: { C: 1.1, A: 0.8, B: 0.7, P: 0.25 },
    rightWeights: { S: 1.15, T: 1.0, W: 0.4, L: 0.25 }
  },
  {
    axis: "JP",
    left: "J",
    right: "P",
    leftWeights: { B: 1.05, P: 0.9, R: 0.55, F: 0.45 },
    rightWeights: { A: 0.75, E: 1.05, W: 0.6, L: 0.45 }
  }
]

const MBTI_META: Record<
  MbtiType,
  {
    title: string
    summary: string
    dominantGameStyle: string
    recommendedPartners: MbtiType[]
  }
> = {
  INTJ: {
    title: "策略总控者",
    summary: "你会优先观察全局、建立最优路径，再用稳定执行把胜率拉到更高。",
    dominantGameStyle: "宏观运营、目标控制、后期决策",
    recommendedPartners: ["ENFP", "ENTP", "ESFP"]
  },
  INTP: {
    title: "机制拆解者",
    summary: "你擅长理解系统和机制，喜欢用非常规思路找到更优玩法。",
    dominantGameStyle: "机制理解、阵容实验、冷静分析",
    recommendedPartners: ["ENTJ", "ENFJ", "ESFJ"]
  },
  ENTJ: {
    title: "指挥推进者",
    summary: "你很适合带节奏、下决策，把个人判断快速转成队伍行动。",
    dominantGameStyle: "团队指挥、开节奏、推进终结",
    recommendedPartners: ["INFP", "INTP", "ISFP"]
  },
  ENTP: {
    title: "高能破局者",
    summary: "你喜欢临场创造机会，擅长把看似普通的局面打出意外上限。",
    dominantGameStyle: "破局开团、灵感战术、快速应变",
    recommendedPartners: ["INFJ", "INTJ", "ISFJ"]
  },
  INFJ: {
    title: "默契构建者",
    summary: "你能同时照顾团队情绪和赢法结构，是少见的节奏润滑剂。",
    dominantGameStyle: "团队连接、信息同步、节奏护理",
    recommendedPartners: ["ENTP", "ENFP", "ESTP"]
  },
  INFP: {
    title: "氛围守护者",
    summary: "你重视舒适沟通和真实默契，适合长期稳定的固定搭子关系。",
    dominantGameStyle: "长线协作、情绪稳定、沉浸陪伴",
    recommendedPartners: ["ENTJ", "ENFJ", "ESTJ"]
  },
  ENFJ: {
    title: "团队放大器",
    summary: "你擅长激发队友状态，把普通开黑逐渐带成很顺的团队节奏。",
    dominantGameStyle: "沟通组织、士气提升、队伍统筹",
    recommendedPartners: ["INFP", "ISFP", "ISTP"]
  },
  ENFP: {
    title: "气氛点火器",
    summary: "你有很强的社交感染力，容易把游戏过程变成高参与感的体验。",
    dominantGameStyle: "活跃氛围、即兴协作、轻快多变",
    recommendedPartners: ["INTJ", "INFJ", "ISTJ"]
  },
  ISTJ: {
    title: "稳定支柱",
    summary: "你偏爱可靠和可复现的赢法，是队伍里非常值得信任的底盘。",
    dominantGameStyle: "纪律执行、资源规划、稳态防守",
    recommendedPartners: ["ENFP", "ESFP", "ESTP"]
  },
  ISFJ: {
    title: "后勤保障者",
    summary: "你习惯在细节上照顾队友，适合辅助、续航和持续支援类定位。",
    dominantGameStyle: "资源照护、辅助支持、补位协防",
    recommendedPartners: ["ENTP", "ESTP", "ENFP"]
  },
  ESTJ: {
    title: "秩序推进者",
    summary: "你讲究效率和结果，很适合把杂乱局面迅速整理成可执行策略。",
    dominantGameStyle: "执行统筹、目标推进、效率分工",
    recommendedPartners: ["INFP", "ISFP", "ISTP"]
  },
  ESFJ: {
    title: "团队协调官",
    summary: "你善于把队伍协作维持在舒服且高效的区间，适合长期组排。",
    dominantGameStyle: "角色补位、团队照顾、稳定协作",
    recommendedPartners: ["INTP", "ISTP", "INFP"]
  },
  ISTP: {
    title: "冷静操作手",
    summary: "你遇事不慌、反应快，适合承担残局、反打和关键拆解位。",
    dominantGameStyle: "残局处理、临场反应、微操兑现",
    recommendedPartners: ["ENFJ", "ESFJ", "ESTJ"]
  },
  ISFP: {
    title: "节奏感玩家",
    summary: "你在体验和手感之间找平衡，常常能在舒服的节奏里打出亮点。",
    dominantGameStyle: "手感发挥、稳态输出、体验协调",
    recommendedPartners: ["ENTJ", "ENFJ", "ESTJ"]
  },
  ESTP: {
    title: "高压突破手",
    summary: "你擅长在对抗中创造即时价值，是非常典型的前线破口制造者。",
    dominantGameStyle: "先手突破、快速压制、临场兑现",
    recommendedPartners: ["INFJ", "ISFJ", "ISTJ"]
  },
  ESFP: {
    title: "快乐节奏王",
    summary: "你会把游戏中的情绪与节奏点燃，适合组排里负责启动欢乐和行动。",
    dominantGameStyle: "积极互动、快节奏推进、热场协作",
    recommendedPartners: ["INTJ", "ISTJ", "ISFJ"]
  }
}

function computeWeightedScore(
  scores: ScoreMap,
  weights: Partial<Record<ScoreKey, number>>
) {
  return Object.entries(weights).reduce((total, [key, weight]) => {
    return total + (scores[key as ScoreKey] ?? 0) * (weight ?? 0)
  }, 0)
}

function computeAxis(scores: ScoreMap, definition: AxisDefinition) {
  const leftScore = computeWeightedScore(scores, definition.leftWeights)
  const rightScore = computeWeightedScore(scores, definition.rightWeights)
  const winner = leftScore >= rightScore ? definition.left : definition.right
  const confidence = Number(
    (
      Math.abs(leftScore - rightScore) /
      Math.max(Math.max(leftScore, rightScore), 1)
    ).toFixed(2)
  )

  return {
    left: definition.left,
    right: definition.right,
    leftScore: Number(leftScore.toFixed(2)),
    rightScore: Number(rightScore.toFixed(2)),
    winner,
    confidence
  }
}

export function calculateMbtiProfile(scores: ScoreMap): MbtiProfile {
  const axes = AXIS_DEFINITIONS.reduce<MbtiProfile["axes"]>((acc, definition) => {
    acc[definition.axis] = computeAxis(scores, definition)
    return acc
  }, {} as MbtiProfile["axes"])

  const type = `${axes.EI.winner}${axes.SN.winner}${axes.TF.winner}${axes.JP.winner}` as MbtiType
  const meta = MBTI_META[type]
  const confidence = Number(
    (
      (axes.EI.confidence +
        axes.SN.confidence +
        axes.TF.confidence +
        axes.JP.confidence) /
      4
    ).toFixed(2)
  )

  return {
    type,
    title: meta.title,
    summary: meta.summary,
    confidence,
    dominantGameStyle: meta.dominantGameStyle,
    recommendedPartners: meta.recommendedPartners,
    axes
  }
}

function scoreAxisCompatibility(
  axis: MbtiAxis,
  left: MbtiLetter,
  right: MbtiLetter
) {
  if (axis === "EI") return left === right ? 0.82 : 0.94
  if (axis === "SN") return left === right ? 0.94 : 0.74
  if (axis === "TF") return left === right ? 0.8 : 0.96
  return left === right ? 0.78 : 0.92
}

export function calculateMbtiCompatibility(
  left: MbtiType,
  right: MbtiType
) {
  const axisScores = {
    EI: scoreAxisCompatibility("EI", left[0] as MbtiLetter, right[0] as MbtiLetter),
    SN: scoreAxisCompatibility("SN", left[1] as MbtiLetter, right[1] as MbtiLetter),
    TF: scoreAxisCompatibility("TF", left[2] as MbtiLetter, right[2] as MbtiLetter),
    JP: scoreAxisCompatibility("JP", left[3] as MbtiLetter, right[3] as MbtiLetter)
  }

  const recommendedBonus =
    MBTI_META[left].recommendedPartners.includes(right) ||
    MBTI_META[right].recommendedPartners.includes(left)
      ? 0.05
      : 0
  const identicalBonus = left === right ? 0.03 : 0
  const rawScore =
    axisScores.EI * 0.2 +
    axisScores.SN * 0.3 +
    axisScores.TF * 0.25 +
    axisScores.JP * 0.25 +
    recommendedBonus +
    identicalBonus
  const score = Number(Math.min(0.99, rawScore).toFixed(4))

  const band = score >= 0.9 ? "极佳" : score >= 0.82 ? "优秀" : score >= 0.74 ? "良好" : "可磨合"
  const highlights: string[] = []

  if (axisScores.EI >= 0.9) highlights.push("社交能量一动一静，开黑更容易互补")
  if (axisScores.SN >= 0.9) highlights.push("信息理解方式接近，战术沟通成本更低")
  if (axisScores.TF >= 0.9) highlights.push("决策风格形成平衡，既能算赢法也能顾体验")
  if (axisScores.JP >= 0.9) highlights.push("节奏控制互补，推进和临场调整都更顺")

  return {
    score,
    band,
    highlights,
    summary: `${left} 与 ${right} 的游戏社交兼容度为 ${Math.round(score * 100)}%，评级 ${band}。`
  }
}

export function getMbtiMeta(type: MbtiType) {
  return MBTI_META[type]
}

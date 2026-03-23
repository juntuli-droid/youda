export type ScoreKey =
  | "A"
  | "B"
  | "S"
  | "C"
  | "T"
  | "E"
  | "P"
  | "R"
  | "W"
  | "F"
  | "L"

export type QuestionCategory =
  | "style"
  | "personality"
  | "preference"
  | "frequency"

export type QuestionOption = {
  label: string
  score: Partial<Record<ScoreKey, number>>
}

export type Question = {
  id: number
  category: QuestionCategory
  title: string
  options: QuestionOption[]
  tags?: string[]
  difficulty?: "easy" | "medium" | "hard"
}

export const questions: Question[] = [
  {
    id: 1,
    category: "style",
    title: "当队伍缺少开局节奏时，你通常会？",
    options: [
      { label: "主动试探，先把局面打活", score: { A: 2 } },
      { label: "先看对面信息，再决定怎么动",score: { B: 2 } },
      { label: "先问队友想法，确认后一起动", score: { S: 2 } }
    ]
  },
  {
    id: 2,
    category: "style",
    title: "残局 1v2 或资源劣势时，你更常见的做法是？",
    options: [
      { label: "找机会拼一波翻盘", score: { A: 2 } },
      { label: "优先保住现有收益", score: { B: 2 } },
      { label: "想办法等队友一起处理", score: { S: 2 } }
    ]
  },
  {
    id: 3,
    category: "style",
    title: "开黑时如果大家意见不统一，你更像？",
    options: [
      { label: "先给一个明确方向", score: { A: 2 } },
      { label: "把利弊讲清再选方案", score: { B: 2 } },
      { label: "优先让大家达成共识", score: { S: 2 } }
    ]
  },
  {
    id: 4,
    category: "style",
    title: "你在游戏里最容易上头的是？",
    options: [
      { label: "看到机会没打到", score: { A: 2 } },
      { label: "本来能稳却失误了", score: { B: 2 } },
      { label: "队友之间配合断掉", score: { S: 2 } }
    ]
  },
  {
    id: 5,
    category: "style",
    title: "遇到陌生地图或新机制时，你更可能？",
    options: [
      { label: "直接试，实践里找感觉", score: { A: 2 } },
      { label: "先观察规则，摸清再上", score: { B: 2 } },
      { label: "先和朋友边聊边试", score: { S: 2 } }
    ]
  },
  {
    id: 6,
    category: "style",
    title: "在团队里别人通常会把什么交给你？",
    options: [
      { label: "开第一枪/打第一波", score: { A: 2 } },
      { label: "看局势/做保险方案", score: { B: 2 } },
      { label: "沟通协调/照顾整体体验", score: { S: 2 } }
    ]
  },
  {
    id: 7,
    category: "style",
    title: "你更认可哪种‘强’？",
    options: [
      { label: "关键时刻能创造机会", score: { A: 2 } },
      { label: "整局都很稳几乎不失误", score: { B: 2 } },
      { label: "能把所有人都串起来", score: { S: 2 } }
    ]
  },
  {
    id: 8,
    category: "style",
    title: "面对强势对手时，你会？",
    options: [
      { label: "越强越想正面碰一碰", score: { A: 2 } },
      { label: "先研究对手套路再应对", score: { B: 2 } },
      { label: "和队友多沟通，尽量别各打各的", score: { S: 2 } }
    ]
  },
  {
    id: 9,
    category: "style",
    title: "游戏里突然出现意外情况，你的第一反应更像？",
    options: [
      { label: "先动起来，别让机会溜走", score: { A: 2 } },
      { label: "先止损，控制风险", score: { B: 2 } },
      { label: "先报点/提醒，保证信息同步", score: { S: 2 } }
    ]
  },
  {
    id: 10,
    category: "style",
    title: "如果只能选一种队内定位，你更想做？",
    options: [
      { label: "先手开局的人", score: { A: 2 } },
      { label: "负责兜底的人", score: { B: 2 } },
      { label: "让队伍更顺的人", score: { S: 2 } }
    ]
  },
  {
    id: 11,
    category: "style",
    title: "你更喜欢怎样的获胜方式？",
    options: [
      { label: "靠进攻压出来", score: { A: 2 } },
      { label: "靠运营稳出来", score: { B: 2 } },
      { label: "靠配合磨出来", score: { S: 2 } }
    ]
  },
  {
    id: 12,
    category: "style",
    title: "当游戏进入拉扯期，你通常会？",
    options: [
      { label: "继续找破口，逼对方失误", score: { A: 2 } },
      { label: "保持耐心，等更稳的时机", score: { B: 2 } },
      { label: "提醒队友站位和节奏", score: { S: 2 } }
    ]
  },
  {
    id: 13,
    category: "style",
    title: "在多排里你最像哪种朋友？",
    options: [
      { label: "会喊‘跟我上’的人", score: { A: 2 } },
      { label: "会说‘别急还能打’的人", score: { B: 2 } },
      { label: "会说‘先统一一下’的人", score: { S: 2 } }
    ]
  },
  {
    id: 14,
    category: "style",
    title: "你对‘失误’这件事最在意什么？",
    options: [
      { label: "错过了本该打的机会", score: { A: 2 } },
      { label: "因为不谨慎导致崩盘", score: { B: 2 } },
      { label: "影响了队伍气氛和配合", score: { S: 2 } }
    ]
  },
  {
    id: 15,
    category: "style",
    title: "当有两个看起来都不错的方案时，你更偏向？",
    options: [
      { label: "选更有爆发力的那个", score: { A: 2 } },
      { label: "选收益更稳定的那个", score: { B: 2 } },
      { label: "选队伍最好执行的那个", score: { S: 2 } }
    ]
  },
  {
    id: 16,
    category: "style",
    title: "你更容易成为哪种玩家？",
    options: [
      { label: "敢打敢拼型", score: { A: 2 } },
      { label: "稳扎稳打型", score: { B: 2 } },
      { label: "会聊会配合型", score: { S: 2 } }
    ]
  },
  {
    id: 17,
    category: "style",
    title: "如果朋友说‘这把靠你带节奏’，你会？",
    options: [
      { label: "挺好，我来找机会", score: { A: 2 } },
      { label: "可以，但先把信息和节奏理清", score: { B: 2 } },
      { label: "没问题，不过大家得多沟通", score: { S: 2 } }
    ]
  },
  {
    id: 18,
    category: "style",
    title: "你最不喜欢哪种队友风格？",
    options: [
      { label: "太怂，机会来了也不打", score: { A: 2 } },
      { label: "太浪，没把握还硬上", score: { B: 2 } },
      { label: "不交流，各玩各的", score: { S: 2 } }
    ]
  },
  {
    id: 19,
    category: "personality",
    title: "你最有动力打开游戏的原因是？",
    options: [
      { label: "想赢，想证明自己", score: { C: 2 } },
      { label: "想和人并肩完成目标", score: { T: 2 } },
      { label: "想放松并体验内容", score: { E: 2 } }
    ]
  },
  {
    id: 20,
    category: "personality",
    title: "在选择今晚玩什么时，你更容易被哪类内容吸引？",
    options: [
      { label: "排位/竞技/对抗", score: { C: 2 } },
      { label: "副本/任务/合作挑战", score: { T: 2 } },
      { label: "剧情/地图/探索收集", score: { E: 2 } }
    ]
  },
  {
    id: 21,
    category: "personality",
    title: "你会更享受哪种成就感？",
    options: [
      { label: "打赢难缠对手", score: { C: 2 } },
      { label: "和队友一起打通难关", score: { T: 2 } },
      { label: "发现好玩的新内容", score: { E: 2 } }
    ]
  },
  {
    id: 22,
    category: "personality",
    title: "如果一个游戏只有一个核心卖点，你更希望它是？",
    options: [
      { label: "对抗强、手感好", score: { C: 2 } },
      { label: "联机顺、合作爽", score: { T: 2 } },
      { label: "世界观和内容丰富", score: { E: 2 } }
    ]
  },
  {
    id: 23,
    category: "personality",
    title: "你更能接受哪种‘重复’？",
    options: [
      { label: "反复练同一套打法冲更高段位", score: { C: 2 } },
      { label: "反复磨同一关直到团队过本", score: { T: 2 } },
      { label: "反复逛同一张图挖细节和彩蛋", score: { E: 2 } }
    ]
  },
  {
    id: 24,
    category: "personality",
    title: "你更常把‘这把值了’定义为？",
    options: [
      { label: "赢得漂亮", score: { C: 2 } },
      { label: "配合得舒服", score: { T: 2 } },
      { label: "过程很有趣", score: { E: 2 } }
    ]
  },
  {
    id: 25,
    category: "personality",
    title: "一个游戏让你长期留下来的关键通常是？",
    options: [
      { label: "有持续挑战和明确排名", score: { C: 2 } },
      { label: "能和固定搭子长期一起玩", score: { T: 2 } },
      { label: "内容足够多、体验不容易腻", score: { E: 2 } }
    ]
  },
  {
    id: 26,
    category: "personality",
    title: "如果你推荐游戏给朋友，你最先强调什么？",
    options: [
      { label: "对抗刺激，玩起来很上头", score: { C: 2 } },
      { label: "一起玩特别有意思", score: { T: 2 } },
      { label: "剧情和世界体验很棒", score: { E: 2 } }
    ]
  },
  {
    id: 27,
    category: "personality",
    title: "你对‘输赢’的态度更接近？",
    options: [
      { label: "很重要，最好有明确结果", score: { C: 2 } },
      { label: "重要，但更看重团队过程", score: { T: 2 } },
      { label: "没那么重要，开心更重要", score: { E: 2 } }
    ]
  },
  {
    id: 28,
    category: "personality",
    title: "周末有整块时间，你更想？",
    options: [
      { label: "冲分或挑战更高难度", score: { C: 2 } },
      { label: "和朋友约长线合作内容", score: { T: 2 } },
      { label: "沉浸式体验一个游戏世界", score: { E: 2 } }
    ]
  },
  {
    id: 29,
    category: "personality",
    title: "你更偏好哪种游戏回忆？",
    options: [
      { label: "那场翻盘太爽了", score: { C: 2 } },
      { label: "那次配合太默契了", score: { T: 2 } },
      { label: "那个场景/剧情太难忘了", score: { E: 2 } }
    ]
  },
  {
    id: 30,
    category: "personality",
    title: "你最想从搭子身上得到什么？",
    options: [
      { label: "目标一致，认真想赢", score: { C: 2 } },
      { label: "愿意沟通，配合默契", score: { T: 2 } },
      { label: "相处轻松，体验同频", score: { E: 2 } }
    ]
  },
  {
    id: 31,
    category: "personality",
    title: "如果游戏更新了一个新模式，你最先关注？",
    options: [
      { label: "强度和上限高不高", score: { C: 2 } },
      { label: "能不能和朋友一起玩得更顺", score: { T: 2 } },
      { label: "新内容有没有新鲜感", score: { E: 2 } }
    ]
  },
  {
    id: 32,
    category: "personality",
    title: "你最容易因为什么弃坑？",
    options: [
      { label: "匹配/平衡太差，影响竞技体验", score: { C: 2 } },
      { label: "队友难找，合作体验断档", score: { T: 2 } },
      { label: "内容见底，失去新鲜感", score: { E: 2 } }
    ]
  },
  {
    id: 33,
    category: "personality",
    title: "看游戏直播时，你更常点开哪种内容？",
    options: [
      { label: "高分操作和比赛", score: { C: 2 } },
      { label: "固定车队/多人配合", score: { T: 2 } },
      { label: "剧情解说/隐藏内容/整活探索", score: { E: 2 } }
    ]
  },
  {
    id: 34,
    category: "personality",
    title: "你更喜欢哪种‘难’？",
    options: [
      { label: "和真人博弈的难", score: { C: 2 } },
      { label: "团队协作的难", score: { T: 2 } },
      { label: "摸索世界和机制的难", score: { E: 2 } }
    ]
  },
  {
    id: 35,
    category: "personality",
    title: "如果今天状态一般，你也更可能去玩？",
    options: [
      { label: "一局定胜负的竞技内容", score: { C: 2 } },
      { label: "熟人一起做目标的内容", score: { T: 2 } },
      { label: "轻松探索或养成内容", score: { E: 2 } }
    ]
  },
  {
    id: 36,
    category: "personality",
    title: "对你来说，最理想的游戏夜晚是？",
    options: [
      { label: "赢下几场关键对局", score: { C: 2 } },
      { label: "和朋友配合特别顺", score: { T: 2 } },
      { label: "发现很多意料之外的乐趣", score: { E: 2 } }
    ]
  },
  {
    id: 37,
    category: "preference",
    title: "开新档时，你第一件最想推进的是？",
    options: [
      { label: "主线/任务目标", score: { P: 2 } },
      { label: "角色/装备/数值成长", score: { R: 2 } },
      { label: "地图/剧情/世界细节", score: { W: 2 } }
    ]
  },
  {
    id: 38,
    category: "preference",
    title: "你最容易因为哪类系统而上头？",
    options: [
      { label: "清单式目标和阶段推进", score: { P: 2 } },
      { label: "Build、天赋、装备搭配", score: { R: 2 } },
      { label: "地图彩蛋、设定和故事", score: { W: 2 } }
    ]
  },
  {
    id: 39,
    category: "preference",
    title: "看到一堆待办内容时，你通常先做？",
    options: [
      { label: "先清最关键的目标", score: { P: 2 } },
      { label: "先做能提升战力的内容", score: { R: 2 } },
      { label: "先挑最感兴趣的世界内容", score: { W: 2 } }
    ]
  },
  {
    id: 40,
    category: "preference",
    title: "你更喜欢哪类奖励反馈？",
    options: [
      { label: "任务完成、进度明显前进", score: { P: 2 } },
      { label: "角色变强、配置成型", score: { R: 2 } },
      { label: "解锁新区域/新剧情/新设定", score: { W: 2 } }
    ]
  },
  {
    id: 41,
    category: "preference",
    title: "如果一个游戏内容很多，你的游玩顺序更像？",
    options: [
      { label: "先主线后支线", score: { P: 2 } },
      { label: "先把养成路线理顺", score: { R: 2 } },
      { label: "哪儿好奇先去哪儿", score: { W: 2 } }
    ]
  },
  {
    id: 42,
    category: "preference",
    title: "你最愿意投入时间研究的是？",
    options: [
      { label: "路线和目标效率", score: { P: 2 } },
      { label: "职业搭配和资源分配", score: { R: 2 } },
      { label: "世界背景和隐藏内容", score: { W: 2 } }
    ]
  },
  {
    id: 43,
    category: "preference",
    title: "对于‘刷’这件事，你更能接受哪种？",
    options: [
      { label: "为了尽快推进阶段目标而刷", score: { P: 2 } },
      { label: "为了做出更强配置而刷", score: { R: 2 } },
      { label: "为了收集图鉴/故事碎片而刷", score: { W: 2 } }
    ]
  },
  {
    id: 44,
    category: "preference",
    title: "你做选择时更看重？",
    options: [
      { label: "是不是最接近当前目标", score: { P: 2 } },
      { label: "是不是最利于长期成长", score: { R: 2 } },
      { label: "是不是最符合这个世界的体验", score: { W: 2 } }
    ]
  },
  {
    id: 45,
    category: "preference",
    title: "你更可能收藏哪类攻略？",
    options: [
      { label: "任务线/流程路线图", score: { P: 2 } },
      { label: "配装/养成/收益表", score: { R: 2 } },
      { label: "地图收集/剧情梳理", score: { W: 2 } }
    ]
  },
  {
    id: 46,
    category: "preference",
    title: "如果今天只剩半小时，你更想？",
    options: [
      { label: "推进一段明确进度", score: { P: 2 } },
      { label: "做一点提升账号价值的事", score: { R: 2 } },
      { label: "看一段剧情或逛一个地方", score: { W: 2 } }
    ]
  },
  {
    id: 47,
    category: "preference",
    title: "你最享受哪种‘掌控感’？",
    options: [
      { label: "知道接下来该做什么", score: { P: 2 } },
      { label: "知道怎么把角色养到最好", score: { R: 2 } },
      { label: "知道这个世界还有什么秘密", score: { W: 2 } }
    ]
  },
  {
    id: 48,
    category: "preference",
    title: "你对支线内容的态度更接近？",
    options: [
      { label: "不影响主目标的话再做", score: { P: 2 } },
      { label: "看奖励值不值得做", score: { R: 2 } },
      { label: "有意思就会顺手全看", score: { W: 2 } }
    ]
  },
  {
    id: 49,
    category: "preference",
    title: "你更容易被哪类朋友带着玩？",
    options: [
      { label: "目标明确、节奏清楚的人", score: { P: 2 } },
      { label: "研究很多、懂搭配的人", score: { R: 2 } },
      { label: "知道很多细节和彩蛋的人", score: { W: 2 } }
    ]
  },
  {
    id: 50,
    category: "preference",
    title: "在游戏社区里，你更常搜什么？",
    options: [
      { label: "版本目标/速通/路线", score: { P: 2 } },
      { label: "角色强度/培养建议", score: { R: 2 } },
      { label: "剧情解析/地图彩蛋", score: { W: 2 } }
    ]
  },
  {
    id: 51,
    category: "preference",
    title: "你更想被称为什么样的玩家？",
    options: [
      { label: "推进效率高的人", score: { P: 2 } },
      { label: "养成规划强的人", score: { R: 2 } },
      { label: "最会体验内容的人", score: { W: 2 } }
    ]
  },
  {
    id: 52,
    category: "preference",
    title: "面对大型更新，你最先冲向哪里？",
    options: [
      { label: "新主线和关键玩法", score: { P: 2 } },
      { label: "新角色/新装备/新系统", score: { R: 2 } },
      { label: "新地图和新故事", score: { W: 2 } }
    ]
  },
  {
    id: 53,
    category: "preference",
    title: "如果要安利同一个游戏，你更会强调？",
    options: [
      { label: "目标清晰，玩起来很有推进感", score: { P: 2 } },
      { label: "培养空间大，越玩越有深度", score: { R: 2 } },
      { label: "世界有魅力，很容易沉浸", score: { W: 2 } }
    ]
  },
  {
    id: 54,
    category: "preference",
    title: "你最怕一种‘无聊’是？",
    options: [
      { label: "没有明确目标，不知道该干嘛", score: { P: 2 } },
      { label: "成长停滞，提升感太弱", score: { R: 2 } },
      { label: "世界空洞，没有探索欲", score: { W: 2 } }
    ]
  },
  {
    id: 55,
    category: "frequency",
    title: "你平时的游戏频率更接近？",
    options: [
      { label: "基本每天都会玩", score: { F: 2 } },
      { label: "一周会玩几次，但不固定", score: { F: 1, L: 1 } },
      { label: "看时间安排，比较随缘", score: { L: 2 } }
    ]
  },
  {
    id: 56,
    category: "frequency",
    title: "你和搭子约游戏时，通常是？",
    options: [
      { label: "大多数时候都能约上", score: { F: 2 } },
      { label: "需要提前约一下时间", score: { F: 1, L: 1 } },
      { label: "只有偶尔碰上空档才会玩", score: { L: 2 } }
    ]
  },
  {
    id: 57,
    category: "frequency",
    title: "遇到喜欢的游戏，你一般会？",
    options: [
      { label: "连续很多天都上线", score: { F: 2 } },
      { label: "阶段性很投入，忙时会断", score: { F: 1, L: 1 } },
      { label: "想起来再回去玩", score: { L: 2 } }
    ]
  },
  {
    id: 58,
    category: "frequency",
    title: "你的游戏时长更像哪种？",
    options: [
      { label: "日常固定留出一段时间", score: { F: 2 } },
      { label: "有空时玩一阵，没空就停", score: { F: 1, L: 1 } },
      { label: "节奏不固定，主打随缘", score: { L: 2 } }
    ]
  },
  {
    id: 59,
    category: "frequency",
    title: "如果朋友突然喊你开黑，你通常会？",
    options: [
      { label: "大概率已经在线或很快能上", score: { F: 2 } },
      { label: "要看当天安排", score: { F: 1, L: 1 } },
      { label: "多数时候只能改天", score: { L: 2 } }
    ]
  },
  {
    id: 60,
    category: "frequency",
    title: "你更适合哪种搭子节奏？",
    options: [
      { label: "高频稳定一起玩", score: { F: 2 } },
      { label: "能约就约，弹性安排", score: { F: 1, L: 1 } },
      { label: "彼此轻松，不强求上线", score: { L: 2 } }
    ]
  }
]

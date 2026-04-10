export type EmptyStateScenario =
  | 'missing-avatar'
  | 'missing-profile'
  | 'no-friends'
  | 'no-vlogs'
  | 'no-careers'
  | 'no-messages'
  | 'network-error'
  | 'permission-denied'
  | 'search-empty'
  | 'partner-left-room'

type EmptyStateCopy = {
  eyebrow: string
  title: string
  description: string
  action: string
}

const zhCN: Record<EmptyStateScenario, EmptyStateCopy> = {
  'missing-avatar': {
    eyebrow: '头像未设置',
    title: '先换一张能被队友记住的头像',
    description: '完善头像后，匹配页、资料页和聊天窗都会更容易建立信任感。',
    action: '去完善头像'
  },
  'missing-profile': {
    eyebrow: '资料待完善',
    title: '补全你的游戏标签和昵称',
    description: '填写资料后，系统才能更准确地给你推荐合拍的游戏搭子。',
    action: '编辑资料'
  },
  'no-friends': {
    eyebrow: '好友列表为空',
    title: '还没有固定搭子',
    description: '可以先去匹配，或者通过用户 ID 直接添加好友，聊天记录会自动持久化。',
    action: '开始匹配'
  },
  'no-vlogs': {
    eyebrow: '动态空空如也',
    title: '记录你的第一条游戏动态',
    description: '无论是视频回放还是文字日志，都能沉淀成你的个人主页内容。',
    action: '发布动态'
  },
  'no-careers': {
    eyebrow: '生涯暂无记录',
    title: '把常玩的游戏和段位补进来',
    description: '这些信息会进入匹配权重，也方便好友快速了解你的节奏。',
    action: '添加记录'
  },
  'no-messages': {
    eyebrow: '聊天刚开始',
    title: '发一句开场白吧',
    description: '服务端已经准备好同步与离线补偿，发出的消息会自动保留。',
    action: '发送第一条消息'
  },
  'network-error': {
    eyebrow: '网络波动',
    title: '刚刚没能拿到最新数据',
    description: '请重试一次；如果问题持续存在，稍后回来时离线消息仍会补齐。',
    action: '重新加载'
  },
  'permission-denied': {
    eyebrow: '访问受限',
    title: '需要先登录或完成验证',
    description: '登录后才能访问个人资料、好友和聊天服务端数据。',
    action: '前往登录'
  },
  'search-empty': {
    eyebrow: '没有结果',
    title: '这次搜索没有命中好友',
    description: '可以试试昵称、用户名，或者先去匹配认识新的队友。',
    action: '开始匹配'
  },
  'partner-left-room': {
    eyebrow: '房间已结束',
    title: '你的搭子刚刚离开了语音房',
    description: '房间会自动收起并返回匹配主页，你也可以现在直接返回重新开始匹配。',
    action: '返回匹配主页'
  }
}

const enUS: Record<EmptyStateScenario, EmptyStateCopy> = {
  'missing-avatar': {
    eyebrow: 'Avatar Missing',
    title: 'Add an avatar your teammates can remember',
    description: 'A profile image improves trust across profile, matching, and chat surfaces.',
    action: 'Update Avatar'
  },
  'missing-profile': {
    eyebrow: 'Profile Incomplete',
    title: 'Finish your nickname and game profile',
    description: 'Better profile data helps the matcher recommend teammates with the right pace.',
    action: 'Edit Profile'
  },
  'no-friends': {
    eyebrow: 'No Friends Yet',
    title: 'Your squad list is still empty',
    description: 'Start a match or add a friend by user ID. New chats will be stored on the server.',
    action: 'Start Matching'
  },
  'no-vlogs': {
    eyebrow: 'No Posts Yet',
    title: 'Publish your first gaming update',
    description: 'Video highlights and text logs both help build out your profile feed.',
    action: 'Create Post'
  },
  'no-careers': {
    eyebrow: 'No Career Data',
    title: 'Add your core games and rank',
    description: 'Career data improves recommendations and makes your play style easier to read.',
    action: 'Add Record'
  },
  'no-messages': {
    eyebrow: 'Conversation Empty',
    title: 'Send a quick opener',
    description: 'Messages are synced and persisted, so your next device can pick up where you left off.',
    action: 'Send Message'
  },
  'network-error': {
    eyebrow: 'Network Error',
    title: 'We could not load fresh data',
    description: 'Try again. If you come back later, offline messages will still be restored.',
    action: 'Retry'
  },
  'permission-denied': {
    eyebrow: 'Access Limited',
    title: 'Sign in or verify your session first',
    description: 'Profile, friends, and chat data require an authenticated session.',
    action: 'Go to Login'
  },
  'search-empty': {
    eyebrow: 'No Results',
    title: 'No friend matched this search',
    description: 'Try a nickname or username, or start matching to meet someone new.',
    action: 'Start Matching'
  },
  'partner-left-room': {
    eyebrow: 'Room Closed',
    title: 'Your teammate just left the voice room',
    description: 'We will close this room and send you back to matching shortly. You can also return now.',
    action: 'Back to Matching'
  }
}

export function resolveEmptyStateCopy(
  scenario: EmptyStateScenario,
  locale: string
) {
  const normalized = locale.toLowerCase()
  const dictionary = normalized.startsWith('en') ? enUS : zhCN
  return dictionary[scenario]
}

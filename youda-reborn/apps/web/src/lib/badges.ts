export type BadgeDefinition = {
  id: string
  name: string
  icon: string
  group: 'rank' | 'achievement'
}

export const badgeCatalog: BadgeDefinition[] = [
  { id: 'BADGE_012', name: '辐射', icon: '/game-assets/badges/icons/rank/badge-rank-radiant-active.png', group: 'rank' },
  { id: 'BADGE_004', name: '超凡', icon: '/game-assets/badges/icons/rank/badge-rank-ascendant-active.png', group: 'rank' },
  { id: 'BADGE_011', name: '大师', icon: '/game-assets/badges/icons/rank/badge-rank-master-active.png', group: 'rank' },
  { id: 'BADGE_015', name: '钻石', icon: '/game-assets/badges/icons/rank/badge-rank-diamond-active.png', group: 'rank' },
  { id: 'BADGE_003', name: '铂金', icon: '/game-assets/badges/icons/rank/badge-rank-platinum-plus-active.png', group: 'rank' },
  { id: 'BADGE_001', name: '白金', icon: '/game-assets/badges/icons/rank/badge-rank-platinum-active.png', group: 'rank' },
  { id: 'BADGE_013', name: '黄金', icon: '/game-assets/badges/icons/rank/badge-rank-gold-active.png', group: 'rank' },
  { id: 'BADGE_002', name: '白银', icon: '/game-assets/badges/icons/rank/badge-rank-silver-active.png', group: 'rank' },
  { id: 'BADGE_014', name: '青铜', icon: '/game-assets/badges/icons/rank/badge-rank-bronze-active.png', group: 'rank' },
  { id: 'BADGE_005', name: '成就1', icon: '/game-assets/badges/icons/achievement/badge-achievement-01-active.png', group: 'achievement' },
  { id: 'BADGE_006', name: '成就2', icon: '/game-assets/badges/icons/achievement/badge-achievement-02-active.png', group: 'achievement' },
  { id: 'BADGE_007', name: '成就3', icon: '/game-assets/badges/icons/achievement/badge-achievement-03-active.png', group: 'achievement' },
  { id: 'BADGE_008', name: '成就4', icon: '/game-assets/badges/icons/achievement/badge-achievement-04-active.png', group: 'achievement' },
  { id: 'BADGE_009', name: '成就5', icon: '/game-assets/badges/icons/achievement/badge-achievement-05-active.png', group: 'achievement' },
  { id: 'BADGE_010', name: '成就6', icon: '/game-assets/badges/icons/achievement/badge-achievement-06-active.png', group: 'achievement' }
]

export const badgeCatalogById = Object.fromEntries(
  badgeCatalog.map((badge) => [badge.id, badge])
) as Record<string, BadgeDefinition>

export const rankBadgeMatchOrder: Array<[string, string]> = [
  ['辐射', 'BADGE_012'],
  ['超凡入圣', 'BADGE_004'],
  ['超凡', 'BADGE_004'],
  ['大师', 'BADGE_011'],
  ['钻石', 'BADGE_015'],
  ['铂金', 'BADGE_003'],
  ['白金', 'BADGE_001'],
  ['黄金', 'BADGE_013'],
  ['白银', 'BADGE_002'],
  ['青铜', 'BADGE_014']
]

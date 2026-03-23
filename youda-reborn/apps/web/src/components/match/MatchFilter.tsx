"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

const GAMES = [
  "英雄联盟", "无畏契约", "绝地求生", "Apex 英雄", "守望先锋", 
  "CS:GO 2", "DOTA 2", "原神", "永劫无间", "崩坏：星穹铁道",
  "和平精英", "第五人格", "王者荣耀", "穿越火线", "炉石传说",
  "双人成行", "饥荒", "云顶之弈", "我的世界", "泰拉瑞亚",
  "星际战甲", "糖豆人", "糖豆人", "命运方舟", "彩虹六号"
];

const MATCH_SIZES = ["双排 (2人)", "三排 (3人)", "四排 (4人)", "五排 (5人)", "不限"];
const DURATIONS = ["10分钟内 (极速)", "10-30分钟 (标准)", "30分钟以上 (持久战)", "不限"];
const LANGUAGES = ["中文 (普通话)", "英语", "日语", "韩语", "不限"];
const REGIONS = ["国服", "亚服", "美服", "欧服", "不限"];
const PERSONALITIES = ["不限 (匹配最优解)", "稳健平衡型 (B类)", "主动进攻型 (A类)", "沟通协作型 (S类)", "战术指挥型 (T类)"];

interface MatchFilterProps {
  onStartMatch: (filters: Record<string, string>) => void;
}

export default function MatchFilter({ onStartMatch }: MatchFilterProps) {
  const [filters, setFilters] = useState({
    game: GAMES[0],
    personality: PERSONALITIES[0],
    size: MATCH_SIZES[0],
    duration: DURATIONS[1],
    language: LANGUAGES[0],
    region: REGIONS[0],
  });
  const [playerCount, setPlayerCount] = useState<number | null>(null);

  React.useEffect(() => {
    setPlayerCount(Math.floor(Math.random() * 2000 + 500));
  }, []);

  const handleChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-[800px] mt-10"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-kook-textMain mb-2 tracking-tight">筛选条件</h2>
        <p className="text-kook-textMuted text-base font-medium">设置你的雷达，寻找最合拍的灵魂队友</p>
      </div>

      <div className="kook-panel p-8 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 目标游戏 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-kook-textMain block">目标游戏</label>
            <div className="relative">
              <select 
                value={filters.game}
                onChange={(e) => handleChange('game', e.target.value)}
                className="w-full bg-[#F2F3F5] border border-transparent rounded-kook-md px-4 py-3 text-kook-textMain focus:outline-none focus:border-kook-brand focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
              >
                {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-kook-textMuted pointer-events-none">▼</div>
            </div>
          </div>
          
          {/* 期望人格 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-kook-textMain block">期望人格</label>
            <div className="relative">
              <select 
                value={filters.personality}
                onChange={(e) => handleChange('personality', e.target.value)}
                className="w-full bg-[#F2F3F5] border border-transparent rounded-kook-md px-4 py-3 text-kook-textMain focus:outline-none focus:border-kook-brand focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
              >
                {PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-kook-textMuted pointer-events-none">▼</div>
            </div>
          </div>

          {/* 匹配人数 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-kook-textMain block">匹配人数</label>
            <div className="relative">
              <select 
                value={filters.size}
                onChange={(e) => handleChange('size', e.target.value)}
                className="w-full bg-[#F2F3F5] border border-transparent rounded-kook-md px-4 py-3 text-kook-textMain focus:outline-none focus:border-kook-brand focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
              >
                {MATCH_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-kook-textMuted pointer-events-none">▼</div>
            </div>
          </div>

          {/* 游戏时长 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-kook-textMain block">期望游戏时长</label>
            <div className="relative">
              <select 
                value={filters.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                className="w-full bg-[#F2F3F5] border border-transparent rounded-kook-md px-4 py-3 text-kook-textMain focus:outline-none focus:border-kook-brand focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
              >
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-kook-textMuted pointer-events-none">▼</div>
            </div>
          </div>

          {/* 语言偏好 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-kook-textMain block">语言偏好</label>
            <div className="relative">
              <select 
                value={filters.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full bg-[#F2F3F5] border border-transparent rounded-kook-md px-4 py-3 text-kook-textMain focus:outline-none focus:border-kook-brand focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-kook-textMuted pointer-events-none">▼</div>
            </div>
          </div>

          {/* 地区/服务器 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-kook-textMain block">地区/服务器</label>
            <div className="relative">
              <select 
                value={filters.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="w-full bg-[#F2F3F5] border border-transparent rounded-kook-md px-4 py-3 text-kook-textMain focus:outline-none focus:border-kook-brand focus:bg-white transition-colors appearance-none font-medium cursor-pointer"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-kook-textMuted pointer-events-none">▼</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between bg-white border border-kook-border rounded-kook-lg p-6 shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kook-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-kook-brand"></span>
          </div>
          <span className="text-kook-textMain font-bold">雷达系统已就绪</span>
          {playerCount !== null && (
            <span className="text-kook-textMuted text-sm ml-2 font-medium">当前有 {playerCount.toLocaleString()} 名玩家正在寻找队伍</span>
          )}
        </div>
        <Button 
          variant="kook-brand" 
          size="lg" 
          className="w-full md:w-auto px-10 font-bold shadow-[0_4px_14px_rgba(46,211,158,0.25)] hover:-translate-y-0.5"
          onClick={() => onStartMatch(filters)}
        >
          开始匹配
        </Button>
      </div>
    </motion.div>
  );
}

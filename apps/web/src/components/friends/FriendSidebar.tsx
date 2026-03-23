"use client";

import React, { useState } from 'react';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'gaming';
  gameInfo?: string;
  personality?: string;
  isBot?: boolean;
}

const MOCK_FRIENDS: Friend[] = [
  {
    id: 'bot_youda',
    name: '有搭 (AI小助手)',
    avatarUrl: '/game-assets/avatars/characters/avatar/char-22-mercy-avatar.png',
    status: 'online',
    personality: '全知全能',
    isBot: true
  },
  {
    id: 'user_1',
    name: '夜猫打野',
    avatarUrl: '/game-assets/avatars/characters/avatar/char-01-genji-avatar.png',
    status: 'gaming',
    gameInfo: '无畏契约 · 匹配中',
    personality: '稳健运营'
  },
  {
    id: 'user_2',
    name: '暴躁枪男',
    avatarUrl: '/game-assets/avatars/characters/avatar/char-03-tracer-avatar.png',
    status: 'online',
    personality: '主动进攻'
  },
  {
    id: 'user_3',
    name: '躺平玩家',
    avatarUrl: '/game-assets/avatars/characters/avatar/char-15-mario-avatar.png',
    status: 'offline',
    personality: '休闲娱乐'
  }
];

interface FriendSidebarProps {
  onOpenChat: (friend: Friend) => void;
}

export function FriendSidebar({ onOpenChat }: FriendSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'online'>('all');

  const filteredFriends = MOCK_FRIENDS.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || friend.status !== 'offline';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="glass-panel h-full flex flex-col bg-white/70 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#E3E5E8] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#181A1F]">好友列表</h3>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-[#F2F3F5] text-[#5C6068]">
            <UserPlus size={16} />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="搜索好友..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F2F3F5] border border-transparent rounded-xl pl-9 pr-4 py-2 text-sm text-[#181A1F] focus:outline-none focus:bg-white focus:border-kook-brand transition-colors placeholder:text-[#8D93A5]"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D93A5]" />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E3E5E8] px-1">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-kook-brand text-[#181A1F]' : 'border-transparent text-[#8D93A5] hover:text-[#5C6068]'}`}
          >
            全部
          </button>
          <button 
            onClick={() => setActiveTab('online')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'online' ? 'border-kook-brand text-[#181A1F]' : 'border-transparent text-[#8D93A5] hover:text-[#5C6068]'}`}
          >
            在线
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFriends.map(friend => (
          <div 
            key={friend.id} 
            onClick={() => onOpenChat(friend)}
            className="flex items-center gap-3 p-2 hover:bg-[#F2F3F5] rounded-xl cursor-pointer transition-colors group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E3E5E8] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
              </div>
              {/* Status Indicator */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                friend.status === 'online' ? 'bg-kook-brand' : 
                friend.status === 'gaming' ? 'bg-[#5C6BFF]' : 'bg-[#C4C9D2]'
              }`}></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-[#181A1F] truncate">{friend.name}</span>
                {friend.isBot && (
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-kook-brand to-[#5C6BFF] text-white text-[9px] font-black rounded-sm shadow-sm">AI</span>
                )}
              </div>
              <div className="text-xs font-medium truncate">
                {friend.status === 'gaming' ? (
                  <span className="text-[#5C6BFF]">{friend.gameInfo}</span>
                ) : (
                  <span className="text-[#8D93A5]">{friend.personality}</span>
                )}
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full text-[#8D93A5] hover:text-[#181A1F]">
                <MessageCircle size={16} />
              </Button>
            </div>
          </div>
        ))}

        {filteredFriends.length === 0 && (
          <div className="text-center p-6">
            <p className="text-sm font-bold text-[#8D93A5]">没有找到相关好友</p>
          </div>
        )}
      </div>
    </div>
  );
}

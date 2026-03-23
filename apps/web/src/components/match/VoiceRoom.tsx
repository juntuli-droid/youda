"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Send, Smile, MessageSquare, UserPlus } from 'lucide-react';

/* eslint-disable @next/next/no-img-element */

interface VoiceRoomProps {
  filters: Record<string, string>;
  onLeave: () => void;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  isSelf: boolean;
  time: string;
}

const AI_BOTS = [
  { id: 'bot1', name: '夜猫打野', personality: '稳健运营', avatarUrl: '/game-assets/avatars/characters/avatar/char-01-genji-avatar.png', desc: '擅长控图，节奏稳定，不爱说话但听指挥。' },
  { id: 'bot2', name: '暴躁枪男', personality: '主动进攻', avatarUrl: '/game-assets/avatars/characters/avatar/char-03-tracer-avatar.png', desc: '身法灵活，喜欢找人打架，需要有人兜底。' },
  { id: 'bot3', name: '话痨辅助', personality: '沟通协作', avatarUrl: '/game-assets/avatars/characters/avatar/char-22-mercy-avatar.png', desc: '全程报点，情绪价值拉满，团队的润滑剂。' },
];

export default function VoiceRoom({ filters, onLeave }: VoiceRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'msg0', sender: '系统', text: `欢迎来到 ${filters.game} 语音房！请友好交流。`, isSelf: false, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mock teammates based on match size
  const teammateCount = filters.size.includes('双排') ? 1 : filters.size.includes('三排') ? 2 : filters.size.includes('四排') ? 3 : 4;
  const teammates = AI_BOTS.slice(0, teammateCount);

  useEffect(() => {
    // Simulate AI greeting
    const timer = setTimeout(() => {
      if (teammates.length > 0) {
        handleReceiveMessage(teammates[0].name, '哈喽啊，能听到吗？我这边准备好了，随时可以开。');
      }
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: '我',
      text: inputText,
      isSelf: true,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const responder = teammates[Math.floor(Math.random() * teammates.length)];
      if (responder) {
        const responses = ["可以的", "没问题", "走起", "我拉你还是你拉我？", "稍等我改个设置"];
        handleReceiveMessage(responder.name, responses[Math.floor(Math.random() * responses.length)]);
      }
    }, 1500 + Math.random() * 2000);
  };

  const handleReceiveMessage = (sender: string, text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender,
      text,
      isSelf: false,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-[1200px] mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[80vh]"
    >
      {/* Main Room Area (Voice + Chat) */}
      <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-[#E3E5E8] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E3E5E8] flex justify-between items-center bg-[#F7F9FC]">
          <div>
            <h2 className="text-xl font-black text-[#181A1F]">{filters.game} 匹配房间</h2>
            <p className="text-sm font-medium text-[#5C6068]">目标风格: {filters.personality} · {filters.region}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-kook-brand bg-kook-brand/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-kook-brand animate-pulse"></span>
              语音已连接 (12ms)
            </span>
            <Button variant="outline" size="sm" onClick={onLeave} className="text-red-500 border-red-200 hover:bg-red-50">
              <PhoneOff size={16} className="mr-1" /> 退出房间
            </Button>
          </div>
        </div>

        {/* Voice Avatars */}
        <div className="p-6 bg-[#F2F3F5] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* Self */}
          <div className="flex flex-col items-center gap-2 group relative">
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl bg-white border-2 ${isMuted ? 'border-[#E3E5E8]' : 'border-kook-brand shadow-[0_0_15px_rgba(46,211,158,0.5)]'} flex items-center justify-center overflow-hidden`}>
                <img src="/game-assets/avatars/characters/avatar/char-10-ashe-avatar.png" alt="我" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-[#E3E5E8] shadow-sm">
                {isMuted ? <MicOff size={12} className="text-red-500" /> : <Mic size={12} className="text-kook-brand" />}
              </div>
            </div>
            <span className="text-sm font-bold text-[#181A1F] cursor-pointer">你 (玩家)</span>
            
            {/* Tooltip */}
            <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-56 bg-white border border-[#E3E5E8] rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform origin-top group-hover:translate-y-0 -translate-y-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E3E5E8]">
                  <img src="/game-assets/avatars/characters/avatar/char-10-ashe-avatar.png" alt="我" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-black text-[#181A1F]">你 (玩家)</div>
                  <div className="text-xs font-bold text-kook-brand">未定型人格</div>
                </div>
              </div>
              <div className="w-full h-px bg-[#F2F3F5] my-2"></div>
              <p className="text-xs text-[#5C6068] leading-relaxed">随时准备就绪，正在寻找最佳拍档中...</p>
            </div>
          </div>

          {/* Teammates */}
          {teammates.map((bot) => (
            <div key={bot.id} className="flex flex-col items-center gap-2 group relative">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl bg-white border-2 border-transparent flex items-center justify-center overflow-hidden shadow-sm`}>
                  <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                </div>
                {/* Simulated speaking indicator randomly */}
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-[#E3E5E8] shadow-sm">
                   <Mic size={12} className="text-kook-brand" />
                </div>
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-sm font-bold text-[#181A1F] truncate max-w-[80px]">{bot.name}</span>
                <button 
                  className="text-[#8D93A5] hover:text-[#2ED39E] transition-colors" 
                  title="发送好友请求"
                  onClick={() => alert(`已向 ${bot.name} 发送好友请求！`)}
                >
                  <UserPlus size={14} />
                </button>
              </div>
              <span className="text-[10px] bg-white border border-[#E3E5E8] text-[#5C6068] px-2 py-0.5 rounded-sm shadow-sm">{bot.personality}</span>

              {/* Tooltip */}
              <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-56 bg-white border border-[#E3E5E8] rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 transform origin-top group-hover:translate-y-0 -translate-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E3E5E8]">
                    <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#181A1F]">{bot.name}</div>
                    <div className="text-xs font-bold text-kook-brand">{bot.personality}</div>
                  </div>
                </div>
                <div className="w-full h-px bg-[#F2F3F5] my-2"></div>
                <p className="text-xs text-[#5C6068] leading-relaxed">{bot.desc}</p>
              </div>
            </div>
          ))}
          
          {/* Empty slots if any */}
          {Array.from({ length: Math.max(0, 4 - teammates.length) }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 opacity-50">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#E3E5E8] flex items-center justify-center bg-white">
                <UserPlus size={24} className="text-[#8D93A5]" />
              </div>
              <span className="text-sm font-medium text-[#8D93A5]">等待加入</span>
            </div>
          ))}
        </div>

        {/* Text Chat */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-[#8D93A5]">{msg.sender}</span>
                  <span className="text-[10px] text-[#8D93A5]/70">{msg.time}</span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm font-medium ${
                  msg.isSelf 
                    ? 'bg-kook-brand text-white rounded-tr-sm' 
                    : msg.sender === '系统' 
                      ? 'bg-[#F2F3F5] text-[#8D93A5] mx-auto text-center rounded-full text-xs'
                      : 'bg-[#F7F9FC] text-[#181A1F] rounded-tl-sm border border-[#E3E5E8]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t border-[#E3E5E8]">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="发送消息到房间..." 
                  className="w-full bg-[#F2F3F5] rounded-xl pl-4 pr-10 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-kook-brand/50 text-[#181A1F] placeholder:text-[#8D93A5]"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D93A5] hover:text-[#181A1F]">
                  <Smile size={18} />
                </button>
              </div>
              <Button type="submit" variant="kook-brand" className="px-6 rounded-xl shadow-sm">
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>

      </div>

      {/* Side Panel (Controls & Info) */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E3E5E8] p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-base font-black text-[#181A1F] mb-4">语音控制</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-red-50 border-red-200 text-red-500' 
                  : 'bg-kook-brand/10 border-kook-brand/30 text-kook-brand'
              }`}
            >
              {isMuted ? <MicOff size={24} className="mb-2" /> : <Mic size={24} className="mb-2" />}
              <span className="text-sm font-bold">{isMuted ? '解除静音' : '闭麦'}</span>
            </button>
            <button className="flex flex-col items-center justify-center py-4 rounded-xl border border-[#E3E5E8] bg-[#F7F9FC] text-[#5C6068] hover:bg-[#F2F3F5] hover:text-[#181A1F] transition-colors">
              <MessageSquare size={24} className="mb-2" />
              <span className="text-sm font-bold">快捷短语</span>
            </button>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-base font-black text-[#181A1F] mb-4">房间信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#5C6068] font-medium">房间号</span>
              <span className="font-bold text-[#181A1F]">#YD-{Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5C6068] font-medium">语言</span>
              <span className="font-bold text-[#181A1F]">{filters.language}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5C6068] font-medium">时长要求</span>
              <span className="font-bold text-[#181A1F]">{filters.duration.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        <div>
          <Button variant="outline" className="w-full text-[#181A1F] border-[#E3E5E8] hover:bg-[#F7F9FC] mb-3">
            复制房间链接
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-kook-brand border-kook-brand/30 bg-kook-brand/5 hover:bg-kook-brand/10 mb-3 transition-colors"
            onClick={async () => {
              try {
                const teammateNames = teammates.map(t => t.name).join('、');
                const content = teammateNames 
                  ? `与 ${teammateNames} 在 ${filters.game} 语音房完成了一次匹配。目标风格：${filters.personality}，时长：${filters.duration.split(' ')[0]}。`
                  : `在 ${filters.game} 语音房等待匹配。目标风格：${filters.personality}，时长：${filters.duration.split(' ')[0]}。`;
                
                const res = await fetch('/api/users/me/vlog', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: `${filters.game} 开黑记录`,
                    gameName: filters.game,
                    type: 'log',
                    content
                  })
                });
                
                if (res.ok) {
                  alert('已成功保存至游戏 Vlog！你可以在个人主页查看。');
                } else {
                  alert('保存失败，请稍后重试。');
                }
              } catch (error) {
                console.error(error);
                alert('保存出错');
              }
            }}
          >
            记录这次游戏 Vlog
          </Button>
          <Button variant="kook-brand" className="w-full font-bold">
            准备就绪，进入游戏
          </Button>
        </div>
      </div>

    </motion.div>
  );
}

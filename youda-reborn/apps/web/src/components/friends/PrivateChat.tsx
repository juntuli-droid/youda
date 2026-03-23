"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, Image as ImageIcon, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
}

interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'gaming';
  gameInfo?: string;
  personality?: string;
  isBot?: boolean;
}

interface PrivateChatProps {
  friend: Friend;
  onClose: () => void;
}

export function PrivateChat({ friend, onClose }: PrivateChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting from bot
    if (friend.isBot && messages.length === 0) {
      setMessages([
        {
          id: 'msg_0',
          senderId: friend.id,
          text: '你好！我是你的游戏AI小助手"有搭"。关于游戏匹配、性格测评或者组队建议，都可以随时问我哦！',
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend]);

  useEffect(() => {
    if (!isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: inputText,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate AI response if chatting with bot
    if (friend.isBot) {
      setTimeout(() => {
        const botResponses = [
          "这个想法不错！在匹配时，我建议你多关注 S类 (沟通协作型) 的玩家。",
          "根据你的游戏时长，我觉得你需要一个能在后期稳住心态的队友。",
          "没问题，我已经帮你记录下来了。还有什么需要我帮忙的吗？"
        ];
        const replyText = botResponses[Math.floor(Math.random() * botResponses.length)];
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          senderId: friend.id,
          text: replyText,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }, 1000);
    }
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-0 right-80 mr-6 w-64 bg-white rounded-t-xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border border-[#E3E5E8] border-b-0 cursor-pointer hover:bg-[#F7F9FC] transition-colors z-50 flex items-center justify-between p-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E3E5E8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-bold text-[#181A1F] truncate max-w-[120px]">{friend.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-kook-brand"></div>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-[#8D93A5] hover:text-red-500" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={14} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-80 mr-6 w-[340px] h-[480px] bg-white rounded-t-2xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] border border-[#E3E5E8] border-b-0 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-[#181A1F] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#33353A]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#181A1F] ${
                friend.status === 'online' ? 'bg-kook-brand' : 
                friend.status === 'gaming' ? 'bg-[#5C6BFF]' : 'bg-[#C4C9D2]'
              }`}></div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-white truncate max-w-[120px]">{friend.name}</span>
              {friend.isBot && <span className="px-1.5 py-0.5 bg-kook-brand text-white text-[9px] font-black rounded-sm">AI</span>}
            </div>
            <div className="text-xs text-[#8D93A5]">{friend.status === 'gaming' ? '游戏中' : '在线'}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-[#8D93A5] hover:text-white hover:bg-white/10" onClick={() => setIsMinimized(true)}>
            <Minus size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-[#8D93A5] hover:text-red-500 hover:bg-white/10" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7F9FC]">
        {messages.map(msg => {
          const isSelf = msg.senderId === 'me';
          return (
            <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[10px] text-[#8D93A5]/70">{msg.time}</span>
              </div>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium ${
                isSelf 
                  ? 'bg-kook-brand text-white rounded-tr-sm' 
                  : 'bg-white border border-[#E3E5E8] text-[#181A1F] rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-[#E3E5E8]">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <button type="button" className="text-[#8D93A5] hover:text-[#181A1F] transition-colors"><Smile size={18} /></button>
            <button type="button" className="text-[#8D93A5] hover:text-[#181A1F] transition-colors"><ImageIcon size={18} /></button>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="发送消息..." 
              className="flex-1 bg-[#F2F3F5] rounded-xl px-3 py-2 text-sm text-[#181A1F] focus:outline-none focus:ring-1 focus:ring-kook-brand/50 placeholder:text-[#8D93A5]"
            />
            <Button type="submit" variant="kook-brand" size="sm" className="px-3 rounded-xl shadow-sm h-auto" disabled={!inputText.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

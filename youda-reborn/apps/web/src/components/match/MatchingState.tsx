"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

interface MatchingStateProps {
  filters: Record<string, string>;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function MatchingState({ filters, onCancel, onSuccess }: MatchingStateProps) {
  const [progress, setProgress] = useState(0);
  const [estimatedTime] = useState(Math.floor(Math.random() * 15) + 5); // 5 to 20 seconds mock
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      setProgress(prev => {
        const newProgress = prev + (100 / estimatedTime);
        if (newProgress >= 100) {
          clearInterval(timer);
          setTimeout(onSuccess, 500); // Trigger success when full
          return 100;
        }
        return newProgress;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [estimatedTime, onSuccess]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-[800px] mt-10 relative"
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        {/* Animated radar rings */}
        <div className="absolute w-64 h-64 border border-kook-brand/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute w-96 h-96 border border-kook-brand/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-1000"></div>
        <div className="absolute w-[500px] h-[500px] border border-kook-brand/5 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-2000"></div>
      </div>

      <div className="bg-white rounded-[32px] p-12 shadow-2xl relative z-10 text-center border border-[#E3E5E8] overflow-hidden">
        {/* Progress Circle */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" stroke="#F2F3F5" strokeWidth="8" 
            />
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" stroke="#2ED39E" strokeWidth="8" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-kook-brand text-sm font-bold">匹配中</span>
            <span className="text-[#181A1F] text-xl font-black">{Math.floor(progress)}%</span>
          </div>
        </div>

        <h2 className="text-3xl font-black text-[#181A1F] mb-3">正在为你寻找节奏一致的搭子</h2>
        <p className="text-[#5C6068] mb-10 max-w-md mx-auto">我们正在根据你的游戏、风格偏好和队伍人数，寻找最合拍的队友。</p>

        <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
          <div className="bg-[#F7F9FC] rounded-xl p-4 border border-[#E3E5E8]">
            <div className="text-xs text-[#8D93A5] mb-1 font-medium">当前游戏</div>
            <div className="text-[#181A1F] font-bold">{filters.game}</div>
          </div>
          <div className="bg-[#F7F9FC] rounded-xl p-4 border border-[#E3E5E8]">
            <div className="text-xs text-[#8D93A5] mb-1 font-medium">匹配人数</div>
            <div className="text-[#181A1F] font-bold">{filters.size}</div>
          </div>
          <div className="bg-[#F7F9FC] rounded-xl p-4 border border-[#E3E5E8]">
            <div className="text-xs text-[#8D93A5] mb-1 font-medium">目标风格</div>
            <div className="text-[#181A1F] font-bold text-sm truncate">{filters.personality.split(' ')[0]}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-[#5C6068] text-sm font-medium">
            已等待 {elapsedTime}s / 预计还需要 {Math.max(0, estimatedTime - elapsedTime)}s
          </div>
          <Button variant="ghost" onClick={onCancel} className="text-[#8D93A5] hover:text-[#181A1F] hover:bg-[#F2F3F5]">
            取消匹配
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

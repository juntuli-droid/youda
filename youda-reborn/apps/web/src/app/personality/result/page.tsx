"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { calculatePersonality, resolveAvatar, PersonalityResult, getPersonalityMeta } from "@youda/game-assets";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { RefreshCw, Home, Download } from "lucide-react";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>("");
  const posterRef = useRef<HTMLDivElement>(null);

  const [resultMeta, setResultMeta] = useState<{ name?: string, description?: string, character?: string } | null>(null);

  // 挂载亮色游戏化背景
  useEffect(() => {
    document.documentElement.classList.add('light-assessment-theme');
    return () => {
      document.documentElement.classList.remove('light-assessment-theme');
    };
  }, []);

  useEffect(() => {
    try {
      const storedScores = localStorage.getItem('personalityScores');
      if (storedScores) {
        const scores = JSON.parse(storedScores);
        const calcResult = calculatePersonality(scores);
        setResult(calcResult);
        
        const meta = getPersonalityMeta(calcResult.code);
        setResultMeta(meta);
        setCharacterName(meta.character);
        setAvatarUrl(resolveAvatar(calcResult.code));
        
        // 触发胜利粒子特效
        triggerConfetti();
      } else {
        router.push('/personality');
      }
    } catch (e) {
      console.error(e);
      router.push('/personality');
    }
  }, [router]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#2ED39E', '#5C6BFF', '#FFFFFF']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#2ED39E', '#5C6BFF', '#FFFFFF']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: '#F7F9FC',
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `Youda-Personality-${result?.code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate poster:", err);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-kook-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="game-shell flex flex-col items-center justify-center min-h-screen p-4 py-12 relative overflow-hidden bg-[#F7F9FC]">
      {/* 动态背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-kook-brand/20 rounded-full blur-[150px] opacity-70 mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-[#5C6BFF]/15 rounded-full blur-[150px] opacity-60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-color-burn"></div>
      </div>

      <div className="w-full max-w-[1000px] z-10 flex flex-col gap-6" ref={posterRef}>
        
        {/* Top Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden bg-white/70"
        >
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-kook-brand/10 to-transparent pointer-events-none"></div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <span className="text-kook-brand font-bold text-sm tracking-widest uppercase mb-2 block">人格结果</span>
            <h1 className="text-4xl md:text-5xl font-black text-[#181A1F] mb-3">
              你的游戏人格是 <span className="text-transparent bg-clip-text bg-gradient-to-r from-kook-brand to-[#5C6BFF]">{result.code}</span>
            </h1>
            <p className="text-xl font-bold text-[#181A1F]/90 mb-4">{resultMeta?.name}</p>
            <p className="text-[#181A1F]/60 text-sm leading-relaxed max-w-xl font-medium">
              {resultMeta?.description}
            </p>
            
            <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-[#181A1F]/5 border border-[#181A1F]/10 text-xs text-[#181A1F]/70 font-medium">{resultMeta?.name}</span>
              <span className="px-3 py-1 rounded-full bg-kook-brand/10 border border-kook-brand/30 text-xs text-kook-brand font-bold">代号 {result.code}</span>
            </div>
          </div>

          {/* Avatar 立绘从卡牌中跃出效果 */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotateY: 30 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="w-48 h-64 md:w-64 md:h-80 flex-shrink-0 relative z-10 perspective-1000"
          >
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white to-[#F7F9FC] border border-[#181A1F]/10 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.08)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-kook-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-multiply"></div>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={characterName} className="w-full h-full object-cover rounded-xl filter contrast-110 drop-shadow-[0_0_15px_rgba(46,211,158,0.2)] transform group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🎮</div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "游戏风格", value: resultMeta?.name?.split('·')[0] || "战术型" },
            { label: "游戏性格", value: resultMeta?.name?.split('·')[1] || "稳健型" },
            { label: "游戏偏好", value: "目标推进偏好" },
            { label: "活跃标签", value: "高频玩家" },
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass-panel p-6 text-center hover:bg-white transition-colors bg-white/70"
            >
              <div className="text-[#181A1F]/50 text-xs font-bold mb-2">{item.label}</div>
              <div className="text-[#181A1F] font-black text-lg">{item.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Actions Row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1 glass-panel p-6 bg-white/70">
            <div className="text-[#181A1F]/50 text-xs font-bold mb-1">人格记忆点</div>
            <div className="text-2xl font-black text-[#181A1F] mb-2">{characterName || "未知英雄"}</div>
            <div className="text-[#181A1F]/60 text-xs font-medium">这个称呼可以帮助你快速记住自己的游戏风格，也方便后续匹配时更直观地表达自己。</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 justify-center" data-html2canvas-ignore="true">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-white border-[#181A1F]/10 text-[#181A1F] hover:bg-[#F7F9FC] font-bold shadow-sm" onClick={handleDownloadPoster}>
                <Download size={16} className="mr-2" /> 保存海报
              </Button>
              <Button variant="outline" className="flex-1 bg-white border-[#181A1F]/10 text-[#181A1F] hover:bg-[#F7F9FC] font-bold shadow-sm" onClick={() => router.push('/personality')}>
                <RefreshCw size={16} className="mr-2" /> 重新测试
              </Button>
            </div>
            <Button variant="kook-brand" className="w-full shadow-[0_8px_20px_rgba(46,211,158,0.3)] font-bold text-lg" onClick={() => router.push('/profile')}>
              <Home size={18} className="mr-2" /> 进入我的游戏主页
            </Button>
          </div>
        </motion.div>
        
      </div>
    </main>
  );
}

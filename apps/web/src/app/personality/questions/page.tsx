"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question, ScoreKey, questions } from "@youda/game-assets";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Zap } from "lucide-react";

export default function QuestionsPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Partial<Record<ScoreKey, number>>>({});
  const [scoreHistory, setScoreHistory] = useState<Array<Partial<Record<ScoreKey, number>>>>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isHoveredOption, setIsHoveredOption] = useState<number | null>(null);

  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // 初始化设置亮色主题与随机抽取题目
  useEffect(() => {
    document.documentElement.classList.add('light-assessment-theme');
    
    // 随机抽取 16 道题目
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, 16));
    
    return () => {
      document.documentElement.classList.remove('light-assessment-theme');
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(scores);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scores]);

  const currentQuestion = selectedQuestions[currentIndex];

  const handleOptionSelect = (optionScores: Partial<Record<ScoreKey, number>>) => {
    // 记录历史用于回退
    setScoreHistory(prev => [...prev, { ...scores }]);
    
    const newScores = { ...scores };
    for (const [key, value] of Object.entries(optionScores)) {
      newScores[key as ScoreKey] = (newScores[key as ScoreKey] || 0) + (value as number);
    }
    setScores(newScores);

    if (currentIndex < selectedQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmit(newScores);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      // 恢复上一步的分数
      const previousScores = scoreHistory[scoreHistory.length - 1];
      setScores(previousScores);
      setScoreHistory(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (finalScores: Partial<Record<ScoreKey, number>>) => {
    try {
      localStorage.setItem('personalityScores', JSON.stringify(finalScores));
      router.push('/personality/result');
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress = ((currentIndex) / (selectedQuestions.length || 1)) * 100;

  if (!currentQuestion) return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-kook-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="game-shell flex flex-col items-center min-h-screen relative overflow-hidden bg-[#F7F9FC]">
      {/* Dynamic Background Elements - 明亮色霓虹渐变 & 粒子感 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-kook-brand/20 rounded-full blur-[120px] opacity-70 mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-[#5C6BFF]/15 rounded-full blur-[120px] opacity-60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-color-burn"></div>
      </div>

      <div className="w-full max-w-[800px] z-10 p-6 md:p-10 pt-16 md:pt-20 flex-1 flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={handleBack} 
            disabled={currentIndex === 0} 
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#181A1F]/10 bg-white/60 hover:bg-white text-[#181A1F]/70 hover:text-[#181A1F] transition-all disabled:opacity-30 disabled:hover:bg-white/60 disabled:cursor-not-allowed shadow-sm backdrop-blur-md"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">返回</span>
          </button>
          
          <div className="flex-1 px-8">
            <div className="flex items-center justify-between mb-2 text-xs font-bold text-[#181A1F]/50 tracking-wider">
              <span>游戏人格构建 · {currentIndex + 1}/{selectedQuestions.length}</span>
              <span className="text-kook-brand">已完成 {Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#181A1F]/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-kook-brand to-[#5C6BFF]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-kook-brand/20 bg-white/80 shadow-sm text-kook-brand backdrop-blur-md">
            <Clock size={16} />
            <span className="font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Area - 3D 卡片翻转效果 */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -40, rotateY: 10 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="glass-panel p-8 md:p-12 relative"
              style={{ perspective: 1000 }}
            >
              <div className="mb-10">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-kook-brand/10 border border-kook-brand/20 flex items-center justify-center text-kook-brand">
                    <Zap size={18} />
                  </div>
                  <span className="text-kook-brand font-bold text-sm tracking-wider uppercase">
                    第 {currentIndex + 1} 题
                  </span>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl font-black text-[#181A1F] leading-[1.4] tracking-tight"
                >
                  {currentQuestion.title}
                </motion.h2>
                <p className="mt-3 text-[#181A1F]/50 text-sm font-medium">选择一个更接近你真实习惯的答案</p>
              </div>

              <div className="space-y-4">
                {currentQuestion.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    onClick={() => handleOptionSelect(option.score)}
                    onMouseEnter={() => setIsHoveredOption(idx)}
                    onMouseLeave={() => setIsHoveredOption(null)}
                    className="w-full p-6 text-left border border-[#181A1F]/5 rounded-2xl bg-white/60 hover:bg-white hover:border-kook-brand/50 hover:shadow-md transition-all duration-300 group option-hover-glow relative"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-lg md:text-xl text-[#181A1F]/80 font-medium group-hover:text-[#181A1F] group-hover:translate-x-2 transition-transform duration-300">
                        {option.label}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isHoveredOption === idx ? 'border-kook-brand text-kook-brand bg-kook-brand/5' : 'border-[#181A1F]/10 text-transparent bg-[#181A1F]/5'}`}>
                        <div className={`w-2 h-2 rounded-full bg-kook-brand transition-transform duration-300 ${isHoveredOption === idx ? 'scale-100' : 'scale-0'}`} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Hint */}
        <div className="mt-8 text-center text-xs font-medium text-[#181A1F]/40">
          本次测试会综合评估你的游戏风格、游戏性格、游戏偏好和活跃频率，最终生成更稳定的游戏人格结果。
        </div>
      </div>
    </main>
  );
}

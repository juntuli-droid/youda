"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import MatchFilter from '@/components/match/MatchFilter';
import MatchingState from '@/components/match/MatchingState';
import VoiceRoom from '@/components/match/VoiceRoom';

export default function MatchPage() {
  const [matchState, setMatchState] = useState<'filter' | 'matching' | 'room'>('filter');
  const [filters, setFilters] = useState<Record<string, string> | null>(null);

  const handleStartMatch = (selectedFilters: Record<string, string>) => {
    setFilters(selectedFilters);
    setMatchState('matching');
  };

  const handleCancelMatch = () => {
    setMatchState('filter');
  };

  const handleMatchSuccess = () => {
    setMatchState('room');
  };

  const handleLeaveRoom = () => {
    setMatchState('filter');
  };

  return (
    <main className="game-shell min-h-screen flex flex-col relative overflow-hidden bg-[#F7F9FC] transition-colors duration-500">
      {/* Background elements */}
      {matchState !== 'room' && (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-kook-brand/20 rounded-full blur-[120px]"></div>
        </div>
      )}

      <nav className="w-full h-[72px] flex items-center justify-between px-8 z-50 relative border-b bg-white/80 border-kook-border backdrop-blur">
        <Link href="/">
          <div className="flex items-center gap-2 transition-colors cursor-pointer font-medium text-kook-textMuted hover:text-kook-textMain">
            <span className="font-bold">←</span>
            <span className="text-sm">返回大厅</span>
          </div>
        </Link>
        <div className="font-bold tracking-wide text-lg text-kook-textMain">寻找游戏搭子</div>
        <div className="w-20"></div> {/* Spacer */}
      </nav>

      <div className="flex-1 flex flex-col items-center p-4 md:p-8 relative z-10 overflow-y-auto w-full">
        <AnimatePresence mode="wait">
          {matchState === 'filter' && (
            <MatchFilter key="filter" onStartMatch={handleStartMatch} />
          )}
          
          {matchState === 'matching' && filters && (
            <MatchingState 
              key="matching" 
              filters={filters} 
              onCancel={handleCancelMatch} 
              onSuccess={handleMatchSuccess} 
            />
          )}

          {matchState === 'room' && filters && (
            <VoiceRoom 
              key="room" 
              filters={filters} 
              onLeave={handleLeaveRoom} 
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

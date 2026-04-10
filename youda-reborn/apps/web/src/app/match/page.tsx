"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import MatchFilter from '@/components/match/MatchFilter';
import MatchingState from '@/components/match/MatchingState';
import VoiceRoom from '@/components/match/VoiceRoom';
import { MatchFilters, MatchQueueState } from '@/components/match/types';
import { calculatePersonality, resolveAvatar } from '@youda/game-assets';

export default function MatchPage() {
  const [matchState, setMatchState] = useState<'filter' | 'matching' | 'room'>('filter');
  const [filters, setFilters] = useState<MatchFilters | null>(null);
  const [queueState, setQueueState] = useState<MatchQueueState | null>(null);

  useEffect(() => {
    try {
      const storedScores = localStorage.getItem('personalityScores')
      if (!storedScores) {
        return
      }

      const scores = JSON.parse(storedScores)
      const result = calculatePersonality(scores)
      const avatarUrl = resolveAvatar(result.code)

      void fetch('/api/auth/me', { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json()
          if (
            !response.ok ||
            (data.user?.avatarUrl === avatarUrl && data.user?.personalityCode === result.code)
          ) {
            return
          }

          return fetch('/api/users/me/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              avatarUrl,
              personalityCode: result.code
            })
          })
        })
        .catch(() => undefined)
    } catch {
      // Ignore local parsing errors here and let the normal match flow continue.
    }
  }, [])

  const handleStartMatch = (selectedFilters: MatchFilters) => {
    setFilters(selectedFilters);
    setMatchState('matching');
  };

  const handleCancelMatch = () => {
    setQueueState(null);
    setMatchState('filter');
  };

  const handleMatchSuccess = (nextState: MatchQueueState) => {
    setQueueState(nextState);
    setMatchState('room');
  };

  const handleLeaveRoom = () => {
    setQueueState(null);
    setMatchState('filter');
  };

  const handleEnterTestRoom = (selectedFilters: MatchFilters) => {
    const roomCode = `TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setFilters(selectedFilters)
    setQueueState({
      queueEntryId: `test-${Date.now()}`,
      status: 'READY',
      mode: 'test',
      matchId: `test-room-${roomCode}`,
      roomCode,
      matchedUser: {
        id: 'test-peer',
        displayName: '测试搭子',
        avatarUrl: '/game-assets/avatars/characters/avatar/char-22-mercy-avatar.png',
        mbtiType: 'ENFP'
      }
    })
    setMatchState('room')
  }

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
            <MatchFilter
              key="filter"
              onStartMatch={handleStartMatch}
              onEnterTestRoom={handleEnterTestRoom}
            />
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
              queueState={queueState}
              onLeave={handleLeaveRoom} 
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

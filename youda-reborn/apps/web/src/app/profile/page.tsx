"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { resolveAvatar, calculatePersonality, getPersonalityMeta } from "@youda/game-assets";
import { motion } from "framer-motion";
import { Gamepad2, Trophy, Video, Calendar, ArrowRight, UserPlus, Zap, Copy, Check } from "lucide-react";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { ManageBadgesModal } from "@/components/profile/ManageBadgesModal";
import { AddCareerModal } from "@/components/profile/AddCareerModal";
import { PublishVlogModal } from "@/components/profile/PublishVlogModal";
import { FriendSidebar } from "@/components/friends/FriendSidebar";
import { PrivateChat } from "@/components/friends/PrivateChat";
import { EmptyStateCard } from "@/components/empty/EmptyStateCard";

import { User, Career, Vlog } from "@/lib/db";
import { badgeCatalogById } from "@/lib/badges";
import { FriendListEntry } from "@/components/friends/types";

export default function ProfilePage() {
  const router = useRouter();
  const [personality, setPersonality] = useState<{ code?: string, name?: string } | null>(null);
  const [meta, setMeta] = useState<{ character?: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [copiedPublicId, setCopiedPublicId] = useState(false);

  // Modal states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isManageBadgesOpen, setIsManageBadgesOpen] = useState(false);
  const [isAddCareerOpen, setIsAddCareerOpen] = useState(false);
  const [isPublishVlogOpen, setIsPublishVlogOpen] = useState(false);
  
  // Chat state
  const [activeChatFriend, setActiveChatFriend] = useState<FriendListEntry | null>(null);
  const hasAssessment = Boolean(personality?.code);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/auth/me?include=profile', {
        cache: 'no-store'
      });
      const data = await res.json();
      if (res.status === 401) {
        setIsUnauthorized(true);
        setUser(null);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || '用户信息加载失败');
      }

      if (data.user) {
        setIsUnauthorized(false);
        setUserLoadError(null);
        setUser(data.user);
      }
    } catch (e) {
      setUserLoadError(e instanceof Error ? e.message : '用户信息加载失败');
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('light-assessment-theme');
    fetchUserData();
    
    try {
      const storedScores = localStorage.getItem('personalityScores');
      if (storedScores) {
        const scores = JSON.parse(storedScores);
        const result = calculatePersonality(scores);
        setPersonality(result);
        const metaInfo = getPersonalityMeta(result.code);
        setMeta(metaInfo);
        setAvatar(resolveAvatar(result.code));
      }
    } catch (e) {
      console.error(e);
    }
    
    return () => {
      document.documentElement.classList.remove('light-assessment-theme');
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !personality?.code) {
      return;
    }

    const nextAvatar = avatar ?? undefined
    if (user.avatarUrl === nextAvatar && user.personalityCode === personality.code) {
      return
    }

    void fetch('/api/users/me/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        avatarUrl: nextAvatar,
        personalityCode: personality.code
      })
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        setUser((current) =>
          current
            ? {
                ...current,
                avatarUrl: nextAvatar,
                personalityCode: personality.code
              }
            : current
        );
      })
      .catch(() => undefined);
  }, [avatar, personality?.code, user?.avatarUrl, user?.id, user?.personalityCode]);

  const handleCopyPublicId = async () => {
    if (!user?.publicId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(user.publicId);
      setCopiedPublicId(true);
      window.setTimeout(() => setCopiedPublicId(false), 1600);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="game-shell min-h-screen bg-[#F7F9FC] overflow-x-hidden">
      <Navbar />
      
      <div className="flex-1 w-full flex flex-col items-center p-4 md:p-8 pt-8 relative">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-kook-brand/20 rounded-full blur-[120px] mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-[-10%] w-[40vw] h-[40vw] bg-[#5C6BFF]/15 rounded-full blur-[120px] mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] mix-blend-color-burn"></div>
        </div>

        <div className="w-full max-w-[1320px] mx-auto z-10 flex flex-col gap-6">
        {isUnauthorized && (
          <EmptyStateCard
            scenario="permission-denied"
            icon="🔐"
            onAction={() => router.push('/login?callbackUrl=/profile')}
          />
        )}

        {!isUnauthorized && userLoadError && (
          <EmptyStateCard
            scenario="network-error"
            icon="📡"
            onAction={() => {
              void fetchUserData();
            }}
          />
        )}
        
        {/* Banner & Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel overflow-hidden relative bg-white/70 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
        >
          {/* Banner Image */}
          <div className="w-full h-40 md:h-56 bg-gradient-to-r from-[#E3E5E8] via-[#F2F3F5] to-[#E3E5E8] relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white/80 to-transparent"></div>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white bg-white shadow-xl flex items-center justify-center overflow-hidden relative group cursor-pointer"
                onClick={() => setIsEditProfileOpen(true)}
              >
                {user?.avatarUrl || avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user?.avatarUrl || avatar || ""} alt="avatar" className="w-full h-full object-cover filter contrast-105" />
                ) : (
                  <span className="text-5xl">🎮</span>
                )}
                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  <span className="text-[#181A1F] text-sm font-bold">更换头像</span>
                </div>
              </div>
              
              {/* User Info */}
              <div className="pb-2">
                <h1 className="text-3xl md:text-4xl font-black text-[#181A1F] mb-2 flex items-center gap-3">
                  {user?.nickname || user?.username || meta?.character || "未命名玩家"}
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-kook-brand/20 text-kook-brand border border-kook-brand/30">Lv.42</span>
                </h1>
                <p className="text-[#181A1F]/60 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-kook-brand animate-pulse"></span>
                  在线 · {personality ? personality.name : "请先完成游戏人格测评"}
                </p>
                {user?.publicId && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#181A1F]/10 bg-white/80 px-3 py-1 text-xs font-black tracking-[0.14em] text-[#181A1F]/70">
                      <span className="text-[#8D93A5]">有搭 ID</span>
                      <span className="text-[#181A1F]">{user.publicId}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPublicId}
                      className="inline-flex items-center gap-1 rounded-full border border-[#181A1F]/10 bg-white/70 px-3 py-1 text-xs font-bold text-[#5C6068] transition-colors hover:border-kook-brand/30 hover:text-kook-brand"
                    >
                      {copiedPublicId ? <Check size={14} /> : <Copy size={14} />}
                      {copiedPublicId ? "已复制" : "复制 ID"}
                    </button>
                  </div>
                )}
                {personality?.code && (
                  <div className="mt-2 inline-flex rounded-full border border-[#5C6BFF]/20 bg-[#5C6BFF]/8 px-3 py-1 text-xs font-black tracking-[0.16em] text-[#4B5AE3]">
                    游戏人格 {personality.code}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="bg-white/80 border-[#181A1F]/10 text-[#181A1F] hover:bg-[#F7F9FC] font-bold shadow-sm" onClick={() => setIsEditProfileOpen(true)}>
                编辑资料
              </Button>
              <Button variant="outline" className="bg-white/80 border-[#181A1F]/10 text-[#181A1F] hover:bg-[#F7F9FC] w-10 p-0 flex items-center justify-center shadow-sm">
                <UserPlus size={18} />
              </Button>
            </div>
          </div>
        </motion.div>

        {!hasAssessment && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-panel border border-kook-brand/15 bg-white/75 p-5 md:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-kook-brand">
                  新用户第一步
                </div>
                <h2 className="text-xl font-black text-[#181A1F] md:text-2xl">
                  先完成游戏人格测评
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#5C6068]">
                  测评结果会决定你的游戏人格标签、主页展示和匹配权重。先把这一步做完，主页内容和匹配建议才会完整。
                </p>
              </div>
              <Button
                variant="kook-brand"
                className="min-h-12 px-6 text-base font-bold shadow-[0_8px_20px_rgba(46,211,158,0.2)]"
                onClick={() => router.push('/personality')}
              >
                去做测评
              </Button>
            </div>
          </motion.div>
        )}

        {/* 核心交互区：匹配按钮 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <button 
            onClick={() => router.push(hasAssessment ? '/match' : '/personality')}
            className="w-full relative group overflow-hidden rounded-[24px] p-[2px] shadow-[0_10px_30px_rgba(46,211,158,0.15)]"
          >
            {/* 动态渐变边框 */}
            <div className="absolute inset-0 bg-gradient-to-r from-kook-brand via-[#5C6BFF] to-kook-brand opacity-80 group-hover:opacity-100 bg-[length:200%_auto] animate-gradient-x transition-opacity"></div>
            
            {/* 内部按钮实体 */}
            <div className="relative bg-white rounded-[22px] px-8 py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 group-hover:bg-[#F7F9FC]">
              <div className="flex items-center gap-6 text-left">
                <div className="w-16 h-16 rounded-full bg-kook-brand/10 border border-kook-brand/30 flex items-center justify-center text-kook-brand shadow-[0_0_20px_rgba(46,211,158,0.2)] group-hover:scale-110 transition-transform">
                  <Zap size={32} className="fill-kook-brand" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#181A1F] mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-kook-brand group-hover:to-[#5C6BFF] transition-all">
                    {hasAssessment ? '寻找你的游戏搭子' : '先解锁你的游戏人格'}
                  </h2>
                  <p className="text-[#181A1F]/60 font-medium text-sm md:text-base">
                    {hasAssessment
                      ? `基于 ${personality?.code ?? '游戏'} 人格算法，为你匹配节奏最契合的灵魂队友`
                      : '先完成 16 道游戏人格测评题，再开始更准确的匹配和主页展示'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white font-bold bg-kook-brand px-8 py-4 rounded-full shadow-[0_5px_15px_rgba(46,211,158,0.4)] group-hover:scale-105 transition-transform text-lg">
                {hasAssessment ? '开始匹配' : '开始测评'} <ArrowRight size={20} />
              </div>
            </div>
          </button>
        </motion.div>

        {/* Three Column Layout for Content */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          
          {/* Left Column - Stats & Badges */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 self-start"
          >
            {/* 游戏人格卡片 */}
            <div className="glass-panel p-6 bg-white/70">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#181A1F] flex items-center gap-2">
                  <Gamepad2 size={20} className="text-kook-brand" /> 游戏人格
                </h3>
                <button onClick={() => router.push('/personality')} className="text-xs font-bold text-kook-brand hover:underline">重新测评</button>
              </div>
              
              {personality ? (
                <div className="p-5 bg-gradient-to-br from-kook-brand/10 to-transparent border border-kook-brand/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute right-[-10%] top-[-10%] text-6xl opacity-[0.05] font-black italic text-[#181A1F]">{personality.code}</div>
                  <div className="text-3xl font-black text-kook-brand mb-1">{personality.code}</div>
                  <div className="text-sm font-bold text-[#181A1F]/80">{personality.name}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-[#181A1F]/5 border border-[#181A1F]/10 text-[10px] font-bold text-[#181A1F]/60">战术执行</span>
                    <span className="px-2 py-1 rounded bg-[#181A1F]/5 border border-[#181A1F]/10 text-[10px] font-bold text-[#181A1F]/60">高频在线</span>
                  </div>
                </div>
              ) : (
                <EmptyStateCard
                  scenario="missing-profile"
                  icon="🧬"
                  className="p-5"
                  actionLabel="去测评"
                  onAction={() => router.push('/personality')}
                />
              )}
            </div>

            {/* 奖章系统 */}
            <div className="glass-panel p-6 bg-white/70">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#181A1F] flex items-center gap-2">
                  <Trophy size={20} className="text-[#F5A623]" /> 荣誉奖章
                </h3>
                <button onClick={() => setIsManageBadgesOpen(true)} className="text-xs font-bold text-[#181A1F]/50 hover:text-[#181A1F] transition-colors">管理</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {user?.badges?.map((badgeId) => {
                  const badge = badgeCatalogById[badgeId];
                  if (!badge) return null;
                  return (
                    <div key={badgeId} className="aspect-square bg-gradient-to-b from-white to-[#F7F9FC] rounded-2xl border border-[#181A1F]/10 flex items-center justify-center p-3 relative group shadow-sm hover:shadow-md transition-shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={badge.icon} alt={badge.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform drop-shadow-[0_5px_10px_rgba(245,166,35,0.2)]" />
                      <div className="absolute -bottom-8 bg-white text-xs font-bold text-[#181A1F] border border-[#181A1F]/10 shadow-lg px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">{badge.name}</div>
                    </div>
                  );
                })}
                {(!user?.badges || user.badges.length < 3) && (
                  <div onClick={() => setIsManageBadgesOpen(true)} className="aspect-square border-2 border-dashed border-[#181A1F]/20 rounded-2xl flex items-center justify-center text-[#181A1F]/30 hover:border-kook-brand hover:text-kook-brand cursor-pointer transition-colors bg-white/50">
                    <span className="text-2xl font-light">+</span>
                  </div>
                )}
              </div>
              {!user?.avatarUrl && !avatar && (
                <div className="mt-4">
                  <EmptyStateCard
                    scenario="missing-avatar"
                    icon="🖼️"
                    className="p-4"
                    onAction={() => setIsEditProfileOpen(true)}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Middle Column - Game Career / 生涯数据 & Vlog */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="min-w-0 space-y-6 self-start"
          >
            {/* 游戏生涯 */}
            <div className="glass-panel p-6 bg-white/70">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#181A1F] flex items-center gap-2">
                  <Calendar size={20} className="text-[#5C6BFF]" /> 游戏生涯
                </h3>
                <button onClick={() => setIsAddCareerOpen(true)} className="text-xs font-bold text-[#181A1F]/50 hover:text-[#181A1F] transition-colors">添加记录</button>
              </div>
              
              <div className="space-y-5">
                {user?.careers && user.careers.length > 0 ? (
                  user.careers.map((career: Career) => (
                    <div
                      key={career.id}
                      className="overflow-hidden rounded-2xl border border-[#181A1F]/6 bg-white shadow-sm"
                    >
                      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="text-lg font-black text-[#181A1F]">
                            {career.gameName}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#181A1F]/10 bg-[#F7F9FC] px-3 py-1 text-xs font-bold text-[#5C6068]">
                              段位 · {career.rank}
                            </span>
                            <span className="rounded-full border border-kook-brand/20 bg-kook-brand/8 px-3 py-1 text-xs font-bold text-kook-brand">
                              已录入
                            </span>
                          </div>
                        </div>

                        <div className="grid min-w-[220px] grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-[#181A1F]/8 bg-[#F7F9FC] px-4 py-4">
                            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D93A5]">
                              累计时长
                            </div>
                            <div className="mt-2 text-2xl font-black text-kook-brand">
                              {career.hours}
                            </div>
                            <div className="mt-1 text-xs font-medium text-[#8D93A5]">
                              小时
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[#181A1F]/8 bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8D93A5]">
                              当前标签
                            </div>
                            <div className="mt-2 text-base font-black text-[#181A1F]">
                              {career.rank}
                            </div>
                            <div className="mt-1 text-xs font-medium text-[#8D93A5]">
                              生涯档案
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyStateCard
                    scenario="no-careers"
                    icon="🎮"
                    className="p-5"
                    onAction={() => setIsAddCareerOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* 游戏 Vlog */}
            <div className="glass-panel bg-white/70 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#181A1F] flex items-center gap-2">
                  <Video size={20} className="text-[#E84393]" /> 游戏 Vlog
                </h3>
                <button onClick={() => setIsPublishVlogOpen(true)} className="text-xs font-bold text-kook-brand hover:underline">发布</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user?.vlogs && user.vlogs.length > 0 ? (
                  user.vlogs.map((vlog: Vlog) => (
                    <div key={vlog.id} className="group relative rounded-xl overflow-hidden cursor-pointer shadow-md h-36 border border-[#E3E5E8] bg-white">
                      {vlog.type === 'video' ? (
                        <div className="absolute inset-0 bg-[#E3E5E8] relative w-full h-full">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-105"></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-[#181A1F]/90 via-[#181A1F]/30 to-transparent"></div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.5)] backdrop-blur-md flex items-center justify-center border border-white">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-kook-brand border-b-[6px] border-b-transparent ml-1"></div>
                            </div>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="text-xs text-kook-brand font-black tracking-wide mb-1 drop-shadow-md">{vlog.gameName}</div>
                            <div className="text-sm font-bold text-white line-clamp-2 leading-tight drop-shadow-md">{vlog.title}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 h-full flex flex-col justify-between bg-gradient-to-br from-white to-[#F7F9FC] hover:to-[#F2F3F5] transition-colors">
                          <div>
                            <div className="text-xs text-[#5C6BFF] font-black tracking-wide mb-2 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5C6BFF]"></span>
                              {vlog.gameName}
                            </div>
                            <div className="text-sm font-bold text-[#181A1F] line-clamp-2 leading-tight mb-1">{vlog.title}</div>
                            <div className="text-xs text-[#8D93A5] line-clamp-2">{vlog.content}</div>
                          </div>
                          <div className="text-[10px] font-bold text-[#C4C9D2]">游戏日志 · {new Date(vlog.createdAt).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <EmptyStateCard
                      scenario="no-vlogs"
                      icon="📼"
                      className="flex min-h-[260px] flex-col justify-center"
                      onAction={() => setIsPublishVlogOpen(true)}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Friend Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="self-start lg:col-span-2 xl:col-span-1"
          >
            <div className="xl:sticky xl:top-24">
              <FriendSidebar
                activePeerId={activeChatFriend?.peerId}
                onOpenChat={(friend) => setActiveChatFriend(friend)}
              />
            </div>
          </motion.div>
          
        </div>
      </div>

      {isEditProfileOpen && (
        <EditProfileModal 
          initialNickname={user?.nickname || ""}
          onClose={() => setIsEditProfileOpen(false)} 
          onSuccess={() => {
            setIsEditProfileOpen(false);
            fetchUserData();
          }} 
        />
      )}
      
      {isManageBadgesOpen && (
        <ManageBadgesModal 
          unlockedBadges={user?.unlockedBadges || []}
          activeBadges={user?.badges || []}
          onClose={() => setIsManageBadgesOpen(false)} 
          onSuccess={() => {
            setIsManageBadgesOpen(false);
            fetchUserData();
          }} 
        />
      )}

      {isAddCareerOpen && (
        <AddCareerModal 
          onClose={() => setIsAddCareerOpen(false)} 
          onSuccess={() => {
            setIsAddCareerOpen(false);
            fetchUserData();
          }} 
        />
      )}

      {isPublishVlogOpen && (
        <PublishVlogModal 
          onClose={() => setIsPublishVlogOpen(false)} 
          onSuccess={() => {
            setIsPublishVlogOpen(false);
            fetchUserData();
          }} 
        />
      )}

      {activeChatFriend && (
        <PrivateChat 
          friend={activeChatFriend} 
          currentUserId={user?.id}
          onClose={() => setActiveChatFriend(null)} 
        />
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}} />
      </div>
      <Footer />
    </main>
  );
}

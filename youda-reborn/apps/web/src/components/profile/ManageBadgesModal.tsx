"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ManageBadgesModalProps {
  unlockedBadges: string[];
  activeBadges: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageBadgesModal({ unlockedBadges, activeBadges, onClose, onSuccess }: ManageBadgesModalProps) {
  const [selected, setSelected] = useState<string[]>(activeBadges);
  const [isLoading, setIsLoading] = useState(false);

  const toggleBadge = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(b => b !== id));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, id]);
      }
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/users/me/badges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badges: selected }),
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const allBadges = [
    { id: "BADGE_012", name: "辐射段位", icon: "/game-assets/badges/icons/rank/badge-rank-radiant-active.png" },
    { id: "BADGE_004", name: "超凡入圣", icon: "/game-assets/badges/icons/rank/badge-rank-ascendant-active.png" },
    { id: "BADGE_011", name: "大师", icon: "/game-assets/badges/icons/rank/badge-rank-master-active.png" },
    { id: "BADGE_015", name: "钻石", icon: "/game-assets/badges/icons/rank/badge-rank-diamond-active.png" },
    { id: "BADGE_003", name: "白金", icon: "/game-assets/badges/icons/rank/badge-rank-platinum-plus-active.png" },
    { id: "BADGE_013", name: "黄金", icon: "/game-assets/badges/icons/rank/badge-rank-gold-active.png" },
    { id: "BADGE_002", name: "白银", icon: "/game-assets/badges/icons/rank/badge-rank-silver-active.png" },
    { id: "BADGE_014", name: "青铜", icon: "/game-assets/badges/icons/rank/badge-rank-bronze-active.png" },
    { id: "BADGE_001", name: "黑铁", icon: "/game-assets/badges/icons/rank/badge-rank-iron-active.png" },
    { id: "BADGE_005", name: "百战不殆", icon: "/game-assets/badges/icons/achievement/badge-achievement-01-active.png" },
    { id: "BADGE_006", name: "成就2", icon: "/game-assets/badges/icons/achievement/badge-achievement-02-active.png" },
    { id: "BADGE_007", name: "成就3", icon: "/game-assets/badges/icons/achievement/badge-achievement-03-active.png" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[#181A1F]">管理荣誉奖章</h2>
          <span className="text-sm font-bold text-kook-brand bg-kook-brand/10 px-3 py-1 rounded-full">已选 {selected.length}/3</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
          {allBadges.map(badge => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const isSelected = selected.includes(badge.id);
            
            return (
              <div 
                key={badge.id} 
                onClick={() => isUnlocked && toggleBadge(badge.id)}
                className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                  !isUnlocked ? 'opacity-50 grayscale cursor-not-allowed border-transparent bg-gray-50' : 
                  isSelected ? 'border-kook-brand bg-kook-brand/5 shadow-md cursor-pointer' : 
                  'border-transparent bg-[#F7F9FC] hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <img src={badge.icon} alt={badge.name} className="w-16 h-16 object-contain mb-2" />
                <span className="text-xs font-bold text-[#181A1F]">{badge.name}</span>
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl">
                    <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded shadow-sm">未解锁</span>
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-kook-brand text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>取消</Button>
          <Button variant="kook-brand" className="flex-1" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "保存中..." : "确认展示"}
          </Button>
        </div>
      </div>
    </div>
  );
}

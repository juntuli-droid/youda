"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface AddCareerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCareerModal({ onClose, onSuccess }: AddCareerModalProps) {
  const [gameName, setGameName] = useState("无畏契约 (Valorant)");
  const [hours, setHours] = useState("");
  const [rank, setRank] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch("/api/users/me/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, hours: Number(hours), rank }),
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-[#181A1F] mb-6">添加游戏生涯</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#181A1F] mb-2">选择游戏</label>
            <select 
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none font-medium"
            >
              <option value="无畏契约 (Valorant)">无畏契约 (Valorant)</option>
              <option value="Apex 英雄">Apex 英雄</option>
              <option value="英雄联盟">英雄联盟</option>
              <option value="守望先锋">守望先锋</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#181A1F] mb-2">游玩时长 (小时)</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none"
              placeholder="例如: 1240"
              required
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#181A1F] mb-2">当前段位</label>
            <input
              type="text"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none"
              placeholder="例如: 超凡入圣、白金、辐射"
              required
            />
            <p className="text-xs text-gray-500 mt-2">提示：输入对应段位名称可自动解锁相关的段位荣誉奖章。</p>
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} type="button">取消</Button>
            <Button variant="kook-brand" className="flex-1" type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "确认添加"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

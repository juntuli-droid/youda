"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface EditProfileModalProps {
  initialNickname?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProfileModal({ initialNickname, onClose, onSuccess }: EditProfileModalProps) {
  const [nickname, setNickname] = useState(initialNickname || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch("/api/users/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
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
        <h2 className="text-2xl font-black text-[#181A1F] mb-6">编辑个人资料</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#181A1F] mb-2">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none"
              placeholder="请输入你的新昵称"
              required
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} type="button">取消</Button>
            <Button variant="kook-brand" className="flex-1" type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

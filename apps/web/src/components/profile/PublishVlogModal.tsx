"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface PublishVlogModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PublishVlogModal({ onClose, onSuccess }: PublishVlogModalProps) {
  const [type, setType] = useState<'video' | 'log'>('video');
  const [title, setTitle] = useState("");
  const [gameName, setGameName] = useState("无畏契约 (Valorant)");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch("/api/users/me/vlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          gameName, 
          type,
          videoUrl: type === 'video' ? videoUrl : undefined,
          content: type === 'log' ? content : undefined
        }),
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
        <h2 className="text-2xl font-black text-[#181A1F] mb-6">记录游戏 Vlog</h2>
        
        <div className="flex gap-2 mb-6 p-1 bg-[#F2F3F5] rounded-xl">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === 'video' ? 'bg-white shadow-sm text-[#181A1F]' : 'text-[#8D93A5]'}`}
            onClick={() => setType('video')}
          >
            视频记录
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === 'log' ? 'bg-white shadow-sm text-[#181A1F]' : 'text-[#8D93A5]'}`}
            onClick={() => setType('log')}
          >
            图文日志
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#181A1F] mb-2">所属游戏</label>
            <select 
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none font-medium text-[#181A1F]"
            >
              <option value="无畏契约 (Valorant)">无畏契约 (Valorant)</option>
              <option value="Apex 英雄">Apex 英雄</option>
              <option value="英雄联盟">英雄联盟</option>
              <option value="守望先锋">守望先锋</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#181A1F] mb-2">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none text-[#181A1F]"
              placeholder={type === 'video' ? "一句话描述你的高光操作..." : "今天发生了什么有趣的事？"}
              required
            />
          </div>
          
          {type === 'video' ? (
            <div>
              <label className="block text-sm font-bold text-[#181A1F] mb-2">视频链接 (选填)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none text-[#181A1F]"
                placeholder="https://"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-[#181A1F] mb-2">日志内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none text-[#181A1F] min-h-[100px] resize-none"
                placeholder="记录一下这局的感受吧..."
                required
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1 border-[#E3E5E8] text-[#181A1F] hover:bg-[#F7F9FC]" onClick={onClose} type="button">取消</Button>
            <Button variant="kook-brand" className="flex-1 shadow-[0_5px_15px_rgba(46,211,158,0.2)]" type="submit" disabled={isLoading}>
              {isLoading ? "发布中..." : "立即发布"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

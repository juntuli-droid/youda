"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '登录失败');
      }

      router.push(callbackUrl);
      router.refresh(); // Refresh to update navbar state
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('发生未知错误');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="game-shell flex items-center justify-center min-h-screen bg-[#F7F9FC] p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[40vw] h-[40vw] bg-kook-brand/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] bg-[#5C6BFF]/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-[#E3E5E8] relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-kook-brand to-kook-brandHover flex items-center justify-center rounded-kook-md text-white font-black text-2xl mx-auto mb-4 shadow-sm">
            有
          </div>
          <h1 className="text-2xl font-black text-[#181A1F] tracking-tight">欢迎回来</h1>
          <p className="text-[#5C6068] text-sm mt-2 font-medium">登录你的有搭账号</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-bold text-[#181A1F] ml-1">账号</label>
            <input 
              type="text" 
              placeholder="用户名或邮箱" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none transition-all text-[#181A1F] font-medium placeholder:text-[#8D93A5]"
              required
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-bold text-[#181A1F]">密码</label>
              <a href="#" className="text-xs font-bold text-kook-brand hover:text-kook-brandHover">忘记密码？</a>
            </div>
            <input 
              type="password" 
              placeholder="请输入密码" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none transition-all text-[#181A1F] font-medium placeholder:text-[#8D93A5]"
              required
            />
          </div>
          
          <div className="flex items-center gap-2 ml-1 pt-1">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-[#E3E5E8] text-kook-brand focus:ring-kook-brand/30" />
            <label htmlFor="remember" className="text-sm text-[#5C6068] font-medium cursor-pointer">记住我</label>
          </div>

          <Button 
            variant="kook-brand" 
            className="w-full py-4 text-base font-bold shadow-[0_8px_20px_rgba(46,211,158,0.25)] rounded-xl mt-4" 
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '立即登录'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[#5C6068]">
          还没有账号？ <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-kook-brand font-bold hover:underline">免费注册</Link>
        </div>
      </div>
    </main>
  );
}
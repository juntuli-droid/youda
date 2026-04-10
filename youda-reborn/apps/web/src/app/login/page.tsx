"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/profile';
  const registerCallbackUrl = searchParams.get('callbackUrl') || '/personality';
  const challengeToken = searchParams.get('challenge');
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!challengeToken) {
      return;
    }

    let cancelled = false;

    const verifyChallenge = async () => {
      setIsLoading(true);
      setError("");
      setNotice("正在验证你的登录环境，请稍候...");

      try {
        const res = await fetch('/api/auth/login/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: challengeToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '验证失败');
        }

        if (!cancelled) {
          setNotice('验证成功，正在进入你的主页...');
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (verifyError: unknown) {
        if (!cancelled) {
          setError(verifyError instanceof Error ? verifyError.message : '验证失败');
          setNotice('');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void verifyChallenge();

    return () => {
      cancelled = true;
    };
  }, [challengeToken, callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          data.requiresChallenge
            ? '检测到新的登录环境，请先前往邮箱点击验证链接'
            : data.details
              ? `${data.error}: ${data.details}`
              : data.error;
        throw new Error(errorMsg || '登录失败');
      }

      if (data.securityNotice) {
        setNotice(data.securityNotice);
      }

      router.push(callbackUrl);
      router.refresh(); // Refresh to update navbar state
    } catch (err: unknown) {
      console.error("Login error:", err);
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

        {notice && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium text-center">
            {notice}
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
              <Link href="/reset-password" className="text-xs font-bold text-kook-brand hover:text-kook-brandHover">忘记密码？</Link>
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
          <Button 
            variant="kook-brand" 
            className="w-full py-4 text-base font-bold shadow-[0_8px_20px_rgba(46,211,158,0.25)] rounded-xl mt-4" 
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '立即登录'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[#5C6068]">
          还没有账号？ <Link href={`/register?callbackUrl=${encodeURIComponent(registerCallbackUrl)}`} className="text-kook-brand font-bold hover:underline">免费注册</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}

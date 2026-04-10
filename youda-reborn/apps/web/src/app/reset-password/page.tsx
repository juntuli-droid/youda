"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"request" | "reset">(initialToken ? "reset" : "request");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitResetRequest = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "提交失败");
      }

      setMessage(data.message ?? "如果邮箱存在，我们已发送重置邮件");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "提交失败");
    } finally {
      setIsLoading(false);
    }
  };

  const submitPasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "重置失败");
      }

      setMessage(data.message ?? "密码重置成功");
      setPassword("");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "重置失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="game-shell flex min-h-screen items-center justify-center bg-[#F7F9FC] p-4">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 h-[40vw] w-[40vw] rounded-full bg-kook-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[30vw] w-[30vw] rounded-full bg-[#5C6BFF]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[460px] rounded-3xl border border-[#E3E5E8] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-kook-md bg-gradient-to-br from-kook-brand to-kook-brandHover text-2xl font-black text-white shadow-sm">
            有
          </div>
          <h1 className="text-2xl font-black text-[#181A1F]">
            {mode === "request" ? "找回密码" : "重置密码"}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#5C6068]">
            {mode === "request"
              ? "输入注册邮箱，我们会发送一个 15 分钟内有效的重置链接。"
              : "输入重置令牌和新密码，完成账号密码更新。"}
          </p>
        </div>

        <div className="mb-6 flex rounded-xl bg-[#F2F3F5] p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => setMode("request")}
            className={`flex-1 rounded-lg px-3 py-2 ${mode === "request" ? "bg-white text-[#181A1F] shadow-sm" : "text-[#5C6068]"}`}
          >
            申请邮件
          </button>
          <button
            type="button"
            onClick={() => setMode("reset")}
            className={`flex-1 rounded-lg px-3 py-2 ${mode === "reset" ? "bg-white text-[#181A1F] shadow-sm" : "text-[#5C6068]"}`}
          >
            立即重置
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {mode === "request" ? (
          <form onSubmit={submitResetRequest} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#181A1F]">注册邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-transparent bg-[#F2F3F5] px-4 py-3 outline-none transition-all focus:border-kook-brand focus:bg-white"
                placeholder="请输入注册时使用的邮箱"
                required
              />
            </div>
            <Button variant="kook-brand" className="w-full py-4 text-base font-bold" disabled={isLoading}>
              {isLoading ? "提交中..." : "发送重置邮件"}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitPasswordReset} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#181A1F]">重置令牌</label>
              <input
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="w-full rounded-xl border border-transparent bg-[#F2F3F5] px-4 py-3 outline-none transition-all focus:border-kook-brand focus:bg-white"
                placeholder="从邮件链接中复制 token"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#181A1F]">新密码</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                className="w-full rounded-xl border border-transparent bg-[#F2F3F5] px-4 py-3 outline-none transition-all focus:border-kook-brand focus:bg-white"
                placeholder="至少 8 个字符"
                required
              />
            </div>
            <Button variant="kook-brand" className="w-full py-4 text-base font-bold" disabled={isLoading}>
              {isLoading ? "重置中..." : "确认重置密码"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm font-medium text-[#5C6068]">
          想起密码了？{" "}
          <Link href="/login" className="font-bold text-kook-brand hover:underline">
            返回登录
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="game-shell flex min-h-screen items-center justify-center bg-[#F7F9FC]">Loading...</main>}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

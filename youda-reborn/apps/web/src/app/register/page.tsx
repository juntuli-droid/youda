import Link from "next/link";
import { Button } from "@/components/ui/Button";

type RegisterPageProps = {
  searchParams?: {
    callbackUrl?: string;
    error?: string;
    username?: string;
    email?: string;
  };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const callbackUrl = searchParams?.callbackUrl || "/personality";
  const error = searchParams?.error;
  const username = searchParams?.username || "";
  const email = searchParams?.email || "";

  return (
    <main className="game-shell flex items-center justify-center min-h-screen bg-[#F7F9FC] p-4">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-kook-brand/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-[#5C6BFF]/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-[#E3E5E8] relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-kook-brand to-kook-brandHover flex items-center justify-center rounded-kook-md text-white font-black text-2xl mx-auto mb-4 shadow-sm">
            有
          </div>
          <h1 className="text-2xl font-black text-[#181A1F] tracking-tight">创建新账号</h1>
          <p className="text-[#5C6068] text-sm mt-2 font-medium">加入有搭，寻找你的灵魂队友</p>
        </div>

        {error ? (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        ) : null}

        <form action="/register/submit" method="post" className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-1">
            <label className="text-sm font-bold text-[#181A1F] ml-1">用户名</label>
            <input
              type="text"
              name="username"
              placeholder="怎么称呼你？"
              defaultValue={username}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none transition-all text-[#181A1F] font-medium placeholder:text-[#8D93A5]"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-[#181A1F] ml-1">邮箱</label>
            <input
              type="email"
              name="email"
              placeholder="请输入常用邮箱"
              defaultValue={email}
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none transition-all text-[#181A1F] font-medium placeholder:text-[#8D93A5]"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-[#181A1F] ml-1">密码</label>
            <input
              type="password"
              name="password"
              placeholder="至少 6 个字符"
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none transition-all text-[#181A1F] font-medium placeholder:text-[#8D93A5]"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-[#181A1F] ml-1">确认密码</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="请再次输入密码"
              className="w-full px-4 py-3 rounded-xl bg-[#F2F3F5] border border-transparent focus:border-kook-brand focus:bg-white outline-none transition-all text-[#181A1F] font-medium placeholder:text-[#8D93A5]"
              required
              minLength={6}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="kook-brand"
              className="w-full py-4 text-base font-bold shadow-[0_8px_20px_rgba(46,211,158,0.25)] rounded-xl"
            >
              免费注册
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-[#5C6068]">
          已有账号？{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-kook-brand font-bold hover:underline"
          >
            立即登录
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LogoutButton } from "./LogoutButton";

export function Navbar() {
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <nav className="w-full h-[72px] bg-white/80 backdrop-blur-md flex justify-center z-50 sticky top-0 border-b border-kook-border">
      <div className="w-full max-w-[1200px] px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 bg-gradient-to-br from-kook-brand to-kook-brandHover flex items-center justify-center rounded-kook-md text-white font-black text-xl shadow-sm transform group-hover:scale-105 transition-transform duration-300">
            有
          </div>
          <h1 className="text-xl font-bold text-kook-textMain tracking-wide">有搭</h1>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-kook-textMain hover:text-kook-brand transition-colors">首页</Link>
          {user && <Link href="/profile" className="text-sm font-medium text-kook-textMuted hover:text-kook-textMain transition-colors">我的主页</Link>}
          <a href="#" className="text-sm font-medium text-kook-textMuted hover:text-kook-textMain transition-colors">下载应用</a>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm font-bold text-[#181A1F] mr-2">
              {user.username}
            </span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" passHref>
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/register" passHref>
              <Button variant="primary" size="sm" className="px-5">免费注册</Button>
            </Link>
          </>
        )}
      </div>
      </div>
    </nav>
  );
}
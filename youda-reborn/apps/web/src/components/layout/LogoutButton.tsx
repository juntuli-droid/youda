"use client";

import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      退出登录
    </Button>
  );
}

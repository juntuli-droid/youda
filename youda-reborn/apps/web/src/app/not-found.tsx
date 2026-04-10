import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] p-6">
      <div className="max-w-md rounded-3xl border border-[#E3E5E8] bg-white p-10 text-center shadow-sm">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-kook-brand">
          404
        </p>
        <h1 className="mb-3 text-3xl font-black text-[#181A1F]">页面不存在</h1>
        <p className="mb-6 text-sm font-medium leading-6 text-[#5C6068]">
          你访问的页面可能已经移动，或者链接本身就不正确。
        </p>
        <Link href="/">
          <Button>返回首页</Button>
        </Link>
      </div>
    </main>
  )
}

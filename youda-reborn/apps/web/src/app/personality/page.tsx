import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PersonalityPage() {
  return (
    <main className="game-shell min-h-screen flex flex-col relative overflow-hidden">
      {/* Background elements KOOK style (Light) */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-white">
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-[#5C6BFF] rounded-full blur-[150px]"></div>
      </div>

      <nav className="w-full h-[72px] flex items-center px-8 z-50 relative border-b border-kook-border bg-white/80 backdrop-blur">
        <Link href="/">
          <div className="w-10 h-10 bg-white rounded-kook-md flex items-center justify-center text-kook-textMuted hover:text-kook-textMain hover:bg-[#F2F3F5] transition-colors cursor-pointer border border-kook-border shadow-sm">
            <span className="font-bold">←</span>
          </div>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-[800px] kook-panel p-10 md:p-12 relative overflow-hidden">
          {/* subtle card gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-kook-brand/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-sm font-bold text-kook-brand mb-2">开始测试</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-kook-textMain tracking-tight">
              构建你的 MBTI 游戏人格
            </h1>
            <p className="text-kook-textMuted text-base mb-8">
              用 16 道行为题快速识别你的 MBTI 倾向，并同步生成更贴近游戏场景的人格画像。
            </p>
            
            <div className="bg-[#F7F8FA] border border-kook-border rounded-kook-lg p-6 mb-6">
              <h4 className="text-kook-textMain font-medium text-sm mb-4">输出说明</h4>
              <p className="text-kook-textMain font-bold text-base mb-3">MBTI 16 型 + 游戏人格编码</p>
              <div className="space-y-2 text-kook-textMuted text-sm">
                <p>MBTI：根据行为题映射 E/I、S/N、T/F、J/P 四个维度，生成适合开黑场景的 16 型结果。</p>
                <p>游戏人格：继续保留你在节奏、偏好和活跃频率上的画像，方便做更细的游戏匹配。</p>
                <p>匹配阶段会优先参考 MBTI 兼容度，再综合地区、兴趣和时间偏好。</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#F7F8FA] border border-kook-border rounded-kook-lg p-5">
                <div className="text-kook-textMuted text-xs mb-1">测试题数</div>
                <div className="text-kook-textMain font-bold text-xl">16 题</div>
              </div>
              <div className="bg-[#F7F8FA] border border-kook-border rounded-kook-lg p-5">
                <div className="text-kook-textMuted text-xs mb-1">输出结果</div>
                <div className="text-kook-textMain font-bold text-xl">MBTI + 人格画像</div>
              </div>
            </div>

            <Link href="/personality/questions" passHref>
              <Button variant="kook-brand" size="lg" className="w-full text-lg font-bold py-4">
                开始测试
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

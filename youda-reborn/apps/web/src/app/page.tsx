import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <main className="game-shell overflow-x-hidden">
      {/* Top Navigation - KOOK Style Light Mode */}
      <Navbar />

      {/* Hero Section - KOOK Brand Background */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-16 px-4 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 z-0 bg-[#F7F9FC]">
          {/* Top right blob */}
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-kook-brand/10 rounded-full blur-[100px]"></div>
          {/* Bottom left blob */}
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#5C6BFF]/5 rounded-full blur-[100px]"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#181A1F 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>

        <div className="z-10 text-center max-w-[800px] mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-kook-border shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-kook-brand animate-pulse"></span>
            <span className="text-sm font-medium text-kook-textMain">v2.0 全新版本已上线</span>
          </div>
          
          <h2 className="text-[56px] md:text-[72px] font-black tracking-tight mb-6 text-kook-textMain leading-[1.1]">
            找到你的<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-kook-brand to-kook-brandHover">游戏搭子</span>
          </h2>
          <p className="text-[18px] text-[#5C6068] mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            不只是队友，而是与你节奏一致、能一起长期开黑的人。
            通过专业的游戏人格测评，匹配最适合你的电竞灵魂伴侣。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/personality" passHref>
              <Button variant="kook-brand" size="lg" className="w-full sm:w-auto px-12 rounded-full font-bold shadow-[0_8px_20px_rgba(46,211,158,0.3)] hover:-translate-y-1">
                开始免费测评
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Module Grid - Alternating Colored Backgrounds */}
      <section className="w-full bg-white py-20 md:py-32 relative border-t border-[#E3E5E8]">
        <div className="max-w-[1200px] mx-auto px-6 space-y-24 md:space-y-40">
          
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-kook-brand/10 text-kook-brand rounded-full text-sm font-bold">
                <span className="text-lg">🧬</span> MBTI for Gaming
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-kook-textMain tracking-tight leading-tight">深度解构你的<br/>游戏基因</h3>
              <p className="text-[#5C6068] text-lg leading-relaxed">
                通过16道专业的战术测试题，精准定位你的游戏风格与核心优势。知己知彼，百战不殆。快速生成你的专属基因图谱。
              </p>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-gradient-to-br from-[#E8FAF4] to-[#F2F3F5] rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
              <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-kook-border p-6 transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1">
                 {/* Mock UI inside card */}
                 <div className="w-1/2 h-4 bg-[#F2F3F5] rounded-full mb-4"></div>
                 <div className="w-3/4 h-4 bg-[#F2F3F5] rounded-full mb-8"></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="h-24 bg-kook-brand/10 rounded-xl border border-kook-brand/20"></div>
                   <div className="h-24 bg-[#F2F3F5] rounded-xl"></div>
                 </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5C6BFF]/10 text-[#5C6BFF] rounded-full text-sm font-bold">
                <span className="text-lg">🎯</span> Smart Match
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-kook-textMain tracking-tight leading-tight">告别随机匹配<br/>的坐牢体验</h3>
              <p className="text-[#5C6068] text-lg leading-relaxed">
                基于游戏人格、排位段位和对局习惯进行算法配对，为你找到真正契合的灵魂队友。拒绝随机匹配带来的压力。
              </p>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-gradient-to-br from-[#EEF0FF] to-[#F2F3F5] rounded-[32px] p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
              <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-kook-border p-6 transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1 flex flex-col gap-4">
                 {/* Mock UI inside card */}
                 <div className="flex items-center justify-between p-4 border border-kook-border rounded-xl">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#F2F3F5] rounded-full"></div>
                     <div className="w-24 h-3 bg-[#F2F3F5] rounded-full"></div>
                   </div>
                   <div className="text-kook-brand font-bold">98% 契合</div>
                 </div>
                 <div className="flex items-center justify-between p-4 border border-kook-brand/30 bg-kook-brand/5 rounded-xl shadow-[0_4px_12px_rgba(46,211,158,0.1)] relative">
                   <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-kook-brand rounded-full"></div>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-kook-brand/20 rounded-full flex items-center justify-center text-xl">👑</div>
                     <div className="space-y-2">
                       <div className="w-32 h-3 bg-kook-textMain/20 rounded-full"></div>
                       <div className="w-16 h-2 bg-kook-textMuted/30 rounded-full"></div>
                     </div>
                   </div>
                   <div className="px-3 py-1 bg-kook-brand text-white text-xs font-bold rounded-full">100% 灵魂伴侣</div>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dark Footer for Contrast */}
      <Footer />
    </main>
  );
}

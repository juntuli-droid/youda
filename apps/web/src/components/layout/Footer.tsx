import React from "react";

export function Footer() {
  return (
    <footer className="w-full bg-[#181A1F] pt-20 pb-10 px-8 text-white">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-kook-brand flex items-center justify-center rounded-kook-md text-[#181A1F] font-black text-xl">
              有
            </div>
            <h2 className="text-2xl font-bold tracking-wide">有搭</h2>
          </div>
          <p className="text-[#8D93A5] max-w-sm leading-relaxed">
            致力于为硬核玩家提供最专业的游戏人格分析与组队匹配服务。在这里，找到你的灵魂搭子。
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white">产品服务</h4>
          <ul className="space-y-4 text-[#8D93A5]">
            <li><a href="#" className="hover:text-kook-brand transition-colors">MBTI 测评</a></li>
            <li><a href="#" className="hover:text-kook-brand transition-colors">大厅匹配</a></li>
            <li><a href="#" className="hover:text-kook-brand transition-colors">下载客户端</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-white">关于我们</h4>
          <ul className="space-y-4 text-[#8D93A5]">
            <li><a href="#" className="hover:text-kook-brand transition-colors">品牌指南</a></li>
            <li><a href="#" className="hover:text-kook-brand transition-colors">服务条款</a></li>
            <li><a href="#" className="hover:text-kook-brand transition-colors">隐私政策</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto border-t border-[#33353A] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#8D93A5]">
        <p>© 2024 Youda Reborn. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">WeChat</a>
          <a href="#" className="hover:text-white transition-colors">Bilibili</a>
          <a href="#" className="hover:text-white transition-colors">Weibo</a>
        </div>
      </div>
    </footer>
  );
}
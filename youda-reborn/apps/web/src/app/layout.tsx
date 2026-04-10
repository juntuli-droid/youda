import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClientErrorMonitor } from "@/components/monitoring/ClientErrorMonitor";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "有搭 | 找到节奏一致的游戏搭子",
  description: "有搭通过游戏人格测评、主页沉淀与匹配流程，帮你找到真正玩得到一起的游戏搭子。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientErrorMonitor />
        {children}
      </body>
    </html>
  );
}

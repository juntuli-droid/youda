import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        kook: {
          brand: "#2ED39E", // KOOK 核心绿
          brandHover: "#28B88A",
          bg: "#F2F3F5", // 主背景色 (亮色)
          panel: "#FFFFFF", // 卡片面板色 (亮色)
          panelHover: "#F7F8FA",
          input: "#F2F3F5", // 输入框底色 (亮色)
          border: "#E3E5E8", // 边框色 (亮色)
          textMain: "#181A1F", // 主要文字 (亮色下的深色文字)
          textMuted: "#5C6068", // 次要/说明文字 (加深以保证在白底上的对比度可见性)
          accent: "#5C6BFF", // 辅助高亮蓝
          danger: "#FF4D4F", // 错误/警告色
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'kook-sm': '4px',
        'kook-md': '8px',
        'kook-lg': '12px',
        'kook-xl': '16px',
        'kook-2xl': '24px',
      },
      boxShadow: {
        'kook-panel': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'kook-float': '0 12px 32px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;

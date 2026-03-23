import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'kook-brand';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'kook-brand', size = 'md', children, ...props }, ref) => {
    
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-out outline-none select-none";
    
    let sizeStyles = "";
    if (size === 'sm') sizeStyles = "px-4 py-1.5 text-sm rounded-kook-md";
    else if (size === 'md') sizeStyles = "px-6 py-2.5 text-base rounded-kook-lg";
    else if (size === 'lg') sizeStyles = "px-8 py-3.5 text-lg rounded-kook-xl";

    let variantStyles = "";
    if (variant === 'kook-brand') {
      // KOOK 核心绿按钮：背景 #2ED39E, 文字 #181A1F 以满足高对比度
      variantStyles = "bg-kook-brand text-kook-textMain font-bold hover:bg-kook-brandHover active:scale-[0.98] shadow-sm";
    } else if (variant === 'primary') {
      variantStyles = "bg-kook-textMain text-white hover:bg-black active:scale-[0.98]";
    } else if (variant === 'secondary') {
      variantStyles = "bg-[#E3E5E8] text-kook-textMain hover:bg-[#D4D7DC] border border-transparent active:scale-[0.98]";
    } else if (variant === 'outline') {
      variantStyles = "bg-transparent text-kook-textMain border border-[#E3E5E8] hover:bg-[#F2F3F5]";
    } else if (variant === 'ghost') {
      variantStyles = "bg-transparent text-kook-textMuted hover:text-kook-textMain hover:bg-[#E3E5E8]";
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

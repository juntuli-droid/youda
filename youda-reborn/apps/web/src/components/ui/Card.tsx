import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`kook-panel p-6 ${className}`}>
      {children}
    </div>
  );
};

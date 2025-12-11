import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'yellow' | 'blue' | 'emerald' | 'white' | 'neutral';
  className?: string;
}

/**
 * 🏷️ 复古波普徽章组件
 * Retro Pop Badge with hard shadows
 */
export function Badge({ children, variant = 'orange', className = '' }: BadgeProps) {
  const variants = {
    orange: 'badge-retro badge-orange',
    yellow: 'badge-retro badge-yellow',
    blue: 'badge-retro badge-blue',
    emerald: 'badge-retro badge-emerald',
    white: 'badge-retro badge-white',
    neutral: 'badge-retro bg-gray-200 text-black',
  };

  return <span className={`${variants[variant]} ${className}`}>{children}</span>;
}

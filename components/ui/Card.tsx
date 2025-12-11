import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'large' | 'hover';
  className?: string;
}

/**
 * 🎴 复古波普卡片组件
 * Retro Pop Card with hard shadows and thick borders
 */
export function Card({ children, variant = 'default', className = '' }: CardProps) {
  const variants = {
    default: 'retro-card',
    large: 'retro-card-lg',
    hover: 'retro-card cursor-pointer',
  };

  return (
    <div className={`${variants[variant]} p-6 ${className}`}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return <h3 className={`text-2xl font-bold font-[family-name:var(--font-anton)] uppercase ${className}`}>{children}</h3>;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

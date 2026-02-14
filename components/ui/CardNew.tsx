import React from 'react';
import { classNames } from '../../utils/classNames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  onClick
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseClasses = "bg-white rounded-xl border border-slate-200 transition-all duration-200";
  const hoverClasses = hover ? "hover:shadow-lg hover:border-slate-300 cursor-pointer" : "shadow-sm";
  const clickableClasses = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={classNames(
        baseClasses,
        hoverClasses,
        clickableClasses,
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

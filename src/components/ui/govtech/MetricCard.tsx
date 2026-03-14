import React, { useState, useEffect, useRef } from 'react';
import { CardGovTech } from '../CardGovTech';

interface MetricCardProps {
 title: string;
 value: string | number;
 unit: string;
 subtitle?: string;
 className?: string;
 variant?: 'blue' | 'yellow' | 'teal' | 'danger';
 showShimmer?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
 title,
 value,
 unit,
 subtitle,
 className = '',
 variant = 'blue',
 showShimmer = false
}) => {
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === 'number' ? 0 : value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const end = value;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(end * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

 const textColorClass = {
 blue: 'text-pupr-blue',
 yellow: 'text-amber-600',
 teal: 'text-teal-600',
 danger: 'text-red-600',
 }[variant];

 const accentColorClass = {
 blue: 'from-pupr-blue/10 to-transparent',
 yellow: 'from-amber-500/10 to-transparent',
 teal: 'from-teal-500/10 to-transparent',
 danger: 'from-red-500/10 to-transparent',
 }[variant];

 return (
 <CardGovTech
 title={title}
 className={`group transition-all duration-75 hover: relative overflow-hidden ${className}`}
 >
 <div className={`absolute inset-0 bg-gradient-to-br ${accentColorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-75`} />

 {showShimmer && (
 <div className="absolute inset-0 pointer-events-none">
 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] animate-shimmer" />
 </div>
 )}

 <div className="relative z-10 mt-4">
 <div className="flex items-baseline gap-2">
 <p className={`text-5xl font-bold ${textColorClass} tabular-nums tracking-tight transition-transform group- duration-75 origin-left`}>
 {displayValue}
 </p>
 <span className="text-sm font-bold text-pupr-text/60 uppercase tracking-wide">
 {unit}
 </span>
 </div>
 {subtitle && (
 <p className="text-xs font-medium text-slate-500 mt-2">{subtitle}</p>
 )}
 </div>
 </CardGovTech>
 );
};

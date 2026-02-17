import React from 'react';
import { Button } from '../forms/Button';

/**
 * Enhanced Empty State Component
 * Modern design with friendly messaging and clear CTAs
 */

interface EmptyStateActionProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateActionProps[];
  action?: {  // Legacy support
    label: string;
    onClick: () => void;
  };
  size?: 'compact' | 'normal' | 'large';
  illustration?: 'database' | 'folder' | 'chart' | 'search' | 'custom';
  className?: string;
}

/**
 * Default Icons for Common Empty States
 */
const DefaultIcons = {
  database: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  folder: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions,
  action,
  size = 'normal',
  illustration = 'database',
  className = '',
}) => {
  // Size variants
  const sizeStyles = {
    compact: {
      container: 'py-12 px-6',
      icon: 'p-2',
      title: 'text-lg',
    },
    normal: {
      container: 'py-16 px-6',
      icon: 'p-4',
      title: 'text-xl',
    },
    large: {
      container: 'py-24 px-8',
      icon: 'p-6',
      title: 'text-2xl',
    },
  };

  const sizeClass = sizeStyles[size];

  // Determine which icon to use
  let renderedIcon = icon;
  if (!renderedIcon && illustration !== 'custom') {
    renderedIcon = DefaultIcons[illustration as keyof typeof DefaultIcons] || DefaultIcons.database;
  }

  // Combine legacy action with new actions
  const allActions = actions || (action ? [{ ...action, variant: 'primary' as const }] : []);

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${sizeClass.container}
        ${className}
      `}
    >
      {/* Icon */}
      {renderedIcon && (
        <div className={`
          mb-6 text-slate-300
          bg-slate-50 rounded-2xl
          ${sizeClass.icon}
          flex items-center justify-center
        `}>
          {renderedIcon}
        </div>
      )}

      {/* Title */}
      <h3 className={`${sizeClass.title} font-bold text-slate-900 mb-2`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-slate-600 max-w-sm mb-8">
          {description}
        </p>
      )}

      {/* Actions */}
      {allActions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {allActions.map((btn, idx) => (
            <Button
              key={idx}
              onClick={btn.onClick}
              variant={(btn.variant as 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success') || (idx === 0 ? 'primary' : 'outline')}
              size="md"
            >
              {btn.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};


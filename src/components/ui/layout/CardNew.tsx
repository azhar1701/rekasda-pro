import React from 'react';

/**
 * Modern Card System - Enhanced for B2B SaaS
 * Minimalist design with improved visual hierarchy and accessibility
 */

interface CardProps {
 children: React.ReactNode;
 className?: string;
 variant?: 'default' | 'elevated' | 'bordered' | 'subtle';
 padding?: 'sm' | 'md' | 'lg' | 'none';
 fullHeight?: boolean;
}

interface CardHeaderProps {
 children: React.ReactNode;
 className?: string;
 divider?: boolean;
}

interface CardTitleProps {
 children: React.ReactNode;
 className?: string;
 icon?: React.ReactNode;
 subtitle?: string;
}

interface CardContentProps {
 children: React.ReactNode;
 className?: string;
}

interface CardFooterProps {
 children: React.ReactNode;
 className?: string;
 divider?: boolean;
}

interface CardGridProps {
 children: React.ReactNode;
 columns?: 1 | 2 | 3 | 4;
 gap?: 'sm' | 'md' | 'lg';
 className?: string;
}

interface CardDataProps {
 label: string;
 value: string | number;
 unit?: string;
 icon?: React.ReactNode;
 highlight?: boolean;
 comparison?: string;
}

interface SectionCardProps {
 title: string;
 subtitle?: string;
 icon?: React.ReactNode;
 action?: React.ReactNode;
 children: React.ReactNode;
 className?: string;
}

/**
 * Root Card Component
 */
export const Card: React.FC<CardProps> = ({
 children,
 className = '',
 variant = 'default',
 padding = 'md',
 fullHeight = false,
}) => {
 const variantStyles = {
 default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700',
 elevated: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ',
 bordered: 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700',
 subtle: 'bg-slate-50 dark:bg-slate-800 border border-slate-100',
 };

 const paddingStyles = {
 sm: 'p-3',
 md: 'p-5',
 lg: 'p-6',
 none: 'p-0',
 };

 return (
 <div
 className={`
 rounded-sm transition-colors
 ${variantStyles[variant]}
 ${paddingStyles[padding]}
 ${fullHeight ? 'flex flex-col h-full' : ''}
 ${className}
 `}
 >
 {children}
 </div>
 );
};

/**
 * Card Header Component
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
 children,
 className = '',
 divider = false,
}) => {
 return (
 <div
 className={`
 ${divider ? 'pb-4 border-b border-slate-100' : 'pb-4'}
 ${className}
 `}
 >
 {children}
 </div>
 );
};

/**
 * Card Title Component with Icon Support
 */
export const CardTitle: React.FC<CardTitleProps> = ({
 children,
 className = '',
 icon,
 subtitle,
}) => {
 return (
 <div>
 <div className="flex items-start gap-2 mb-1">
 {icon && (
 <div className="flex-shrink-0 text-primary-600">
 {icon}
 </div>
 )}
 <h3 className={`text-base font-semibold text-slate-900 dark:text-slate-100 ${className}`}>
 {children}
 </h3>
 </div>
 {subtitle && (
 <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
 )}
 </div>
 );
};

/**
 * Card Content Component
 */
export const CardContent: React.FC<CardContentProps> = ({
 children,
 className = '',
}) => {
 return (
 <div className={`space-y-4 ${className}`}>
 {children}
 </div>
 );
};

/**
 * Card Footer Component
 */
export const CardFooter: React.FC<CardFooterProps> = ({
 children,
 className = '',
 divider = true,
}) => {
 return (
 <div
 className={`
 flex items-center justify-between gap-3
 ${divider ? 'pt-4 border-t border-slate-100' : 'pt-4'}
 ${className}
 `}
 >
 {children}
 </div>
 );
};

/**
 * Card Data Display Component (For metrics/KPIs)
 */
export const CardData: React.FC<CardDataProps> = ({
 label,
 value,
 unit,
 icon,
 highlight = false,
 comparison,
}) => {
 return (
 <div className={`p-4 rounded-sm ${highlight ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
 <div className="flex items-start justify-between gap-2 mb-2">
 <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
 {label}
 </span>
 {icon && <span className="text-primary-600">{icon}</span>}
 </div>
 <div className="flex items-baseline gap-2">
 <span className={`text-2xl font-bold ${highlight ? 'text-primary-900' : 'text-slate-900 dark:text-slate-100'}`}>
 {value}
 </span>
 {unit && <span className="text-sm text-slate-500">{unit}</span>}
 </div>
 {comparison && (
 <p className="text-xs text-slate-500 mt-2">{comparison}</p>
 )}
 </div>
 );
};

/**
 * Card Grid Layout Component - Responsive Grid for Cards
 */
export const CardGrid: React.FC<CardGridProps> = ({
 children,
 columns = 3,
 gap = 'md',
 className = '',
}) => {
 const colsStyles = {
 1: 'grid-cols-1',
 2: 'grid-cols-1 md:grid-cols-2',
 3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
 4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
 };

 const gapStyles = {
 sm: 'gap-3',
 md: 'gap-4',
 lg: 'gap-6',
 };

 return (
 <div className={`grid ${colsStyles[columns]} ${gapStyles[gap]} ${className}`}>
 {children}
 </div>
 );
};

/**
 * Section Card with Action Area
 */
export const SectionCard: React.FC<SectionCardProps> = ({
 title,
 subtitle,
 icon,
 action,
 children,
 className = '',
}) => {
 return (
 <Card className={className}>
 <CardHeader divider={true}>
 <div className="flex items-start justify-between">
 <div>
 <CardTitle icon={icon} subtitle={subtitle}>
 {title}
 </CardTitle>
 </div>
 {action && <div className="flex-shrink-0">{action}</div>}
 </div>
 </CardHeader>
 <CardContent>
 {children}
 </CardContent>
 </Card>
 );
};

/**
 * Backward-Compatible Card Wrapper
 * Maintains API compatibility with legacy code while using new Card system
 */
interface LegacyCardProps {
 children: React.ReactNode;
 className?: string;
 title?: string;
 description?: string;
 icon?: React.ReactNode;
 fullHeight?: boolean;
}

export const CardLegacy: React.FC<LegacyCardProps> = ({
 children,
 className = '',
 title,
 description,
 icon,
 fullHeight = false,
}) => {
 if (title || description || icon) {
 return (
 <Card className={className} fullHeight={fullHeight}>
 <CardHeader divider>
 <div className="flex items-start gap-3">
 {icon && <div className="text-teal-600 flex-shrink-0">{icon}</div>}
 <div className="flex-1">
 {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
 {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
 </div>
 </div>
 </CardHeader>
 <CardContent>
 {children}
 </CardContent>
 </Card>
 );
 }

 return (
 <Card className={className} fullHeight={fullHeight}>
 <CardContent>
 {children}
 </CardContent>
 </Card>
 );
};
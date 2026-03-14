/**
 * Badge Component
 * Small component for displaying status, tags, or labels
 */

import React, { ReactNode } from 'react';
import { classNames } from '@/lib/utils/classNames';

interface BadgeProps {
 children: ReactNode;
 variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
 size?: 'sm' | 'md';
 icon?: ReactNode;
 className?: string;
}

const variantClasses = {
 default: 'bg-slate-100 text-slate-800 dark:text-slate-200',
 success: 'bg-success-100 text-success-800',
 warning: 'bg-warning-100 text-warning-800',
 danger: 'bg-danger-100 text-danger-800',
 info: 'bg-info-100 text-info-800',
 primary: 'bg-primary-100 text-primary-800',
};

const sizeClasses = {
 sm: 'px-2 py-1 text-xs',
 md: 'px-3 py-1.5 text-sm',
};

/**
 * Status badge for displaying flow types, safety states, etc
 * @example
 * <Badge variant="success">Sub-kritis</Badge>
 * <Badge variant="warning" icon={<AlertIcon />}>Waspada</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
 children,
 variant = 'default',
 size = 'md',
 icon,
 className,
}) => {
 return (
 <span
 className={classNames(
 'inline-flex items-center gap-1.5 rounded-sm font-medium',
 variantClasses[variant],
 sizeClasses[size],
 className
 )}
 >
 {icon}
 {children}
 </span>
 );
};

export default Badge;

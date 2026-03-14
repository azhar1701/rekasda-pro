import React, { useState } from 'react';

/**
 * Modern Sidebar Navigation - B2B SaaS Style
 * Fixed sidebar with collapsible menu and active state indicators
 */

export interface NavItem {
 id: string;
 label: string;
 icon: React.ReactNode;
 badge?: React.ReactNode;
 isActive?: boolean;
 onClick?: () => void;
}

interface SidebarProps {
 title: string;
 subtitle?: string;
 navItems: NavItem[];
 logo?: React.ReactNode;
 footer?: React.ReactNode;
 collapsed?: boolean;
 onCollapsedChange?: (collapsed: boolean) => void;
 className?: string;
}

/**
 * Main Sidebar Component
 */
export const Sidebar: React.FC<SidebarProps> = ({
 title,
 subtitle,
 navItems,
 logo,
 footer,
 collapsed = false,
 onCollapsedChange,
 className = '',
}) => {
 const [isCollapsed, setIsCollapsed] = useState(collapsed);

 const handleToggle = () => {
 const newState = !isCollapsed;
 setIsCollapsed(newState);
 onCollapsedChange?.(newState);
 };

 return (
 <aside
 className={`
 fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 
 flex flex-col transition-all duration-75 ease-out
 ${isCollapsed ? 'w-20' : 'w-64'} z-40
 ${className}
 `}
 >
 {/* Header */}
 <div className="h-20 border-b border-slate-100 flex items-center px-6 gap-3">
 {logo && (
 <div className={`flex-shrink-0 ${isCollapsed ? 'ml-0' : ''}`}>
 {logo}
 </div>
 )}
 {!isCollapsed && (
 <div className="flex-1 min-w-0">
 <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h2>
 {subtitle && (
 <p className="text-xs text-slate-500 truncate">{subtitle}</p>
 )}
 </div>
 )}
 </div>

 {/* Navigation Items */}
 <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
 {navItems.map((item) => (
 <SidebarNavItem
 key={item.id}
 item={item}
 collapsed={isCollapsed}
 />
 ))}
 </nav>

 {/* Footer Section */}
 {footer && (
 <div className="border-t border-slate-100 p-4">
 {footer}
 </div>
 )}

 {/* Collapse Button */}
 <button
 onClick={handleToggle}
 className="
 absolute -right-3 top-1/2 -translate-y-1/2
 w-6 h-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-sm
 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-100
 hover:border-slate-400 transition-all duration-200
 
 "
 title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
 >
 <svg
 className={`w-4 h-4 transition-transform duration-75 ${
 isCollapsed ? 'rotate-180' : ''
 }`}
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M15 19l-7-7 7-7"
 />
 </svg>
 </button>
 </aside>
 );
};

/**
 * Individual Navigation Item Component
 */
interface SidebarNavItemProps {
 item: NavItem;
 collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, collapsed }) => {
 const baseStyles = `
 relative w-full flex items-center justify-start gap-3 px-4 py-3
 rounded-none transition-all duration-200 border-l-4 border-transparent
 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-pupr-blue
 `;

 const activeStyles = item.isActive
 ? 'bg-pupr-blue/5 text-pupr-blue border-l-4 border-pupr-blue font-bold'
 : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:bg-slate-800';

 return (
 <button
 onClick={item.onClick}
 className={`${baseStyles} ${activeStyles}`}
 title={collapsed ? item.label : undefined}
 >
 {/* Icon */}
 <span className={`flex-shrink-0 w-5 h-5 ${item.isActive ? 'text-pupr-blue' : 'text-slate-500'}`}>
 {item.icon}
 </span>

 {/* Label */}
 {!collapsed && (
 <span className="flex-1 text-left text-sm font-medium truncate">
 {item.label}
 </span>
 )}

 {/* Badge */}
 {!collapsed && item.badge && (
 <div className="flex-shrink-0 ml-auto">
 {item.badge}
 </div>
 )}

 {/* Active Indicator Line removed as it is now handled by border-l-4 */}
 </button>
 );
};

/**
 * Navigation Item Badge Component
 */
interface BadgeProps {
 count?: number;
 variant?: 'primary' | 'warning' | 'danger' | 'success';
}

export const NavBadge: React.FC<BadgeProps> = ({ count, variant = 'primary' }) => {
 if (!count) return null;

 const variantStyles = {
 primary: 'bg-primary-100 text-primary-800',
 warning: 'bg-warning-100 text-warning-800',
 danger: 'bg-danger-100 text-danger-800',
 success: 'bg-success-100 text-success-800',
 };

 return (
 <span className={`
 inline-flex items-center justify-center
 min-w-6 h-6 px-2 rounded-sm
 text-xs font-bold tabular-nums tracking-tight
 ${variantStyles[variant]}
 `}>
 {count > 99 ? '99+' : count}
 </span>
 );
};

/**
 * Section Divider for Sidebar
 */
interface SidebarSectionProps {
 title?: string;
 children: React.ReactNode;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
 return (
 <div>
 {title && (
 <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-4 py-2 mb-2">
 {title}
 </h3>
 )}
 {children}
 </div>
 );
};

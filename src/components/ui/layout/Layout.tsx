import React, { ReactNode } from 'react';

/**
 * Main Layout Container - Combines Header, Sidebar, and Content Area
 * Provides clean structure with proper spacing and responsive design
 */

interface LayoutProps {
 children: ReactNode;
 className?: string;
}

/**
 * Main Layout Component
 * Wraps the entire app with sidebar spacing
 */
export const AppLayout: React.FC<LayoutProps> = ({
 children,
 className = '',
}) => {
 return (
 <div className={`flex h-screen bg-slate-50 dark:bg-slate-800 ${className}`}>
 {/* Sidebar spacing is added via margin */}
 <main className={`flex-1 ml-64 overflow-auto flex flex-col`}>
 {/* Content Area */}
 <div className="flex-1">
 {children}
 </div>
 </main>
 </div>
 );
};

/**
 * Page Header Component
 */
interface PageHeaderProps {
 title: string;
 subtitle?: string;
 description?: string;
 icon?: ReactNode;
 sniCode?: string;
 action?: ReactNode;
 breadcrumbs?: Array<{ label: string; href?: string }>;
 className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
 title,
 subtitle,
 description,
 icon,
 sniCode,
 action,
 breadcrumbs,
 className = '',
}) => {
 return (
 <div className={`border-b border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 sticky top-0 z-20 ${className}`}>
 <div className="px-8 py-6">
 {/* Breadcrumbs */}
 {breadcrumbs && breadcrumbs.length > 0 && (
 <nav className="flex items-center gap-2 text-sm mb-4">
 {breadcrumbs.map((crumb, idx) => (
 <React.Fragment key={idx}>
 {idx > 0 && <span className="text-slate-300">/</span>}
 {crumb.href ? (
 <a href={crumb.href} className="text-primary-600 hover:text-primary-700">
 {crumb.label}
 </a>
 ) : (
 <span className="text-slate-600 dark:text-slate-400">{crumb.label}</span>
 )}
 </React.Fragment>
 ))}
 </nav>
 )}

 {/* Main Header Content */}
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-start gap-4">
 {icon && (
 <div className="flex-shrink-0 p-3 bg-primary-50 rounded-sm text-primary-600">
 {icon}
 </div>
 )}
 <div className="flex-1">
 <div className="flex items-center gap-3">
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h1>
 {sniCode && (
 <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded tracking-widest uppercase border border-slate-200 dark:border-slate-700 ">
 {sniCode}
 </span>
 )}
 </div>
 {(subtitle || description) && (
 <p className="text-slate-600 dark:text-slate-400">{subtitle || description}</p>
 )}
 </div>
 </div>

 {/* Action Section */}
 {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
 </div>
 </div>
 </div>
 );
};

/**
 * Page Content Container
 */
interface PageContentProps {
 children: ReactNode;
 maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
 className?: string;
}

export const PageContent: React.FC<PageContentProps> = ({
 children,
 maxWidth = 'full',
 className = '',
}) => {
 const maxWidthClasses = {
 sm: 'max-w-2xl',
 md: 'max-w-4xl',
 lg: 'max-w-6xl',
 xl: 'max-w-7xl',
 '2xl': 'max-w-8xl',
 full: 'w-full',
 };

 return (
 <div className={`px-8 py-8 ${className}`}>
 <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
 {children}
 </div>
 </div>
 );
};

/**
 * Section Container
 */
interface SectionProps {
 title?: string;
 subtitle?: string;
 children: ReactNode;
 spacing?: 'compact' | 'normal' | 'spacious';
 className?: string;
}

export const Section: React.FC<SectionProps> = ({
 title,
 subtitle,
 children,
 spacing = 'normal',
 className = '',
}) => {
 const spacingClasses = {
 compact: 'mb-6',
 normal: 'mb-8',
 spacious: 'mb-12',
 };

 return (
 <section className={`${spacingClasses[spacing]} ${className}`}>
 {(title || subtitle) && (
 <div className="mb-6">
 {title && <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h2>}
 {subtitle && <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>}
 </div>
 )}
 {children}
 </section>
 );
};



/**
 * Responsive Grid Layout for Content
 */
interface ContentGridProps {
 children: ReactNode;
 columns?: 1 | 2 | 3 | 4;
 gap?: 'sm' | 'md' | 'lg';
 className?: string;
}

export const ContentGrid: React.FC<ContentGridProps> = ({
 children,
 columns = 3,
 gap = 'md',
 className = '',
}) => {
 const colsClasses = {
 1: 'grid-cols-1',
 2: 'grid-cols-1 md:grid-cols-2',
 3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
 4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
 };

 const gapClasses = {
 sm: 'gap-4',
 md: 'gap-6',
 lg: 'gap-8',
 };

 return (
 <div className={`grid ${colsClasses[columns]} ${gapClasses[gap]} ${className}`}>
 {children}
 </div>
 );
};

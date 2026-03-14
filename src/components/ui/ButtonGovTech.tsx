import React from 'react';

interface ButtonGovTechProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: 'pupr-primary' | 'pupr-accent' | 'secondary' | 'ghost' | 'danger';
 size?: 'sm' | 'default' | 'lg';
 fullWidth?: boolean;
 isLoading?: boolean;
}

export const ButtonGovTech: React.FC<ButtonGovTechProps> = ({
 children,
 variant = 'pupr-primary',
 size = 'default',
 fullWidth = false,
 isLoading = false,
 className = '',
 disabled = false,
 ...props
}) => {
 const baseStyle = "inline-flex items-center justify-center gap-2 font-semibold rounded-sm transition-all duration-200 hover:translate-y-[-1px] hover: disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled: [&_svg]:size-4 [&_svg]:shrink-0";

 const sizes = {
 sm: "h-8 px-3 text-xs",
 default: "h-10 px-4 text-sm",
 lg: "h-11 px-6 text-base",
 };

 const variants = {
 'pupr-primary': "bg-pupr-blue text-white hover:bg-pupr-blue active:bg-pupr-blue border border-pupr-blue",
 'pupr-accent': "bg-pupr-yellow text-slate-900 dark:text-slate-100 hover:bg-pupr-yellow/90 active:bg-pupr-yellow/80 border border-pupr-yellow font-bold",
 'secondary': "border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 active:bg-slate-100",
 'ghost': "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800 active:bg-slate-100",
 'danger': "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600"
 };

 const widthClass = fullWidth ? "w-full" : "";

 return (
 <button
 className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${widthClass} ${className}`}
 disabled={disabled || isLoading}
 {...props}
 >
 {isLoading && (
 <svg className="animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
 </svg>
 )}
 {children}
 </button>
 );
};

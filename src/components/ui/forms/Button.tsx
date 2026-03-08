import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default' | 'success';
  size?: 'sm' | 'default' | 'lg' | 'md';
  fullWidth?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled = false,
  icon,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0";
  
  const sizes = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2.5 text-sm",
    md: "h-10 px-4 py-2.5 text-sm",
    lg: "h-12 px-6 text-base",
  };
  
  const variants = {
    primary: "bg-pupr-blue text-white shadow-sm hover:bg-pupr-blue/90 hover:shadow-md active:scale-[0.98] border border-[#0a2f52]",
    secondary: "border-2 border-slate-300 bg-white text-slate-700 hover:border-pupr-blue hover:bg-slate-50 active:bg-slate-100 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200",
    danger: "bg-error text-white shadow-sm hover:bg-error-dark hover:shadow-md active:scale-[0.98] border border-red-700",
    outline: "border-2 border-slate-300 bg-white text-slate-700 hover:border-pupr-blue hover:bg-slate-50 active:bg-slate-100 shadow-sm",
    default: "bg-pupr-blue text-white shadow-sm hover:bg-pupr-blue/90 hover:shadow-md active:scale-[0.98] border border-[#0a2f52]",
    success: "bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md active:scale-[0.98] border border-green-700"
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
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
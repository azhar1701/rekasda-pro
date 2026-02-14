import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon, 
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md active:scale-[0.98]",
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-sm hover:shadow-md active:scale-[0.98]",
    danger: "bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 shadow-sm hover:shadow-md active:scale-[0.98]",
    success: "bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 shadow-sm hover:shadow-md active:scale-[0.98]",
    outline: "bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-300",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'default',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled = false,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0";
  
  const sizes = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2.5 text-sm",
    lg: "h-12 px-6 text-base",
  };
  
  const variants = {
    primary: "bg-primary-600 text-white shadow-card hover:bg-primary-700 active:scale-[0.98]",
    secondary: "border-2 border-neutral-200 bg-white text-neutral-700 hover:border-primary-600 hover:bg-primary-50 active:bg-primary-100",
    ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200",
    danger: "bg-error text-white shadow-card hover:bg-error-dark active:scale-[0.98]"
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
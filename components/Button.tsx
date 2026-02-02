
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyle = "flex items-center justify-center gap-2.5 font-bold py-3.5 px-6 rounded-2xl text-sm md:text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-safety-blue text-white shadow-lg shadow-safety-blue/20 hover:shadow-safety-blue/40 hover:-translate-y-0.5",
    secondary: "bg-safety-orange text-white shadow-lg shadow-safety-orange/20 hover:shadow-safety-orange/40 hover:-translate-y-0.5",
    danger: "bg-alert-red text-white shadow-lg shadow-alert-red/20 hover:shadow-alert-red/40 hover:-translate-y-0.5",
    outline: "bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  );
};

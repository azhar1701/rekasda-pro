import React, { forwardRef } from 'react';
import { classNames } from '@/lib/utils/classNames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 error?: string;
 icon?: React.ReactNode;
 label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
 ({ error, icon, label, className, disabled, id, name, ...props }, ref) => {
 const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
 const inputName = name || inputId;
 const baseClasses = "w-full px-3 py-2 text-sm border rounded-sm transition-colors focus:outline-none focus:ring-2";
 
 const stateClasses = error
 ? 'bg-red-50 border-red-300 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-red-500 focus:ring-red-200'
 : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-slate-900 focus:ring-slate-200';

 const disabledClasses = disabled
 ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
 : '';

 return (
 <div className="w-full">
 {label && (
 <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
 {label}
 </label>
 )}
 <div className="relative">
 {icon && (
 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
 {icon}
 </div>
 )}
 <input
 ref={ref}
 id={inputId}
 name={inputName}
 disabled={disabled}
 className={classNames(
 baseClasses,
 stateClasses,
 disabledClasses,
 icon ? 'pl-10' : '',
 className
 )}
 {...props}
 />
 </div>
 {error && (
 <p className="mt-1.5 text-xs text-red-600">{error}</p>
 )}
 </div>
 );
 }
);

Input.displayName = 'Input';

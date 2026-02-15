import React, { forwardRef } from 'react';
import { classNames } from '../../utils/classNames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: React.ReactNode;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, label, className, disabled, ...props }, ref) => {
    const baseClasses = "w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2";
    
    const stateClasses = error
      ? 'bg-red-50 border-red-300 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:ring-red-200'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-slate-200';

    const disabledClasses = disabled
      ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
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

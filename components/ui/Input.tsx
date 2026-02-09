/**
 * Input Component
 * Reusable text input field with consistent styling and states
 * Supports: text, number, email, password types with error states
 */

import React, { forwardRef } from 'react';
import { classNames } from '../../utils/classNames';

interface InputProps {
  error?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle';
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * Professional text input field
 * @example
 * <Input 
 *   label="Channel Width"
 *   type="number" 
 *   step="0.01"
 *   error={errors.width}
 *   value={inputs.width}
 *   onChange={(e) => handleChange(e)}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error,
      icon,
      size = 'md',
      variant = 'default',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const baseClasses =
      'w-full border rounded-md font-normal transition-all duration-fast';

    const stateClasses = error
      ? 'bg-danger-50 border-danger-300 text-slate-900 placeholder-slate-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-200'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

    const disabledClasses = disabled
      ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200'
      : '';

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={classNames(
            baseClasses,
            sizeClasses[size as keyof typeof sizeClasses],
            stateClasses,
            disabledClasses,
            icon ? 'pl-9' : undefined,
            className
          )}
          {...props}
        />

        {error && (
          <p className="mt-1 text-sm font-medium text-danger-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

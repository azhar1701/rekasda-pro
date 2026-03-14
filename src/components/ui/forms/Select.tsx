/**
 * Select Component
 * Reusable dropdown select field with professional styling
 */

import { forwardRef } from 'react';
import { classNames } from '@/lib/utils/classNames';

interface Option {
 value: string | number;
 label: string;
 disabled?: boolean;
}

interface SelectProps {
 options: Option[];
 error?: string;
 placeholder?: string;
 size?: 'sm' | 'md' | 'lg';
 className?: string;
 disabled?: boolean;
 [key: string]: any;
}

/**
 * Professional dropdown select field
 * @example
 * <Select
 * options={[
 * { value: 'trapezoid', label: 'Trapezoid Channel' },
 * { value: 'circular', label: 'Circular Pipe' },
 * ]}
 * error={errors.shape}
 * onChange={handleChange}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
 (
 {
 options,
 error,
 placeholder,
 size = 'md',
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
 'w-full border rounded-sm font-normal appearance-none transition-all duration-fast cursor-pointer';

 const stateClasses = error
 ? 'bg-danger-50 border-danger-300 text-slate-900 dark:text-slate-100 focus:border-danger-500 focus:ring-2 focus:ring-danger-200'
 : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

 const disabledClasses = disabled
 ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
 : '';

 return (
 <div className="relative">
 <select
 ref={ref}
 disabled={disabled}
 className={classNames(
 baseClasses,
 sizeClasses[size as keyof typeof sizeClasses],
 stateClasses,
 disabledClasses,
 'pr-9',
 className
 )}
 {...props}
 >
 {placeholder && (
 <option value="" disabled>
 {placeholder}
 </option>
 )}
 {options.map((option: Option) => (
 <option
 key={option.value}
 value={option.value}
 disabled={option.disabled}
 >
 {option.label}
 </option>
 ))}
 </select>

 {/* Dropdown Arrow */}
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
 <svg
 className="w-4 h-4"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M19 14l-7 7m0 0l-7-7m7 7V3"
 />
 </svg>
 </div>

 {error && (
 <p className="mt-1 text-sm font-medium text-danger-600">{error}</p>
 )}
 </div>
 );
 }
);

Select.displayName = 'Select';

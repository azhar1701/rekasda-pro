/**
 * FormField Component
 * Wrapper for form inputs with label, error, and helper text
 * Provides consistent styling for all form elements
 */

import React, { ReactNode } from 'react';
import { classNames } from '../../utils/classNames';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  unit?: string;
  children: ReactNode;
  className?: string;
  helperText?: string;
  onChange?: (value: any) => void;
}

/**
 * Professional form field wrapper with label and error handling
 * @example
 * <FormField
 *   label="Channel Width"
 *   unit="m"
 *   required
 *   hint="Bottom width of channel"
 *   error={errors.width}
 * >
 *   <Input type="number" value={5.0} onChange={...} />
 * </FormField>
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  hint,
  unit,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={classNames('space-y-1.5', className)}>
      {/* Label with unit and required indicator */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {unit && (
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({unit})
            </span>
          )}
        </label>
        {required && (
          <span
            className="text-danger-600 font-bold text-sm"
            title="Required field"
          >
            *
          </span>
        )}
      </div>

      {/* Hint text (secondary label) */}
      {hint && !error && (
        <p className="text-xs text-slate-500 font-normal">{hint}</p>
      )}

      {/* Input field */}
      <div>{children}</div>

      {/* Error message with icon */}
      {error && (
        <div className="flex items-start gap-2 mt-2">
          <svg
            className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18.101 12.93a10 10 0 10-19.202 0A10 10 0 0018.101 12.93z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium text-danger-600">{error}</p>
        </div>
      )}

      {/* Helper text (alternative to hint if no error) */}
      {helperText && !error && (
        <p className="text-xs text-slate-500 italic">{helperText}</p>
      )}
    </div>
  );
};

export default FormField;

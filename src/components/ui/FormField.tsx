/**
 * FormField Component
 * Wrapper for form inputs with label, error, and helper text
 * Provides consistent styling for all form elements
 */

import React, { ReactNode } from 'react';
import { classNames } from '@/lib/utils/classNames';

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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {unit && (
            <span className="text-xs text-slate-500 ml-1">({unit})</span>
          )}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      </div>

      {hint && !error && (
        <p className="text-xs text-slate-500">{hint}</p>
      )}

      <div>{children}</div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default FormField;

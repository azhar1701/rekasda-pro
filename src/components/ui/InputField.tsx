import { InputHTMLAttributes, forwardRef } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  unit?: string;
  helperText?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, unit, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-3">
        <label className="text-label text-neutral-900">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            className={`w-full h-11 px-4 text-body bg-white rounded-md transition-all duration-fast
              ${error 
                ? 'border-error focus:border-error focus:ring-1 focus:ring-error' 
                : 'border border-slate-300 focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              font-feature-settings-numeric
              ${unit ? 'pr-16' : ''}
              ${className}`}
            {...props}
          />
          {unit && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-label text-neutral-600">
              {unit}
            </span>
          )}
        </div>
        
        {helperText && !error && (
          <p className="text-caption text-neutral-600">{helperText}</p>
        )}
        {error && (
          <p className="text-caption text-error">{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

export default InputField;

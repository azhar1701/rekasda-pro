import React from 'react';

interface StepperStep {
 id: string;
 label: string;
 description?: string;
 icon?: React.ReactNode;
}

interface StepperProps {
 steps: StepperStep[];
 currentStep: number;
 onStepChange?: (step: number) => void;
 className?: string;
 variant?: 'horizontal' | 'vertical';
}

export const Stepper: React.FC<StepperProps> = ({
 steps,
 currentStep,
 onStepChange,
 className = '',
 variant = 'horizontal',
}) => {
 const isCompleted = (stepIndex: number) => stepIndex < currentStep;
 const isCurrent = (stepIndex: number) => stepIndex === currentStep;

 return (
 <div className={`${className}`}>
 {variant === 'horizontal' ? (
 <div className="flex items-center justify-between">
 {steps.map((step, index) => (
 <div key={step.id} className="flex items-center flex-1">
 {/* Step Circle */}
 <button
 onClick={() => onStepChange?.(index)}
 className={`
 w-10 h-10 rounded-sm flex items-center justify-center font-bold transition-all
 flex-shrink-0 tabular-nums
 ${
 isCurrent(index)
 ? 'bg-pupr-blue text-white border border-pupr-blue'
 : isCompleted(index)
 ? 'bg-pupr-blue text-white border border-pupr-blue'
 : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-300 dark:border-slate-600'
 }
 `}
 >
 {isCompleted(index) ? (
 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
 <path
 fillRule="evenodd"
 d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
 clipRule="evenodd"
 />
 </svg>
 ) : (
 index + 1
 )}
 </button>

 {/* Connector Line */}
 {index < steps.length - 1 && (
 <div
 className={`
 flex-1 h-1 mx-2 transition-colors
 ${isCompleted(index + 1) ? 'bg-pupr-blue' : 'bg-slate-300'}
 `}
 />
 )}
 </div>
 ))}
 </div>
 ) : (
 /* Vertical Variant */
 <div className="space-y-6">
 {steps.map((step, index) => (
 <div key={step.id} className="flex gap-4">
 {/* Step Circle */}
 <div className="flex flex-col items-center">
 <button
 onClick={() => onStepChange?.(index)}
 className={`
 w-10 h-10 rounded-sm flex items-center justify-center font-bold transition-all
 flex-shrink-0 tabular-nums
 ${
 isCurrent(index)
 ? 'bg-pupr-blue text-white border border-pupr-blue'
 : isCompleted(index)
 ? 'bg-pupr-blue text-white border border-pupr-blue'
 : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-300 dark:border-slate-600'
 }
 `}
 >
 {isCompleted(index) ? (
 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
 <path
 fillRule="evenodd"
 d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
 clipRule="evenodd"
 />
 </svg>
 ) : (
 index + 1
 )}
 </button>
 {index < steps.length - 1 && (
 <div
 className={`w-1 h-12 transition-colors ${
 isCompleted(index + 1) ? 'bg-pupr-blue' : 'bg-slate-300'
 }`}
 />
 )}
 </div>

 {/* Step Info */}
 <div className="flex-1 pt-1">
 <h4 className="font-semibold text-slate-900 dark:text-slate-100">{step.label}</h4>
 {step.description && (
 <p className="text-sm text-slate-500 mt-1">{step.description}</p>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
};

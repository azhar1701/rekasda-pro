import React from 'react';

interface FlatStepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

/**
 * FlatStepper — Progressive disclosure stepper for multi-step engineering forms.
 * Follows Insight 3: Flat segmented bar replacing traditional stepper circles.
 *
 * Visual Rules:
 * - Active step: bg-slate-900 text-white
 * - Completed step: bg-slate-200 text-slate-600
 * - Future step: bg-slate-100 text-slate-400
 * - Container: flush segments with 1px border, no rounded corners
 */
export const FlatStepper: React.FC<FlatStepperProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`flex gap-px border border-slate-300 p-1 bg-slate-300 ${className}`}>
      {steps.map((label, idx) => {
        let stepClasses: string;

        if (idx < currentStep) {
          // Completed
          stepClasses = 'bg-slate-200 text-slate-600 font-medium';
        } else if (idx === currentStep) {
          // Active
          stepClasses = 'bg-slate-900 text-white font-semibold';
        } else {
          // Future
          stepClasses = 'bg-slate-100 text-slate-400';
        }

        return (
          <div
            key={idx}
            className={`flex-1 text-center text-xs px-3 py-1.5 select-none ${stepClasses}`}
          >
            <span className="font-mono mr-1">{idx + 1}.</span>
            {label}
          </div>
        );
      })}
    </div>
  );
};

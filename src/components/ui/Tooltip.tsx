import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 -translate-x-1/2 left-1/2',
    bottom: 'top-full mt-2 -translate-x-1/2 left-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg
            whitespace-nowrap pointer-events-none
            ${positionClasses[position]}
          `}
        >
          {content}
          <div className={`absolute w-2 h-2 bg-slate-900 ${
            position === 'top' ? 'top-full -translate-y-1' : 
            position === 'bottom' ? 'bottom-full translate-y-1' : 
            position === 'left' ? 'left-full -translate-x-1' : 
            'right-full translate-x-1'
          }`} />
        </div>
      )}
    </div>
  );
};

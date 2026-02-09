import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  fullHeight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  description,
  icon,
  fullHeight = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl border border-slate-200 
        shadow-card hover:shadow-card-hover transition-all duration-300
        ${fullHeight ? 'flex flex-col h-full' : ''}
        ${className}
      `}
    >
      {(title || description || icon) && (
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start gap-3">
            {icon && <div className="text-teal-600 flex-shrink-0">{icon}</div>}
            <div className="flex-1">
              {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
              {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
          </div>
        </div>
      )}
      <div className={`${title || description || icon ? 'px-6 py-5' : 'p-6'} ${fullHeight ? 'flex-1' : ''}`}>
        {children}
      </div>
    </div>
  );
};

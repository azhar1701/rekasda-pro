import React from 'react';

interface CardGovTechProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
}

export const CardGovTech: React.FC<CardGovTechProps> = ({ 
  children, 
  className = '',
  title,
  subtitle,
  headerAction,
  noPadding = false
}) => {
  return (
    <div className={`bg-white border border-slate-300 rounded-md shadow-sm ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-300 bg-slate-50">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-base font-bold text-pupr-blue uppercase tracking-wide">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-pupr-text/70 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex items-center gap-2">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

interface CardGovTechHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardGovTechHeader: React.FC<CardGovTechHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-slate-300 bg-slate-50 ${className}`}>
      {children}
    </div>
  );
};

interface CardGovTechContentProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const CardGovTechContent: React.FC<CardGovTechContentProps> = ({ 
  children, 
  className = '',
  noPadding = false 
}) => {
  return (
    <div className={`${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};

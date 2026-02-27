import React from 'react';

interface WebGISContainerProps {
  children: React.ReactNode;
  title?: string;
  height?: string;
  className?: string;
}

export const WebGISContainer: React.FC<WebGISContainerProps> = ({ 
  children, 
  title,
  height = 'h-[500px]',
  className = '' 
}) => {
  return (
    <div className={`bg-white border-2 border-pupr-blue/20 rounded-md overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-2 bg-pupr-blue text-white border-b-2 border-pupr-blue">
          <h4 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {title}
          </h4>
        </div>
      )}
      <div className={`${height} relative`}>
        {children}
      </div>
    </div>
  );
};

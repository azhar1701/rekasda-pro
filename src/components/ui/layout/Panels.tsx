import React from 'react';

interface DataPanelProps {
 children: React.ReactNode;
 className?: string;
}

export const DataPanel: React.FC<DataPanelProps> = ({ children, className = '' }) => {
 return (
 <div className={`space-y-4 ${className}`}>
 {children}
 </div>
 );
};

interface ResultPanelProps {
 children: React.ReactNode;
 className?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ children, className = '' }) => {
 return (
 <div className={`space-y-4 ${className}`}>
 {children}
 </div>
 );
};

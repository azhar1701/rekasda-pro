import React from 'react';

interface InfoPropertyProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'highlight';
    iconColorClass?: string;
}

export const InfoProperty: React.FC<InfoPropertyProps> = ({
    label,
    value,
    icon,
    variant = 'default',
    iconColorClass = 'text-pupr-blue'
}) => {
    return (
        <div className="flex items-start gap-3">
            {icon && (
                <div className={`w-10 h-10 rounded-md bg-opacity-10 flex items-center justify-center shrink-0 ${iconColorClass.replace('text-', 'bg-')}`}>
                    {React.cloneElement(icon as React.ReactElement, {
                        className: `w-5 h-5 ${iconColorClass}`
                    })}
                </div>
            )}
            <div className="flex-1">
                <p className="text-xs font-bold text-pupr-text/60 uppercase tracking-wider mb-1">{label}</p>
                <div className={`text-sm font-bold text-pupr-text ${variant === 'highlight' ? 'text-lg text-pupr-blue' : ''}`}>
                    {value || 'Belum diatur'}
                </div>
            </div>
        </div>
    );
};

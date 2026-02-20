import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function Card({ children, title, subtitle, action, className = '' }: CardProps) {
  return (
    <div className={`glass-card rounded-xl ${className}`}>
      {(title || action) && (
        <div className="px-6 py-5 border-b border-white/20 flex items-start justify-between gap-4">
          <div className="flex-1">
            {title && <h3 className="text-h3 text-neutral-900">{title}</h3>}
            {subtitle && <p className="text-body text-neutral-600 mt-2">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

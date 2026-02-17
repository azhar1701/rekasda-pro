import React from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface HeaderProps {
  appName: string;
  appSubtitle?: string;
  statusBadge?: {
    label: string;
    color: string;
    isLoading?: boolean;
  };
  version?: string;
  isScrolled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  statusBadge,
  version,
  isScrolled = false,
}) => {
  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 bg-white border-b ${
        isScrolled ? 'border-slate-200 shadow-sm' : 'border-slate-100'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
        {/* Logo & App Name */}
        <BrandLogo size="md" showText={true} />

        {/* Right Side - Status & Version */}
        <div className="hidden md:flex items-center gap-3">
          {statusBadge && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
              <div
                className={`w-2 h-2 rounded-full ${statusBadge.color} ${
                  statusBadge.isLoading ? 'animate-pulse' : ''
                }`}
              />
              <span className="text-xs font-medium text-slate-600">
                {statusBadge.label}
              </span>
            </div>
          )}
          {version && (
            <span className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-full border border-slate-200">
              v{version}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

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
}

export const Header: React.FC<HeaderProps> = ({
  statusBadge,
  version,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#0c3a66] via-[#0d4578] to-[#0c3a66] text-white shadow-md border-b-4 border-[#f2c114]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" showText={true} />
          </div>

          {/* Right Side - Status & Version */}
          <div className="flex items-center gap-2 md:gap-3">
            {statusBadge && (
              <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                <div
                  className={`w-2 h-2 rounded-full ${statusBadge.color} ${
                    statusBadge.isLoading ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-xs font-medium text-white">
                  {statusBadge.label}
                </span>
              </div>
            )}
            {version && (
              <span className="text-xs font-semibold px-2.5 md:px-3 py-1.5 rounded-lg text-white bg-white/10 backdrop-blur-sm border border-white/20">
                v{version}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

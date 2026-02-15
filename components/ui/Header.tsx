import React from 'react';

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
  appName,
  appSubtitle,
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
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.8 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{appName}</h1>
            {appSubtitle && (
              <span className="text-xs text-slate-500">{appSubtitle}</span>
            )}
          </div>
        </div>

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

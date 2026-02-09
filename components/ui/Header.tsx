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
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-soft'
          : 'bg-gradient-to-br from-slate-50 to-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex justify-between items-center">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white p-2.5 rounded-xl shadow-card">
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.8 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              {appName}
            </h1>
            {appSubtitle && (
              <span className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
                {appSubtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Status & Version */}
        <div className="hidden md:flex items-center gap-3">
          {statusBadge && (
            <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full border border-slate-200">
              <div
                className={`w-2 h-2 rounded-full ${
                  statusBadge.color
                } ${statusBadge.isLoading ? 'animate-pulse' : ''}`}
              />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                {statusBadge.label}
              </span>
            </div>
          )}
          {version && (
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              v{version}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

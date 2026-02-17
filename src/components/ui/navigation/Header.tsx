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
          {/* Professional Water Resources Engineering Logo */}
          <div className="relative">
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Squircle Background with Gradient */}
              <rect width="48" height="48" rx="12" fill="url(#logoGradient)" />
              <defs>
                <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              
              {/* Water Droplet with Flow Lines */}
              <g transform="translate(12, 8)">
                {/* Main Droplet Shape */}
                <path
                  d="M12 2C8.5 6 6 9.5 6 13c0 3.31 2.69 6 6 6s6-2.69 6-6c0-3.5-2.5-7-6-11z"
                  fill="white"
                  opacity="0.95"
                />
                
                {/* Flow Lines Inside Droplet */}
                <path
                  d="M10 10c0 1.1.9 2 2 2s2-.9 2-2"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
                
                {/* Upward Trend Arrow/Graph */}
                <path
                  d="M9 14l1.5-2 1.5 1 2-2.5"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                
                {/* Data Points */}
                <circle cx="9" cy="14" r="1" fill="#0284c7" />
                <circle cx="10.5" cy="12" r="1" fill="#0284c7" />
                <circle cx="12" cy="13" r="1" fill="#0284c7" />
                <circle cx="14" cy="10.5" r="1" fill="#06b6d4" />
              </g>
              
              {/* Subtle Wave Pattern at Bottom */}
              <path
                d="M0 40c4-2 8-2 12 0s8 2 12 0 8-2 12 0 8 2 12 0"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.3"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg text-slate-900">
              <span className="font-bold">Reka</span>
              <span className="font-medium">SDA</span>
            </h1>
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

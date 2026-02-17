import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showText = true,
  className = '' 
}) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-base' },
    md: { icon: 'w-10 h-10', text: 'text-lg' },
    lg: { icon: 'w-12 h-12', text: 'text-xl' }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Geometric Water Droplet Icon */}
      <svg 
        className={sizes[size].icon} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="dropletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        
        {/* Contour Lines forming Droplet */}
        <path
          d="M16 4C12 9 8 13 8 18c0 4.4 3.6 8 8 8s8-3.6 8-8c0-5-4-9-8-14z"
          fill="url(#dropletGradient)"
          opacity="0.2"
        />
        
        {/* Grid/Contour Lines */}
        <path
          d="M16 4C12 9 8 13 8 18c0 4.4 3.6 8 8 8s8-3.6 8-8c0-5-4-9-8-14z"
          stroke="url(#dropletGradient)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Inner Contour 1 */}
        <path
          d="M16 8c-2.5 3-4.5 5.5-4.5 8.5c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5c0-3-2-5.5-4.5-8.5z"
          stroke="url(#dropletGradient)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        
        {/* Inner Contour 2 */}
        <path
          d="M16 12c-1.5 2-2.5 3.5-2.5 5.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0-2-1-3.5-2.5-5.5z"
          stroke="url(#dropletGradient)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        
        {/* Center Point */}
        <circle cx="16" cy="17" r="1.5" fill="#06b6d4" />
      </svg>

      {/* Brand Text */}
      {showText && (
        <div className={sizes[size].text}>
          <span className="font-bold text-slate-900">Reka</span>
          <span className="font-normal text-slate-500">SDA</span>
        </div>
      )}
    </div>
  );
};

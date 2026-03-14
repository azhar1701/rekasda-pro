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
 <header className="sticky top-0 z-50 bg-pupr-blue text-white border-b border-pupr-yellow ">
 <div className="max-w-7xl mx-auto px-4 md:px-6">
 <div className="flex justify-between items-center h-16 md:h-20">
 {/* Logo & App Name */}
 <div className="flex items-center gap-3">
 <BrandLogo size="md" showText={true} />
 </div>

 {/* Right Side - Status & Version */}
 <div className="flex items-center gap-2 md:gap-3">
 {statusBadge && (
 <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-sm bg-white border border-white/20">
 <div
 className={`w-2 h-2 rounded-none ${statusBadge.color} ${
 statusBadge.isLoading ? 'animate-pulse' : ''
 }`}
 />
 <span className="text-xs font-medium text-white truncate max-w-[100px] sm:max-w-[200px]">
 {statusBadge.label}
 </span>
 </div>
 )}
 {version && (
 <span className="text-xs font-semibold px-2.5 md:px-3 py-1.5 rounded-sm text-white bg-white border border-white/20">
 v{version}
 </span>
 )}
 </div>
 </div>
 </div>
 </header>
 );
};

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface SNILabelProps {
 label: string;
 tooltip: string;
 sniCode: string;
}

export const SNILabel: React.FC<SNILabelProps> = ({ label, tooltip, sniCode }) => {
 const [showTooltip, setShowTooltip] = useState(false);

 return (
 <div className="relative">
 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block flex items-center gap-2">
 {label}
 <div
 className="relative inline-flex"
 onMouseEnter={() => setShowTooltip(true)}
 onMouseLeave={() => setShowTooltip(false)}
 >
 <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
 {showTooltip && (
 <div className="absolute left-0 top-6 z-50 w-64 px-3 py-2 bg-slate-900 text-white text-xs rounded-sm ">
 <div className="font-semibold mb-1">{sniCode}</div>
 <div className="text-slate-300">{tooltip}</div>
 </div>
 )}
 </div>
 </label>
 </div>
 );
};

interface ComplianceBadgeProps {
 sniCode: string;
}

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({ sniCode }) => {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-pupr-blue rounded-sm text-xs font-semibold">
 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
 <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
 </svg>
 {sniCode}
 </span>
 );
};

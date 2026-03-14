import React from 'react';
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
 title: string;
 description?: string;
 icon?: React.ReactNode;
 className?: string;
 action?: React.ReactNode;
}

export const SectionHeader = ({ title, description, icon, action, className }: SectionHeaderProps) => {
 return (
 <div className={cn("flex items-start justify-between bg-pupr-surface/50 p-4 rounded-sm border border-pupr-border mb-6 shrink-0", className)}>
 <div className="flex gap-3">
 {icon && (
 <div className="text-blue-500 shrink-0 mt-0.5">
 {icon}
 </div>
 )}
 <div>
 <h3 className="text-sm font-semibold text-blue-900">{title}</h3>
 {description && (
 <p className="text-sm text-pupr-blue/80 mt-1">
 {description}
 </p>
 )}
 </div>
 </div>
 {action && (
 <div className="shrink-0 ml-4 flex items-center">
 {action}
 </div>
 )}
 </div>
 );
};

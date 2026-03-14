import React from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
 label: string;
 value: React.ReactNode;
 valueColorClass?: string;
 className?: string;
 icon?: React.ReactNode;
 unit?: string;
}

export const StatCard = ({
 label,
 value,
 valueColorClass = "text-slate-800 dark:text-slate-200",
 className,
 icon,
 unit
}: StatCardProps) => {
 return (
 <Card className={cn("bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 relative overflow-hidden", className)}>
 {icon && (
 <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
 {icon}
 </div>
 )}
 <CardContent className="p-4 flex flex-col justify-center relative z-10">
 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
 <div className="flex items-baseline gap-2">
 <h3 className={cn("text-2xl font-bold", valueColorClass)}>
 {value}
 </h3>
 {unit && <span className={cn("text-xs font-semibold opacity-70", valueColorClass)}>{unit}</span>}
 </div>
 </CardContent>
 </Card>
 );
};

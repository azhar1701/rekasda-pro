import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface InputTableProps {
 title: string;
 description?: string;
 headers: React.ReactNode;
 children: React.ReactNode;
 className?: string;
 minWidth?: string;
}

export const InputTable = ({
 title,
 description,
 headers,
 children,
 className,
 minWidth = "min-w-[380px]"
}: InputTableProps) => {
 return (
 <Card className={cn("flex flex-col border-slate-200 dark:border-slate-700 min-h-[400px]", className)}>
 <CardHeader className="py-4 px-5 border-b border-slate-100 bg-slate-50 dark:bg-slate-800 shrink-0">
 <CardTitle className="text-base text-slate-800 dark:text-slate-200">{title}</CardTitle>
 {description && <CardDescription className="text-xs">{description}</CardDescription>}
 </CardHeader>
 <CardContent className="flex-1 overflow-auto p-0 border border-slate-200 dark:border-slate-700 border-t-0 rounded-b-xl bg-white dark:bg-slate-900">
 <div className={cn("w-full", minWidth)}>
 {/* Table Header */}
 <div className="flex w-full sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider font-semibold text-slate-500 z-10">
 {headers}
 </div>
 {/* Table Body */}
 <div className="w-full pb-2">
 {children}
 </div>
 </div>
 </CardContent>
 </Card>
 );
};

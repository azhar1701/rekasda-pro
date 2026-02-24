import React from 'react';

interface ModuleLayoutProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    iconColorClass?: string;
    children: React.ReactNode;
}

export const ModuleLayout = ({
    title,
    description,
    icon,
    iconColorClass = "bg-teal-50 text-teal-600",
    children
}: ModuleLayoutProps) => {
    return (
        <div className="w-full h-full flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[85vh]">
            {/* Dashboard Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-white shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2 rounded-lg shrink-0 ${iconColorClass}`}>
                        {icon}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-sm text-slate-500 font-medium">{description}</p>
                    </div>
                </div>
            </div>

            {/* Internal Scrollable Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
                <div className="flex-1 overflow-y-auto pr-1 pb-4 flex flex-col relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

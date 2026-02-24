import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface SegmentedControlItem {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface SegmentedControlProps {
    items: SegmentedControlItem[];
    className?: string;
}

export const SegmentedControl = ({ items, className }: SegmentedControlProps) => {
    return (
        <TabsList className={cn("w-full justify-start p-1 bg-slate-200/50 rounded-xl mb-6 flex-wrap h-auto gap-1", className)}>
            {items.map((item) => (
                <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold text-slate-600 px-4 py-2.5 transition-all"
                >
                    <div className="flex items-center gap-2">
                        {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                        <span>{item.label}</span>
                    </div>
                </TabsTrigger>
            ))}
        </TabsList>
    );
};

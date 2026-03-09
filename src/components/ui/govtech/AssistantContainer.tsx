import React, { useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

interface AssistantContainerProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const AssistantContainer: React.FC<AssistantContainerProps> = ({
    title,
    children,
    defaultOpen = false
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 hover:bg-amber-100 transition-colors w-full justify-between shadow-sm"
            >
                <div className="flex items-center gap-2 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-pupr-yellow" />
                    {title}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isOpen && (
                <div className="mt-3 p-4 border border-slate-200 rounded-md bg-white space-y-5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300 origin-top shadow-inner">
                    {children}
                </div>
            )}
        </div>
    );
};

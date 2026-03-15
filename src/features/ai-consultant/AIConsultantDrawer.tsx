/**
 * AIConsultantDrawer — Flattened Design Slide-Over
 * =======================================================
 * A flat right-side drawer that acts as a Context-Aware
 * Engineering AI Assistant. Reads live data from useHydrologyStore
 * and provides actionable parameter suggestions.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { consultHydrologist } from '@/services/geminiService';
import { useAIContext, type ActiveModule, type SuggestionChip } from '@/hooks/useAIContext';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import {
    Bot, User, Send, X, Sparkles,
    AlertTriangle, Info, Maximize2, Minimize2,
    Shield, Activity, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────

interface ActionableParam {
    label: string;
    action: () => void;
    description: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: ActionableParam[];
}

interface AIConsultantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: ActiveModule;
    initialQuery?: string;
    lastContext?: string;
    triggerCount?: number;
}

// ─── Actionable Suggestion Parser ───────────────────────────────────

function parseActionableSuggestions(text: string): ActionableParam[] {
    const actions: ActionableParam[] = [];
    const store = useHydrologyStore.getState();

    const infMatch = text.match(/[Ii]nfiltration\s*[Ff]actor\s*(?:menjadi|=|:)\s*([\d.]+)/);
    if (infMatch) {
        const value = parseFloat(infMatch[1]);
        if (value >= 0 && value <= 1) {
            actions.push({
                label: `Terapkan Infiltration Factor = ${value}`,
                description: `Mengubah Infiltration Factor menjadi ${value}`,
                action: () => { },
            });
        }
    }

    const areaMatch = text.match(/[Ll]uas\s*DAS\s*(?:menjadi|=|:)\s*([\d.]+)\s*km/);
    if (areaMatch) {
        const value = areaMatch[1];
        actions.push({
            label: `Terapkan Luas DAS = ${value} km²`,
            description: `Mengubah Luas DAS menjadi ${value} km²`,
            action: () => store.setLuasDas(value),
        });
    }

    return actions;
}

// ─── Component ──────────────────────────────────────────────────────

export const AIConsultantDrawer: React.FC<AIConsultantDrawerProps> = ({
    isOpen,
    onClose,
    activeTab,
    initialQuery,
    lastContext,
    triggerCount = 0,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { systemContext, suggestionChips, moduleSummary, hasIssues, dataStatus } = useAIContext(activeTab);

    const loadedCount = dataStatus.filter(d => d.isLoaded).length;
    const totalCount = dataStatus.length;
    const integrityPercentage = Math.round((loadedCount / totalCount) * 100);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = useCallback(async (customPrompt?: string, additionalContext?: string) => {
        const userMessage = customPrompt || query.trim();
        if (!userMessage || isLoading) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);

        try {
            const fullContext = additionalContext
                ? `${systemContext}\n\n[MODULE CONTEXT]\n${additionalContext}`
                : systemContext;

            const response = await consultHydrologist(userMessage, fullContext);
            const actions = parseActionableSuggestions(response);

            const aiMsg: ChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
                actions: actions.length > 0 ? actions : undefined,
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan saat menghubungi layanan AI. Silakan coba lagi.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [query, isLoading, systemContext]);

    useEffect(() => {
        if (isOpen && initialQuery && triggerCount > 0) {
            handleSend(initialQuery, lastContext);
        }
    }, [triggerCount, isOpen, initialQuery, lastContext, handleSend]);

    const handleChipClick = (chip: SuggestionChip) => {
        handleSend(chip.prompt);
    };


    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900/30 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            <div
                className={cn(
                    "fixed top-0 right-0 z-[70] h-full transform transition-all duration-300 ease-out",
                    isOpen ? 'translate-x-0' : 'translate-x-full',
                    isFullScreen ? 'w-full' : 'w-full sm:w-[420px] lg:w-[480px]'
                )}
            >
                <div className="h-full flex flex-col bg-white border-l border-slate-300 relative overflow-hidden">

                    {/* ── Header ── */}
                    <div className="shrink-0 px-5 py-4 border-b border-slate-300 bg-pupr-blue text-white z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white/15 flex items-center justify-center border border-white/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    {hasIssues && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-pupr-blue animate-flash" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-sm font-extrabold text-white tracking-tight leading-none mb-1">Konsultan AI</h2>
                                    <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">{moduleSummary}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="flat-badge text-[9px] text-white/80 bg-white/10 border border-white/20">AI POWERED</span>
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Chat Messages ── */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 bg-white border border-slate-300 flex items-center justify-center relative z-10">
                                        <Sparkles className="w-8 h-8 text-pupr-blue" />
                                    </div>
                                </div>

                                <h3 className="text-lg font-extrabold text-slate-900 mb-2 tracking-tight">Halo, Saya Konsultan AI</h3>
                                <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed font-medium mb-6">
                                    Saya siap membantu mengaudit parameter hidrologi Anda berdasarkan standar <span className="text-pupr-blue font-bold">SNI & Permen PUPR</span>.
                                </p>

                                <div className="w-full bg-slate-50 border border-slate-300 p-4 mb-4 relative overflow-hidden group hover:border-pupr-blue/30 transition-all">
                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 text-sky-500" />
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700">Integritas Data</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 border border-sky-200">{integrityPercentage}%</span>
                                    </div>
                                    {/* Flat Confidence Bar (Insight 5) */}
                                    <div className="h-2 w-full bg-slate-200 overflow-hidden mb-4 relative z-10">
                                        <div className="h-full bg-emerald-600 transition-all duration-1000 ease-out" style={{ width: `${integrityPercentage}%` }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 relative z-10">
                                        {dataStatus.slice(0, 4).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <div className={cn("w-1.5 h-1.5", item.isLoaded ? "bg-emerald-600" : "bg-slate-300")} />
                                                <span className="text-[9px] font-bold text-slate-500 truncate">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex group animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[90%] flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                    <div className={cn(
                                        "w-8 h-8 flex items-center justify-center shrink-0 border border-slate-300 transition-transform group-hover:scale-105",
                                        msg.role === 'user' ? "bg-pupr-blue text-white" : "bg-white text-pupr-blue"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        {msg.role === 'assistant' && (
                                            <span className="flat-badge mb-1">AI GENERATED</span>
                                        )}
                                        <div className={cn(
                                            "p-4 relative overflow-hidden",
                                            msg.role === 'user'
                                                ? "bg-pupr-blue text-white"
                                                : "bg-white border border-slate-300"
                                        )}>
                                            <div className={cn(
                                                "prose prose-sm max-w-none relative z-10",
                                                msg.role === 'user' ? "prose-invert prose-p:leading-relaxed" : "prose-slate prose-p:leading-relaxed prose-headings:font-extrabold prose-strong:text-pupr-blue"
                                            )}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        h3: ({ node, ...props }: any) => <h3 className="flex items-center gap-2 mb-3 text-pupr-blue font-extrabold" {...props} />,
                                                        blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-pupr-yellow bg-slate-50 py-1 px-4 italic" {...props} />,
                                                        code: ({ node, inline, ...props }: any) =>
                                                            inline
                                                                ? <code className="bg-slate-100 text-pupr-blue px-1.5 py-0.5 font-bold font-mono" {...props} />
                                                                : <code className="block bg-slate-900 text-slate-100 p-3 my-3 text-[10px] font-mono overflow-x-auto" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 text-[9px] text-slate-400 font-extrabold px-1 uppercase tracking-widest",
                                            msg.role === 'user' ? "justify-end" : "justify-start"
                                        )}>
                                            <Clock className="w-2.5 h-2.5" />
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2.5">
                                    <div className="w-7 h-7 bg-slate-100 flex items-center justify-center border border-slate-300 flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div className="bg-white border border-slate-300 px-4 py-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-pupr-blue animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-pupr-blue animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-pupr-blue animate-bounce" />
                                        <span className="text-[10px] text-slate-400 ml-1 font-medium">Menganalisis...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* ── Suggestion Chips ── */}
                    {suggestionChips.length > 0 && messages.length < 3 && (
                        <div className="shrink-0 px-4 py-3 border-t border-slate-300 bg-slate-50">
                            <div className="flex items-center gap-1.5 mb-2.5">
                                {hasIssues ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <Info className="w-3 h-3 text-slate-400" />}
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Audit Rekomendasi</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {suggestionChips.map((chip) => (
                                    <button
                                        key={chip.id}
                                        onClick={() => handleChipClick(chip)}
                                        disabled={isLoading}
                                        className="text-left p-3 bg-white border border-slate-300 hover:border-pupr-blue transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 group-hover:bg-pupr-blue/10 transition-colors">
                                                <Activity className="w-3.5 h-3.5 text-pupr-blue" />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 group-hover:text-pupr-blue transition-colors leading-tight">{chip.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Input Area ── */}
                    <div className="shrink-0 p-4 border-t border-slate-300 bg-slate-50">
                        <div className="flex items-end gap-3 bg-white p-2 border border-slate-300 focus-within:border-pupr-blue transition-all group/input">
                            <div className="flex-1 relative pl-2">
                                <textarea
                                    ref={inputRef}
                                    className="w-full bg-transparent border-none px-2 py-3 pr-3 text-[13px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium focus:ring-0 resize-none min-h-[44px] max-h-[120px] transition-all custom-scrollbar"
                                    rows={1}
                                    placeholder="Tanyakan analisis atau parameter..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading || !query.trim()}
                                className="w-11 h-11 bg-slate-900 hover:bg-pupr-blue disabled:bg-slate-200 text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

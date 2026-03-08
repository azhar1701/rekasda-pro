/**
 * AIConsultantDrawer — Context-Aware Floating Slide-Over
 * =======================================================
 * A glassmorphism right-side drawer that acts as a Context-Aware
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
    Bot, User, Send, X, Sparkles, Zap,
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
                action: () => console.log(`[AI Action] Set Infiltration Factor = ${value}`),
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
                    className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-300"
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
                <div className="h-full flex flex-col bg-white/95 backdrop-blur-2xl border-l border-slate-200/60 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />

                    {/* ── Header ── */}
                    <div className="shrink-0 px-5 py-4 border-b border-slate-100 bg-pupr-blue text-white z-10 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    {hasIssues && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-md border-2 border-pupr-blue animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-white tracking-tight leading-none mb-1">Konsultan AI</h2>
                                    <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">{moduleSummary}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setIsFullScreen(!isFullScreen)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
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
                                    <div className="absolute inset-0 bg-pupr-blue/10 blur-[40px] rounded-full scale-150" />
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center relative z-10 ring-1 ring-black/5 rotate-3">
                                        <Sparkles className="w-8 h-8 text-pupr-blue" />
                                    </div>
                                    <div className="absolute -right-2 -top-2 w-8 h-8 bg-pupr-yellow rounded-xl shadow-lg flex items-center justify-center z-20 -rotate-12">
                                        <Zap className="w-4 h-4 text-pupr-blue" />
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">Halo, Saya Konsultan AI</h3>
                                <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed font-medium mb-6">
                                    Saya siap membantu mengaudit parameter hidrologi Anda berdasarkan standar <span className="text-pupr-blue font-bold">SNI & Permen PUPR</span>.
                                </p>

                                <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-4 relative overflow-hidden group hover:border-pupr-blue/30 transition-all">
                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5 text-sky-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Integritas Data</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">{integrityPercentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-4 relative z-10">
                                        <div className="h-full bg-sky-500 transition-all duration-1000 ease-out" style={{ width: `${integrityPercentage}%` }} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 relative z-10">
                                        {dataStatus.slice(0, 4).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5">
                                                <div className={cn("w-1 h-1 rounded-full", item.isLoaded ? "bg-sky-500" : "bg-slate-300")} />
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
                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md border-2 border-white transition-transform group-hover:scale-110",
                                        msg.role === 'user' ? "bg-pupr-blue text-white" : "bg-white text-pupr-blue"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className={cn(
                                            "p-4 rounded-[1.5rem] shadow-sm relative overflow-hidden",
                                            msg.role === 'user'
                                                ? "bg-pupr-blue text-white rounded-tr-none ring-1 ring-white/10"
                                                : "bg-white border border-slate-200 rounded-tl-none ring-1 ring-black/[0.02]"
                                        )}>
                                            <div className={cn(
                                                "prose prose-sm max-w-none relative z-10",
                                                msg.role === 'user' ? "prose-invert prose-p:leading-relaxed" : "prose-slate prose-p:leading-relaxed prose-headings:font-black prose-strong:text-pupr-blue"
                                            )}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        h3: ({ node, ...props }: any) => <h3 className="flex items-center gap-2 mb-3 text-pupr-blue font-black" {...props} />,
                                                        blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-pupr-yellow bg-slate-50 py-1 px-4 italic" {...props} />,
                                                        code: ({ node, inline, ...props }: any) =>
                                                            inline
                                                                ? <code className="bg-slate-100 text-pupr-blue px-1.5 py-0.5 rounded font-bold" {...props} />
                                                                : <code className="block bg-slate-900 text-slate-100 p-3 rounded-xl my-3 text-[10px] font-mono overflow-x-auto" {...props} />
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 text-[9px] text-slate-400 font-black px-1 uppercase tracking-widest",
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
                                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-md rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-pupr-blue rounded-md animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-pupr-blue rounded-md animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-pupr-blue rounded-md animate-bounce" />
                                        <span className="text-[10px] text-slate-400 ml-1 font-medium">Menganalisis...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* ── Suggestion Chips ── */}
                    {suggestionChips.length > 0 && messages.length < 3 && (
                        <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-1.5 mb-2.5">
                                {hasIssues ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <Info className="w-3 h-3 text-slate-400" />}
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Rekomendasi</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {suggestionChips.map((chip) => (
                                    <button
                                        key={chip.id}
                                        onClick={() => handleChipClick(chip)}
                                        disabled={isLoading}
                                        className="text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-pupr-blue hover:shadow-lg transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-pupr-blue/10 transition-colors">
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
                    <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50/80 backdrop-blur-md">
                        <div className="flex items-end gap-3 bg-white p-2 rounded-[1.75rem] border border-slate-300 shadow-xl shadow-black/5 focus-within:border-pupr-blue transition-all group/input ring-1 ring-black/[0.02]">
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
                                className="w-11 h-11 rounded-full bg-slate-900 hover:bg-pupr-blue disabled:bg-slate-200 text-white flex items-center justify-center shadow-lg transition-all active:scale-95 shrink-0"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

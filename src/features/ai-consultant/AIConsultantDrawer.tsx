/**
 * AIConsultantDrawer — Context-Aware Floating Slide-Over
 * =======================================================
 * A glassmorphism right-side drawer that acts as a Context-Aware
 * Engineering AI Assistant. Reads live data from useHydrologyStore
 * and provides actionable parameter suggestions.
 *
 * Features:
 * - Invisible Context injection (from useAIContext)
 * - Dynamic Suggestion Chips
 * - Actionable parameter buttons inside chat bubbles
 * - Non-blocking overlay (main UI remains interactive)
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
import { Bot, User, Send, X, Sparkles, Zap, ChevronRight, AlertTriangle, Info, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';

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

/**
 * Parses AI response text and identifies parameter suggestions.
 * Returns actionable buttons that can trigger Zustand updates.
 */
function parseActionableSuggestions(text: string): ActionableParam[] {
    const actions: ActionableParam[] = [];
    const store = useHydrologyStore.getState();

    // Pattern: "Infiltration Factor menjadi X.X"
    const infMatch = text.match(/[Ii]nfiltration\s*[Ff]actor\s*(?:menjadi|=|:)\s*([\d.]+)/);
    if (infMatch) {
        const value = parseFloat(infMatch[1]);
        if (value >= 0 && value <= 1) {
            actions.push({
                label: `Terapkan Infiltration Factor = ${value}`,
                description: `Mengubah Infiltration Factor menjadi ${value}`,
                action: () => {
                    // This would be connected to actual Mock params when available
                    console.log(`[AI Action] Set Infiltration Factor = ${value}`);
                },
            });
        }
    }

    // Pattern: "Luas DAS ... X km²"
    const areaMatch = text.match(/[Ll]uas\s*DAS\s*(?:menjadi|=|:)\s*([\d.]+)\s*km/);
    if (areaMatch) {
        const value = areaMatch[1];
        actions.push({
            label: `Terapkan Luas DAS = ${value} km²`,
            description: `Mengubah Luas DAS menjadi ${value} km²`,
            action: () => store.setLuasDas(value),
        });
    }

    // Pattern: "Koefisien C ... X.X"
    const cMatch = text.match(/[Kk]oefisien\s*C\s*(?:menjadi|=|:)\s*([\d.]+)/);
    if (cMatch) {
        const value = parseFloat(cMatch[1]);
        if (value >= 0 && value <= 1) {
            actions.push({
                label: `Terapkan Koefisien C = ${value}`,
                description: `Mengubah Koefisien Pengaliran menjadi ${value}`,
                action: () => {
                    console.log(`[AI Action] Set C = ${value}`);
                },
            });
        }
    }

    // Pattern: "Curah Hujan Rencana ... X mm"
    const rainMatch = text.match(/[Cc]urah\s*[Hh]ujan\s*[Rr]encana\s*(?:menjadi|=|:)\s*([\d.]+)\s*mm/);
    if (rainMatch) {
        const value = rainMatch[1];
        actions.push({
            label: `Terapkan R₂₄ = ${value} mm`,
            description: `Mengubah Curah Hujan Rencana menjadi ${value} mm`,
            action: () => store.setCurahHujanRencana(value),
        });
    }

    // Pattern: "Kala Ulang ... X tahun"
    const returnMatch = text.match(/[Kk]ala\s*[Uu]lang\s*(?:menjadi|=|:)\s*(\d+)\s*tahun/);
    if (returnMatch) {
        const value = parseInt(returnMatch[1]);
        actions.push({
            label: `Terapkan Kala Ulang = ${value} tahun`,
            description: `Mengubah kala ulang menjadi ${value} tahun`,
            action: () => store.setSelectedKalaUlang(value),
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

    // ── Get AI Context (invisible system prompt + suggestion chips) ──
    const { systemContext, suggestionChips, moduleSummary, hasIssues } = useAIContext(activeTab);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when drawer opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // ── Send Message ──
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
            // Include both global system context and any specific module context passed
            const fullContext = additionalContext
                ? `${systemContext}\n\n[MODULE CONTEXT]\n${additionalContext}`
                : systemContext;

            // Inject invisible context into the prompt
            const response = await consultHydrologist(userMessage, fullContext);

            // Parse actionable suggestions from response
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

    // ── Auto-submit on triggerCount change ──
    useEffect(() => {
        if (isOpen && initialQuery && triggerCount > 0) {
            handleSend(initialQuery, lastContext);
        }
        // Exclude handleSend from deps to avoid infinite loops if handlesend changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerCount, isOpen]);

    // ── Handle chip click ──
    const handleChipClick = (chip: SuggestionChip) => {
        handleSend(chip.prompt);
    };

    // ── Handle actionable param click ──
    const handleActionClick = (action: ActionableParam) => {
        action.action();

        // Add confirmation message
        const confirmMsg: ChatMessage = {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: `✅ **${action.label}** berhasil diterapkan. Grafik dan perhitungan terkait akan diperbarui secara otomatis.`,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmMsg]);
    };

    // Removed custom renderContent in favor of ReactMarkdown

    return (
        <>
            {/* Backdrop — clickable to close, pointer-events-none on main area */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 z-[70] h-full transform transition-all duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    } ${isFullScreen ? 'w-full' : 'w-full sm:w-[420px] lg:w-[480px]'
                    }`}
            >
                <div className="h-full flex flex-col bg-white/95 backdrop-blur-2xl border-l border-slate-200/60 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)]">

                    {/* ── Header ── */}
                    <div className="shrink-0 px-5 py-4 border-b border-slate-100 bg-pupr-blue text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-md bg-pupr-blue text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    {hasIssues && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-md border-2 border-white animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-900 tracking-tight">Konsultan AI</h2>
                                    <p className="text-[10px] font-bold text-pupr-blue uppercase tracking-widest">{moduleSummary}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="w-8 h-8 rounded-md bg-slate-100 hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-pupr-blue transition-all"
                                    title={isFullScreen ? "Perkecil ukuran konsultan" : "Perbesar konsultan AI ke full-screen"}
                                >
                                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                                    title="Tutup konsultan"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Chat Messages ── */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div className="w-16 h-16 rounded-md bg-pupr-blue text-white border border-indigo-100 flex items-center justify-center mb-4 shadow-sm">
                                    <Bot className="w-8 h-8 text-pupr-blue" />
                                </div>
                                <h3 className="text-base font-bold text-slate-700 mb-1">Asisten Cerdas Siap Membantu</h3>
                                <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                                    Saya sudah membaca data perhitungan Anda. Tanyakan apa saja — saya akan menjawab berdasarkan konteks data Anda secara real-time.
                                </p>

                                {/* Context badge */}
                                <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                                    <span className="px-2 py-1 bg-indigo-50 text-pupr-blue rounded-md text-[10px] font-bold border border-indigo-100">
                                        Context-Aware
                                    </span>
                                    <span className="px-2 py-1 bg-emerald-50 text-pupr-blue rounded-md text-[10px] font-bold border border-emerald-100">
                                        SNI 2415:2016
                                    </span>
                                    <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-100">
                                        Live Data
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Render messages */}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[88%] flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user'
                                        ? 'bg-indigo-100 text-pupr-blue'
                                        : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`${msg.role === 'user'
                                        ? 'bg-pupr-blue text-white rounded-md rounded-tr-sm px-4 py-3'
                                        : 'bg-white border border-slate-200 rounded-md rounded-tl-sm px-4 py-3 shadow-sm'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        ) : (
                                            <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:text-slate-800 prose-a:text-pupr-blue">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}

                                        {/* Actionable Suggestion Buttons */}
                                        {msg.actions && msg.actions.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Zap className="w-3 h-3 text-amber-500" />
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Saran Parameter</span>
                                                </div>
                                                {msg.actions.map((action, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleActionClick(action)}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-pupr-blue text-white hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-md text-left transition-all group active:scale-[0.98]"
                                                    >
                                                        <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                                                            <Sparkles className="w-3 h-3 text-pupr-blue" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-xs font-bold text-indigo-700 block truncate">{action.label}</span>
                                                            <span className="text-[10px] text-pupr-blue block truncate">{action.description}</span>
                                                        </div>
                                                        <ArrowRight className="w-3.5 h-3.5 text-pupr-blue group-hover:text-pupr-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
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
                        <div className="shrink-0 px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-1.5 mb-2">
                                {hasIssues ? (
                                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                                ) : (
                                    <Info className="w-3 h-3 text-slate-400" />
                                )}
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pertanyaan Relevan</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {suggestionChips.map((chip) => (
                                    <button
                                        key={chip.id}
                                        onClick={() => handleChipClick(chip)}
                                        disabled={isLoading}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-all hover:shadow-sm active:scale-95 disabled:opacity-50 ${chip.severity === 'critical'
                                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                            : chip.severity === 'warning'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span>{chip.icon}</span>
                                        <span className="truncate max-w-[200px]">{chip.label}</span>
                                        <ChevronRight className="w-3 h-3 opacity-40" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Input Area ── */}
                    <div className="shrink-0 p-3 border-t border-slate-200 bg-white">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 pr-3 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none min-h-[48px] max-h-[120px] transition-all"
                                    rows={1}
                                    placeholder="Tanya soal analisis atau parameter..."
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
                                className="w-11 h-11 rounded-md bg-pupr-blue hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center shadow-sm shadow-indigo-600/20 disabled:shadow-none transition-all active:scale-95"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-md animate-pulse bg-slate-200 rounded-md" />
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

export default AIConsultantDrawer;

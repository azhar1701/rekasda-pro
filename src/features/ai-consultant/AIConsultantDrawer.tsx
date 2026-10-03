import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { consultHydrologist, getActiveGeminiApiKey } from '@/services/geminiService';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useAIContext, ActiveModule, SuggestionChip } from '@/hooks/useAIContext';
import { useAIChatHistory } from './hooks/useAIChatHistory';
import { generateOfflineExpertAnalysis } from './services/offlineExpertEngine';
import { parseActionableSuggestions } from './utils/actionableParser';
import { ChatMessage } from './types/ai.types';
import { ApiKeyModal } from './components/ApiKeyModal';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  Maximize2,
  Minimize2,
  Clock,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Paperclip,
  WifiOff,
  Key
} from 'lucide-react';

interface AIConsultantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveModule;
  initialQuery?: string;
  lastContext?: string;
  triggerCount?: number;
}

export const AIConsultantDrawer: React.FC<AIConsultantDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  initialQuery,
  lastContext,
  triggerCount = 0,
}) => {
  const store = useHydrologyStore();
  const { messages, addMessage, clearMessages } = useAIChatHistory();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!getActiveGeminiApiKey());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      toast.success('Pesan disalin ke clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = useCallback(async (customPrompt?: string, additionalContext?: string) => {
    const userMessage = customPrompt || query.trim();
    if (!userMessage || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      imageBase64: selectedImage || undefined
    };

    addMessage(userMsg);
    setQuery('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const fullContext = additionalContext
        ? `${systemContext}\n\n[MODULE CONTEXT]\n${additionalContext}`
        : systemContext;

      const response = await consultHydrologist(userMessage, fullContext, selectedImage || undefined);
      
      if (!response || response.includes('kesalahan saat menghubungi layanan')) {
        throw new Error('Online service unavailable');
      }

      const actions = parseActionableSuggestions(response, store);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
      };

      addMessage(aiMsg);
    } catch (error) {
      console.warn('Online AI failed in drawer, falling back to local expert engine:', error);
      
      const offlineResult = generateOfflineExpertAnalysis(userMessage, store);
      const offlineActions = parseActionableSuggestions(offlineResult.markdownAnswer, store);

      const errorMsg: ChatMessage = {
        id: `ai-offline-${Date.now()}`,
        role: 'assistant',
        content: offlineResult.markdownAnswer,
        timestamp: new Date(),
        actions: offlineActions.length > 0 ? offlineActions : undefined,
        isOfflineGenerated: true
      };
      addMessage(errorMsg);
      toast.info('Layanan online tidak terjangkau. Jawaban disintesis oleh Mesin Ahli SNI Offline.');
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading, systemContext, selectedImage, addMessage, store]);

  // Handle external triggers from modules (e.g. "Konsultasi AI" from Banjir/Neraca tab)
  useEffect(() => {
    if (isOpen && initialQuery && triggerCount > 0) {
      handleSend(initialQuery, lastContext);
    }
  }, [triggerCount, isOpen, initialQuery, lastContext, handleSend]);

  const handleChipClick = (chip: SuggestionChip) => {
    handleSend(chip.prompt);
  };

  return (
    <div className="no-print print:hidden" data-ai-consultant-drawer>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 no-print print:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-[70] h-full transform transition-all duration-300 ease-out shadow-2xl no-print print:hidden",
          isOpen ? 'translate-x-0' : 'translate-x-full',
          isFullScreen ? 'w-full' : 'w-full sm:w-[460px] lg:w-[520px]'
        )}
      >
        <div className="h-full flex flex-col bg-white border-l border-slate-300 relative overflow-hidden no-print print:hidden">

          {/* ── Header ── */}
          <div className="shrink-0 px-5 py-3.5 border-b border-slate-300 bg-[#0c3a66] text-white z-10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center border border-white/20">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  {hasIssues && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#0c3a66] animate-pulse" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight leading-none mb-1">
                    AI Konsultan Hidrologi
                  </h2>
                  <p className="text-[10px] font-semibold text-sky-200 uppercase tracking-widest">
                    {moduleSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setApiKeyModalOpen(true)}
                  className="flex items-center gap-1 text-[9px] font-bold text-white/90 bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider transition-colors cursor-pointer"
                  title="Konfigurasi Kunci API Gemini Google"
                >
                  <Key className="w-2.5 h-2.5 text-amber-300" />
                  <span>{hasApiKey ? 'Gemini Online' : 'Kunci API'}</span>
                </button>
                <span className="text-[9px] font-bold text-white/90 bg-white/15 px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider">
                  SNI READY
                </span>
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  title={isFullScreen ? 'Perkecil' : 'Layar Penuh'}
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button 
                  onClick={onClose} 
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                  title="Tutup Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Chat Messages Container ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 custom-scrollbar bg-slate-50/50">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-6 px-3 text-center">
                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-[#0c3a66]" />
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 tracking-tight">
                  Konsultan Rekayasa SDA
                </h3>
                <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed font-medium mb-5">
                  Audit otomatis perhitungan banjir, neraca air, embung, dan dimensi saluran sesuai kriteria <strong className="text-slate-800">Standar Nasional Indonesia (SNI)</strong>.
                </p>

                {/* Data Integrity Summary Card */}
                <div className="w-full bg-white border border-slate-200 rounded-xl p-3.5 mb-4 shadow-2xs text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Integritas Data Workspace</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {integrityPercentage}%
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-emerald-600 transition-all duration-700 rounded-full" 
                      style={{ width: `${integrityPercentage}%` }} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {dataStatus.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", item.isLoaded ? "bg-emerald-600" : "bg-slate-300")} />
                        <span className="text-[10px] font-semibold text-slate-600 truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex group animate-in fade-in duration-200", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[92%] flex gap-2.5", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs mt-0.5",
                    msg.role === 'user' ? "bg-[#0c3a66] text-white" : "bg-white text-[#0c3a66]"
                  )}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    {msg.imageBase64 && (
                      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-2xs mb-1.5 max-w-[200px]">
                        <img src={msg.imageBase64} alt="Lampiran" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    <div className={cn(
                      "p-3.5 rounded-xl shadow-2xs relative text-xs leading-relaxed",
                      msg.role === 'user'
                        ? "bg-[#0c3a66] text-white rounded-tr-none"
                        : "bg-white border border-slate-200 rounded-tl-none text-slate-800"
                    )}>
                      {msg.isOfflineGenerated && (
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-2">
                          <WifiOff className="w-2.5 h-2.5 text-amber-700" />
                          Mesin Ahli SNI (Offline)
                        </div>
                      )}

                      <div className={cn(
                        "prose prose-xs max-w-none leading-relaxed",
                        msg.role === 'user' 
                          ? "prose-invert prose-p:leading-relaxed" 
                          : "prose-slate prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-[#0c3a66] prose-strong:text-[#0c3a66]"
                      )}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h3: ({ node, ...props }: any) => <h3 className="text-xs font-bold text-[#0c3a66] mb-2" {...props} />,
                            blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-amber-400 bg-amber-50/50 py-0.5 px-2.5 text-[11px] italic my-1.5" {...props} />,
                            code: ({ node, inline, ...props }: any) =>
                              inline
                                ? <code className="bg-slate-100 text-[#0c3a66] px-1 py-0.5 font-bold font-mono text-[10px] rounded" {...props} />
                                : <code className="block bg-slate-900 text-slate-100 p-2.5 my-2 text-[10px] font-mono rounded overflow-x-auto" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Actionable Suggestions Buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                            Aksi Terdeteksi:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.actions.map((act, actIdx) => (
                              <button
                                key={actIdx}
                                onClick={act.action}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0c3a66] text-[11px] font-bold rounded-md border border-blue-200 transition-colors shadow-2xs"
                                title={act.description}
                              >
                                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                {act.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta Bar: Timestamp & Copy */}
                    <div className={cn(
                      "flex items-center gap-2.5 text-[9px] text-slate-400 font-semibold px-1 uppercase tracking-wider",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Salin Pesan"
                        >
                          {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                          {copiedId === msg.id ? 'Tersalin' : 'Salin'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-2xs shrink-0">
                    <Bot className="w-3.5 h-3.5 text-[#0c3a66] animate-pulse" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 shadow-2xs">
                    <div className="w-1.5 h-1.5 bg-[#0c3a66] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-[#0c3a66] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-[#0c3a66] rounded-full animate-bounce" />
                    <span className="text-[10px] text-slate-400 font-bold ml-1">Menganalisis Kaidah SNI...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Suggestion Chips (Contextual) ── */}
          {suggestionChips.length > 0 && messages.length < 4 && (
            <div className="shrink-0 px-4 py-2.5 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-1.5 mb-2">
                {hasIssues ? <AlertTriangle className="w-3 h-3 text-amber-500" /> : <Info className="w-3 h-3 text-slate-400" />}
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Audit Cepat Parameter</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {suggestionChips.slice(0, 2).map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
                    disabled={isLoading}
                    className="text-left px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-[#0c3a66] transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-[#0c3a66] shrink-0" />
                      <span className="text-[11px] font-bold text-slate-700 group-hover:text-[#0c3a66] truncate">{chip.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input Area ── */}
          <div className="shrink-0 p-3 border-t border-slate-200 bg-white">
            {selectedImage && (
              <div className="mb-2 relative inline-block animate-in zoom-in duration-200">
                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300 shadow-xs" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:bg-rose-600 ring-2 ring-white"
                  title="Hapus Lampiran"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-300 focus-within:border-[#0c3a66] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0c3a66]/10 transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-lg text-slate-400 hover:text-[#0c3a66] hover:bg-slate-100 flex items-center justify-center transition-all shrink-0"
                title="Lampirkan Gambar"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />

              <textarea
                ref={inputRef}
                className="flex-1 bg-transparent border-none py-2 px-1 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-0 resize-none min-h-[38px] max-h-[100px] custom-scrollbar"
                rows={1}
                placeholder="Tanyakan analisis debit, neraca air, atau batasan SNI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                onClick={() => handleSend()}
                disabled={isLoading || !query.trim()}
                className="w-9 h-9 rounded-lg bg-[#0c3a66] hover:bg-[#082846] disabled:bg-slate-200 text-white flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-xs"
                title="Kirim Pertanyaan"
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mt-2 px-1">
              <span>RekaSDA AI Engine • SNI Compliant</span>
              {messages.length > 0 && (
                <button
                  onClick={clearMessages}
                  className="text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider font-bold"
                >
                  Bersihkan Chat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeyUpdated={() => setHasApiKey(!!getActiveGeminiApiKey())}
      />
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { consultHydrologistStream, getActiveGeminiApiKey } from '@/services/geminiService';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useAIContext } from '@/hooks/useAIContext';
import { useAIChatHistory } from './hooks/useAIChatHistory';
import { generateOfflineExpertAnalysis } from './services/offlineExpertEngine';
import { parseActionableSuggestions } from './utils/actionableParser';
import { ChatMessage } from './types/ai.types';
import { ApiKeyModal } from './components/ApiKeyModal';
import { toast } from '@/hooks/useToast';
import { 
  Bot, 
  User, 
  Send, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  BookOpen, 
  BrainCircuit, 
  X,
  Shield, 
  Zap, 
  Activity, 
  Sparkles,
  Copy,
  Check,
  Download,
  WifiOff,
  Key
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from 'recharts';

interface Props {
  lastContext: string;
  initialQuery?: string;
}

export const GeminiConsultant: React.FC<Props> = ({ lastContext, initialQuery }) => {
  const store = useHydrologyStore();
  const { messages, addMessage, clearMessages, exportChatToMarkdown } = useAIChatHistory();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!getActiveGeminiApiKey());
  
  const { systemContext, dataStatus, suggestionChips } = useAIContext('AI');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse, loading]);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      setQuery(initialQuery);
    }
  }, [initialQuery, messages.length]);

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

  const handleAsk = async (customPrompt?: string) => {
    const activeQuery = customPrompt || query.trim();
    if (!activeQuery || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: activeQuery,
      timestamp: new Date(),
      imageBase64: selectedImage || undefined
    };

    addMessage(userMsg);
    setQuery('');
    setSelectedImage(null);
    setLoading(true);
    setStreamingResponse('');

    let accumulatedText = '';

    try {
      await consultHydrologistStream(
        activeQuery,
        `${systemContext}\n\n[LAST INTERACTION CONTEXT]\n${lastContext}`,
        (chunk) => {
          accumulatedText += chunk;
          setStreamingResponse((prev) => prev + chunk);
        },
        selectedImage || undefined
      );

      if (!accumulatedText || accumulatedText.trim().length === 0 || accumulatedText.includes('kesalahan saat menghubungi layanan')) {
        throw new Error('Respon AI kosong atau terjadi gangguan konektivitas.');
      }

      const finalContent = accumulatedText;
      const actions = parseActionableSuggestions(finalContent, store);

      addMessage({
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined
      });
      
    } catch (error: any) {
      console.warn('API consultation failed, falling back to local expert engine:', error);
      
      // Fallback ke Offline Expert Engine yang berbasis SNI deterministik
      const offlineResult = generateOfflineExpertAnalysis(activeQuery, store);
      const offlineActions = parseActionableSuggestions(offlineResult.markdownAnswer, store);

      addMessage({
        id: `ai-offline-${Date.now()}`,
        role: 'assistant',
        content: offlineResult.markdownAnswer,
        timestamp: new Date(),
        actions: offlineActions.length > 0 ? offlineActions : undefined,
        isOfflineGenerated: true
      });

      toast.info('Koneksi AI online tidak tersedia. Menampilkan audit berbasis Engine Aturan SNI lokal.');
    } finally {
      setLoading(false);
      setStreamingResponse('');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat percakapan konsultasi?')) {
      clearMessages();
      toast.success('Riwayat percakapan telah dibersihkan.');
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

  const loadedCount = dataStatus.filter(d => d.isLoaded).length;
  const totalCount = dataStatus.length;
  const integrityPercentage = Math.round((loadedCount / totalCount) * 100);

  const chartData = [
    { name: 'Loaded', value: loadedCount, color: '#0ea5e9' },
    { name: 'Missing', value: Math.max(0, totalCount - loadedCount), color: '#f1f5f9' }
  ];

  return (
    <ModuleLayout
      title="Pusat Konsultasi AI Hidrologi"
      description="Asisten kecerdasan buatan terpadu & audit kepatuhan teknis SNI secara real-time"
      icon={<BrainCircuit className="w-6 h-6" />}
      iconColorClass="bg-indigo-600 text-white"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setApiKeyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Konfigurasi Kunci API Gemini Google"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Kunci API</span>
            <span className={cn(
              "w-2 h-2 rounded-full",
              hasApiKey ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-amber-400"
            )} title={hasApiKey ? 'Kunci API Gemini Terpasang' : 'Engine SNI Lokal'} />
          </button>

          {messages.length > 0 && (
            <>
              <button
                onClick={exportChatToMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
                title="Unduh Catatan Konsultasi dalam Format Markdown (.md)"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Export Notulen</span>
              </button>

              <button
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors"
                title="Hapus Seluruh Riwayat Chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Reset Chat</span>
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-230px)] min-h-[580px] relative z-10">
        
        {/* Left Sidebar: Data Integrity & Knowledge Base */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-black/5">
            <div className="px-5 py-4 bg-[#0c3a66] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-300" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">Integritas Data Sesi</span>
              </div>
              <div className="px-2 py-0.5 bg-sky-500/20 border border-sky-400/30 rounded text-[10px] font-bold text-sky-200">
                {integrityPercentage}%
              </div>
            </div>
            
            <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="h-32 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="100%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-slate-800">{loadedCount}/{totalCount}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Parameter Terisi</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {dataStatus.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.isLoaded ? "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" : "bg-slate-300"
                      )} />
                      <span className="text-[11px] font-bold text-slate-600 tracking-tight">{item.label}</span>
                    </div>
                    {item.isLoaded ? (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Terisi
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        Belum Diisi
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  Basis Standar SNI
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {['SNI 2415:2016', 'SNI 19-6728', 'Pd T-03-2005-A', 'SNI 03-2401', 'Permen PU 12/2014'].map(sni => (
                    <span key={sni} className="px-2 py-0.5 text-[9px] font-extrabold text-[#0c3a66] bg-blue-50/80 rounded border border-blue-200/80">
                      {sni}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold px-4">
              <span>RekaSDA AI Engine</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Siap Melayani
              </span>
            </div>
          </div>
        </div>

        {/* Right Chat Panel */}
        <div className="flex-1 flex flex-col bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative ring-1 ring-black/5">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
          
          {messages.length > 0 && (
            <div className="px-6 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0c3a66] flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none mb-0.5">Sesi Konsultasi</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ahli Madya Teknik Sumber Daya Air (AI)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hidden sm:inline">Konteks Aktif Tersinkronisasi</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto py-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500/10 blur-[50px] rounded-full scale-150" />
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center relative z-10 ring-1 ring-black/5">
                    <Sparkles className="w-10 h-10 text-[#0c3a66]" />
                  </div>
                  <div className="absolute -right-2 -top-2 w-8 h-8 bg-amber-400 rounded-lg shadow-md flex items-center justify-center z-20">
                    <Zap className="w-4 h-4 text-[#0c3a66]" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Konsultan Hidrologi <span className="text-[#0c3a66] italic">RekaSDA</span></h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-medium mb-8">
                  Asisten cerdas terintegrasi SNI untuk evaluasi debit banjir, neraca air wilayah, perancangan embung, dan dimensi saluran terbuka.
                </p>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestionChips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => handleAsk(chip.prompt)}
                      className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0c3a66] hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
                          <Activity className="w-3.5 h-3.5 text-[#0c3a66]" />
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold">Audit Cepat</span>
                      </div>
                      <span className="text-xs block font-bold text-slate-700 group-hover:text-[#0c3a66] transition-colors leading-snug">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3 group animate-in fade-in duration-300", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-200 transition-transform",
                  msg.role === 'user' ? "bg-[#0c3a66] text-white" : "bg-white text-[#0c3a66]"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={cn(
                  "max-w-[85%] space-y-2",
                  msg.role === 'user' ? "flex flex-col items-end" : "items-start"
                )}>
                  {msg.imageBase64 && (
                    <div className="relative group/img overflow-hidden rounded-xl border border-slate-200 shadow-md mb-2">
                      <img src={msg.imageBase64} alt="Query context" className="w-64 aspect-video object-cover" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-4 sm:p-5 rounded-2xl shadow-xs relative overflow-hidden transition-all",
                    msg.role === 'user' 
                      ? "bg-[#0c3a66] text-white rounded-tr-none" 
                      : "bg-white border border-slate-200 rounded-tl-none"
                  )}>
                    {msg.isOfflineGenerated && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-3">
                        <WifiOff className="w-3 h-3 text-amber-700" />
                        Engine Heuristik SNI (Offline)
                      </div>
                    )}

                    <div className={cn(
                      "prose prose-sm max-w-none relative z-10 leading-relaxed",
                      msg.role === 'user' ? "prose-invert" : "prose-slate"
                    )}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          h3: ({node, ...props}: any) => <h3 className="flex items-center gap-2 mb-3 text-[#0c3a66] font-extrabold text-sm" {...props} />,
                          blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-amber-400 bg-amber-50/50 py-1 px-3 text-xs italic my-2" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline 
                              ? <code className="bg-slate-100 text-[#0c3a66] px-1 py-0.5 rounded font-mono font-bold text-xs" {...props} />
                              : <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg my-2 text-[11px] font-mono overflow-x-auto" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Actionable Suggestions Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                          Tindakan Terkait Terdeteksi:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={act.action}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0c3a66] text-xs font-bold rounded-lg border border-blue-200 transition-colors shadow-2xs"
                              title={act.description}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              {act.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Meta & Action Bar */}
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold px-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider"
                        title="Salin Isi Jawaban"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedId === msg.id ? 'Tersalin' : 'Salin'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Live Streaming Bubble */}
            {streamingResponse && (
              <div className="flex gap-3 flex-row animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-lg bg-white text-[#0c3a66] border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="max-w-[85%] space-y-2">
                  <div className="p-4 sm:p-5 rounded-2xl shadow-xs bg-white border border-slate-200 rounded-tl-none">
                    <div className="prose prose-sm max-w-none prose-slate leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {streamingResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && !streamingResponse && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#0c3a66]">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex gap-1.5 px-4 py-2.5 bg-white rounded-full border border-slate-200 shadow-xs">
                  <div className="w-1.5 h-1.5 bg-[#0c3a66] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#0c3a66] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#0c3a66] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-400 font-bold ml-1">Menganalisis Kaidah SNI...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 z-30 shrink-0">
            {selectedImage && (
              <div className="mb-3 relative inline-block animate-in zoom-in duration-200">
                <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-slate-200 shadow-md" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 ring-2 ring-white"
                  title="Hapus Lampiran"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-300 focus-within:border-[#0c3a66] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0c3a66]/10 transition-all">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 shrink-0 text-slate-400 hover:text-[#0c3a66] hover:bg-slate-100 rounded-lg transition-all"
                title="Lampirkan Gambar Sketsa / Foto Lokasi"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
              
              <textarea
                ref={textareaRef}
                rows={1}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder="Konsultasi hasil perhitungan, audit batasan SNI, atau parameter..."
                className="flex-1 max-h-28 py-2.5 px-2 bg-transparent border-none focus:ring-0 text-xs font-semibold text-slate-800 placeholder:text-slate-400 resize-none custom-scrollbar"
              />

              <Button
                onClick={() => handleAsk()}
                disabled={loading || !query.trim()}
                className="h-10 px-4 rounded-lg bg-[#0c3a66] hover:bg-[#082846] text-white font-bold text-xs shrink-0 shadow-xs transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline mr-1.5">Konsultasi</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-2">
              Brain Engine Terpadu • Berstandar SNI 2415 & Kaidah Rekayasa SDA
            </p>
          </div>
        </div>

      </div>

      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        onKeyUpdated={() => setHasApiKey(!!getActiveGeminiApiKey())}
      />
    </ModuleLayout>
  );
};

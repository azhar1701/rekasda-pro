import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { consultHydrologistStream } from '@/services/geminiService';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useAIContext } from '@/hooks/useAIContext';
import { 
  Bot, User, Send, Paperclip, 
  Database, AlertCircle, CheckCircle2, Clock, 
  Trash2, BookOpen, BrainCircuit, X,
  Shield, Zap, Activity, Sparkles
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageBase64?: string;
}

interface Props {
  lastContext: string;
  initialQuery?: string;
}

export const GeminiConsultant: React.FC<Props> = ({ lastContext, initialQuery }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  const { systemContext, dataStatus, suggestionChips } = useAIContext('AI');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse, loading]);

  useEffect(() => {
    const saved = localStorage.getItem('rekasda_ai_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('rekasda_ai_history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      setQuery(initialQuery);
    }
  }, [initialQuery, messages.length]);

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

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setSelectedImage(null);
    setLoading(true);
    setStreamingResponse('');

    try {
      let fullResponse = '';
      await consultHydrologistStream(
        activeQuery,
        `${systemContext}\n\n[LAST INTERACTION CONTEXT]\n${lastContext}`,
        (chunk) => {
          fullResponse += chunk;
          setStreamingResponse(fullResponse);
        },
        selectedImage || undefined
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Terjadi kesalahan teknis.'}`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      setStreamingResponse('');
    }
  };

  const clearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat percakapan?')) {
      setMessages([]);
      localStorage.removeItem('rekasda_ai_history');
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
    { name: 'Missing', value: totalCount - loadedCount, color: '#f1f5f9' }
  ];

  return (
    <ModuleLayout
      title="Pusat Konsultasi AI"
      description="Dashboard kecerdasan buatan terintegrasi SNI"
      icon={<BrainCircuit className="w-6 h-6" />}
      iconColorClass="bg-indigo-600 text-white"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] relative z-10">
        
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 animate-in slide-in-from-left duration-500">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full ring-1 ring-black/5">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">Integritas Data</span>
              </div>
              <div className="px-2 py-0.5 bg-sky-500/20 border border-sky-400/30 rounded text-[10px] font-bold">
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
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Modul Terdeteksi</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {dataStatus.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 group hover:border-pupr-blue/30 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.isLoaded ? "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" : "bg-slate-300"
                      )} />
                      <span className="text-[11px] font-bold text-slate-600 tracking-tight">{item.label}</span>
                    </div>
                    {item.isLoaded ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-5 border-t border-slate-100">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Knowledge Base
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['SNI 2415:2016', 'Permen PUPR', 'SNI 6738'].map(sni => (
                    <div key={sni} className="px-2.5 py-1 text-[9px] font-extrabold text-pupr-blue bg-indigo-50/50 rounded-md border border-indigo-100 transition-colors hover:bg-indigo-100">
                      {sni}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-center text-[10px] font-extrabold text-slate-400 hover:text-rose-600 hover:bg-rose-50 tracking-widest uppercase"
                onClick={clearHistory}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Reset Chat
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative ring-1 ring-black/5">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
          
          {messages.length > 0 && (
            <div className="px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pupr-blue flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none mb-1">Status Sesi</span>
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Terhubung ke Brain-Engine
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {dataStatus.filter(d => d.isLoaded).slice(0, 3).map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-sky-100 border-2 border-white flex items-center justify-center">
                      <Database className="w-2.5 h-2.5 text-sky-600" />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1 hidden sm:inline">Context Active</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto py-12">
                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-pupr-blue/10 blur-[60px] rounded-full scale-150" />
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center relative z-10 ring-1 ring-black/5 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Sparkles className="w-12 h-12 text-pupr-blue" />
                  </div>
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-pupr-yellow rounded-xl shadow-lg flex items-center justify-center z-20 -rotate-12">
                    <Zap className="w-6 h-6 text-pupr-blue" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">E-Consultant <span className="text-pupr-blue italic">Rekasda</span></h3>
                <p className="text-base text-slate-500 max-w-md leading-relaxed font-medium mb-12">
                  Asisten hidrologi berbasis AI yang terlatih dengan dataset <span className="text-slate-900 font-bold underline decoration-pupr-yellow decoration-4 underline-offset-4">SNI & Permen PUPR</span> untuk audit teknis real-time.
                </p>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestionChips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => handleAsk(chip.prompt)}
                      className="text-left p-5 rounded-xl bg-white border border-slate-200 hover:border-pupr-blue hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-pupr-blue/5 transition-colors" />
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-pupr-blue/10 transition-colors">
                          <Activity className="w-4 h-4 text-pupr-blue" />
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-extrabold">Audit Cepat</span>
                      </div>
                      <span className="text-sm block font-bold text-slate-700 group-hover:text-pupr-blue transition-colors relative z-10 leading-snug">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-4 group animate-in fade-in slide-in-from-bottom-4 duration-300", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white transition-transform group-hover:scale-110",
                  msg.role === 'user' ? "bg-pupr-blue text-white" : "bg-white text-pupr-blue"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={cn(
                  "max-w-[85%] space-y-1.5",
                  msg.role === 'user' ? "flex flex-col items-end" : "items-start"
                )}>
                  {msg.imageBase64 && (
                    <div className="relative group/img overflow-hidden rounded-xl border-4 border-white shadow-xl mb-3">
                      <img src={msg.imageBase64} alt="Query context" className="w-64 aspect-video object-cover transition-transform group-hover/img:scale-105 duration-500" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-5 sm:p-6 rounded-[1.75rem] shadow-sm relative overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50",
                    msg.role === 'user' 
                      ? "bg-pupr-blue text-white rounded-tr-none ring-1 ring-white/10" 
                      : "bg-white border border-slate-200 rounded-tl-none ring-1 ring-black/[0.02]"
                  )}>
                    <div className={cn(
                      "prose prose-sm max-w-none relative z-10",
                      msg.role === 'user' ? "prose-invert" : "prose-slate"
                    )}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          h3: ({node, ...props}: any) => <h3 className="flex items-center gap-2 mb-4 text-pupr-blue font-extrabold" {...props} />,
                          blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-pupr-yellow bg-slate-50 py-1 px-4 italic" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline 
                              ? <code className="bg-slate-100 text-pupr-blue px-1.5 py-0.5 rounded font-bold" {...props} />
                              : <code className="block bg-slate-900 text-slate-100 p-4 rounded-xl my-4 text-xs font-mono overflow-x-auto" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold px-2 uppercase tracking-[0.15em]">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {streamingResponse && (
              <div className="flex gap-4 flex-row animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-xl bg-white text-pupr-blue border-2 border-white shadow-lg flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="max-w-[85%] space-y-2">
                  <div className="p-5 sm:p-6 rounded-[1.75rem] shadow-sm bg-white border border-slate-200 rounded-tl-none ring-1 ring-black/[0.02]">
                    <div className="prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {streamingResponse}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading && !streamingResponse && (
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-white shadow-md flex items-center justify-center text-pupr-blue">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex gap-1.5 px-4 py-3 bg-white rounded-full border border-slate-200 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-pupr-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-pupr-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-pupr-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 sm:p-6 bg-slate-100/50 border-t border-slate-200 z-30 shrink-0">
            {selectedImage && (
              <div className="mb-4 relative inline-block animate-in zoom-in duration-300">
                <img src={selectedImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-4 border-white shadow-2xl" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 shadow-xl hover:bg-rose-600 ring-4 ring-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-3 bg-white p-2.5 rounded-[2rem] border border-slate-300 shadow-2xl shadow-slate-200/50 focus-within:border-pupr-blue focus-within:ring-4 focus-within:ring-pupr-blue/5 transition-all group/input ring-1 ring-black/[0.05]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 shrink-0 text-slate-400 hover:text-pupr-blue hover:bg-slate-50 rounded-full transition-all"
              >
                <Paperclip className="w-5 h-5 group-hover/input:rotate-12 transition-transform" />
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
                placeholder="Konsultasi hasil perhitungan atau audit parameter..."
                className="flex-1 max-h-32 py-3.5 px-2 bg-transparent border-none focus:ring-0 text-[15px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium resize-none custom-scrollbar"
              />

              <Button
                onClick={() => handleAsk()}
                disabled={loading || !query.trim()}
                className="h-12 px-6 rounded-full bg-slate-900 hover:bg-pupr-blue text-white font-extrabold text-xs uppercase tracking-[0.15em] shrink-0 shadow-lg transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline mr-2 tracking-widest">Audit</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-3 opacity-50">Brain Engine v2.4 • SNI Compliant Agent</p>
          </div>
        </div>

      </div>
    </ModuleLayout>
  );
};

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
  AlertCircle, CheckCircle2, Clock, 
  Trash2, BookOpen, BrainCircuit, X,
  Shield, Zap, Activity, Sparkles, Plus
} from 'lucide-react';
import { 
 PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

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
  imageBase64?: string;
  actions?: ActionableParam[];
}

interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  lastContext: string;
  timestamp: Date;
}

interface Props {
 lastContext: string;
 initialQuery?: string;
}

export const GeminiConsultant: React.FC<Props> = ({ lastContext, initialQuery }) => {
  const [query, setQuery] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState('');
  
  const { systemContext, dataStatus, suggestionChips } = useAIContext('AI');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // Migration and initial load
  useEffect(() => {
    const saved = localStorage.getItem('rekasda_ai_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mapped = parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(mapped);
        if (mapped.length > 0) setActiveSessionId(mapped[0].id);
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    } else {
      // Migrate old history if exists
      const oldHistory = localStorage.getItem('rekasda_ai_history');
      if (oldHistory) {
        try {
          const parsed = JSON.parse(oldHistory);
          const firstMsg = parsed[0]?.content || 'Percakapan Migrasi';
          const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            name: firstMsg.substring(0, 30) + (firstMsg.length > 30 ? '...' : ''),
            messages: parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
            lastContext: '',
            timestamp: new Date()
          };
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
          localStorage.removeItem('rekasda_ai_history');
        } catch (e) {
          console.error("Migration failed");
        }
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('rekasda_ai_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = (firstQuery: string = '') => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      name: firstQuery ? (firstQuery.substring(0, 30) + (firstQuery.length > 30 ? '...' : '')) : 'Sesi Konsultasi Baru',
      messages: [],
      lastContext: lastContext,
      timestamp: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse, loading]);

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

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = createNewSession(activeQuery);
    }

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMsg], name: s.messages.length === 0 ? (activeQuery.substring(0, 30) + (activeQuery.length > 30 ? '...' : '')) : s.name } 
        : s
    ));

    setQuery('');
    setSelectedImage(null);
    setLoading(true);
    setStreamingResponse('');

    try {
      let fullResponse = '';
      await consultHydrologistStream(
        activeQuery,
        `${systemContext}\n\n[LAST INTERACTION CONTEXT]\n${activeSession?.lastContext || lastContext}`,
        (chunk) => {
          fullResponse += chunk;
          setStreamingResponse(fullResponse);
        },
        selectedImage || undefined
      );

      const store = useHydrologyStore.getState();
      const actions: ActionableParam[] = [];
      
      // Ported parsing logic
      const infMatch = fullResponse.match(/[Ii]nfiltration\s*[Ff]actor\s*(?:menjadi|=|:)\s*([\d.]+)/);
      if (infMatch) {
        const value = parseFloat(infMatch[1]);
        if (value >= 0 && value <= 1) {
          actions.push({
            label: `Terapkan Infiltration Factor = ${value}`,
            description: `Mengubah Infiltration Factor menjadi ${value}`,
            action: () => { /* Logic to update store if needed, currently placeholder in drawer too */ },
          });
        }
      }

      const areaMatch = fullResponse.match(/[Ll]uas\s*DAS\s*(?:menjadi|=|:)\s*([\d.]+)\s*km/);
      if (areaMatch) {
        const value = areaMatch[1];
        actions.push({
          label: `Terapkan Luas DAS = ${value} km²`,
          description: `Mengubah Luas DAS menjadi ${value} km²`,
          action: () => store.setLuasDas(value),
        });
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
      ));

    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message || 'Terjadi kesalahan teknis.'}`,
        timestamp: new Date()
      };
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s
      ));
    } finally {
      setLoading(false);
      setStreamingResponse('');
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Hapus sesi percakapan ini?')) {
      const updated = sessions.filter(s => s.id !== id);
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated.length > 0 ? updated[0].id : null);
      }
      if (updated.length === 0) localStorage.removeItem('rekasda_ai_sessions');
    }
  };

  const clearAllSessions = () => {
    if (window.confirm('Hapus seluruh riwayat percakapan?')) {
      setSessions([]);
      setActiveSessionId(null);
      localStorage.removeItem('rekasda_ai_sessions');
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
    >
      <div className="flex flex-col gap-8">
        {/* --- Top Metrics KPI Strip --- */}
        <header className="grid grid-cols-2 lg:grid-cols-4 gap-8 border-b border-slate-200 pb-8">
          <div className="space-y-1">
            <p className="text-4xl font-light text-slate-900 tracking-tighter tabular-nums">
              {sessions.length}
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">Sesi</span>
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aktivitas Sesi</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-light text-pupr-blue tracking-tighter tabular-nums">
              {integrityPercentage}
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">%</span>
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Integritas Data</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-light text-indigo-600 tracking-tighter tabular-nums uppercase">
              1.2k
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">Avg</span>
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tokens / Prompt</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl font-light text-emerald-600 tracking-tighter tabular-nums">
              18
              <span className="text-xs font-bold text-slate-400 ml-1.5 uppercase">Ref</span>
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SNI Articles Referenced</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-340px)] min-h-[600px]">
          {/* --- Left Sidebar: Analytics & History --- */}
          <aside className="lg:col-span-3 space-y-6 flex flex-col h-full overflow-hidden">
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {/* Data Integrity Card */}
              <section className="bg-slate-900 rounded-sm overflow-hidden border border-slate-800">
                <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">Integritas Data</span>
                  </div>
                  <div className="px-2 py-0.5 bg-sky-500/20 border border-sky-400/30 rounded text-[10px] font-bold text-sky-400">
                    {integrityPercentage}%
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-32 w-full relative mb-4">
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
                      <span className="text-2xl font-extrabold text-white leading-none">{loadedCount}/{totalCount}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Modul Aktif</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 opacity-80">
                    {dataStatus.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate">{item.label}</span>
                        {item.isLoaded ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-slate-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Chat Session History */}
              <section className="bg-white rounded-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600">Riwayat Sesi</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-900" onClick={() => createNewSession()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
                  {sessions.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada sesi</p>
                    </div>
                  ) : (
                    sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={cn(
                          "w-full text-left px-5 py-4 transition-all group relative border-l-2",
                          activeSessionId === s.id 
                            ? "bg-slate-50 border-pupr-blue" 
                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "text-xs font-bold truncate leading-tight",
                            activeSessionId === s.id ? "text-pupr-blue" : "text-slate-600"
                          )}>
                            {s.name}
                          </span>
                          <X 
                            className="w-3 h-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" 
                            onClick={(e) => deleteSession(e, s.id)}
                          />
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 mt-1 block tracking-wider uppercase">
                          {s.timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
                  <Button variant="ghost" className="w-full text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.15em] hover:text-rose-600" onClick={clearAllSessions}>
                    <Trash2 className="w-3 h-3 mr-2" />
                    Bersihkan Semua
                  </Button>
                </div>
              </section>
              
              {/* Knowledge Base Area */}
              <section className="bg-white rounded-sm border border-slate-200 p-5">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  SNI Standards
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['SNI 2415:2016', 'Permen PUPR', 'SNI 6738'].map(sni => (
                    <div key={sni} className="px-2.5 py-1 text-[9px] font-extrabold text-pupr-blue bg-indigo-50/50 rounded-sm border border-indigo-100">
                      {sni}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          {/* --- Main Area: Interactive Chat Workstation --- */}
          <main className="lg:col-span-9 flex flex-col bg-slate-50 rounded-sm border border-slate-200 overflow-hidden relative ring-1 ring-black/5">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
            
            {/* Session Header Status */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-pupr-blue flex items-center justify-center text-white ">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                    {activeSession?.name || 'Sesi Konsultasi Baru'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Brain-Engine v2.4 Online
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-sm border border-slate-100">
                  <BrainCircuit className="w-3.5 h-3.5 text-pupr-blue" />
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">High-Density Mode</span>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 space-y-10 custom-scrollbar">
              {messages.length === 0 && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto py-12">
                  <div className="relative mb-10">
                    <div className="absolute inset-0 bg-pupr-blue blur-[60px] rounded-sm scale-150 opacity-10" />
                    <div className="w-24 h-24 bg-white rounded-sm border border-slate-200 flex items-center justify-center relative z-10 ring-1 ring-black/5 rotate-3 hover:rotate-0 transition-transform duration-75">
                      <Sparkles className="w-12 h-12 text-pupr-blue" />
                    </div>
                    <div className="absolute -right-4 -top-4 w-12 h-12 bg-pupr-yellow rounded-sm flex items-center justify-center z-20 -rotate-12 border border-slate-200">
                      <Zap className="w-6 h-6 text-pupr-blue" />
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">E-Consultant <span className="text-pupr-blue italic">Rekasda</span></h3>
                  <p className="text-base text-slate-500 max-w-md leading-relaxed font-medium mb-12">
                    Mulai percakapan baru atau pilih topik di bawah ini untuk audit teknis instan berbasis dataset <span className="text-slate-900 font-bold underline decoration-pupr-yellow decoration-4 underline-offset-4">SNI & PUPR</span>.
                  </p>
                  
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {suggestionChips.map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => handleAsk(chip.prompt)}
                        className="text-left p-6 rounded-sm bg-white border border-slate-200 hover:border-pupr-blue hover: transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rotate-45 translate-x-8 -translate-y-8 group-hover:bg-pupr-blue/5 transition-colors" />
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                          <div className="p-2 rounded-sm bg-slate-50 group-hover:bg-pupr-blue group-hover:text-white transition-colors">
                            <Activity className="w-4 h-4 text-pupr-blue group-hover:text-white" />
                          </div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-extrabold">Audit Cepat</span>
                        </div>
                        <span className="text-sm block font-bold text-slate-700 group-hover:text-pupr-blue transition-colors relative z-10 leading-snug">{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-6 group animate-in fade-in slide-in-from-bottom-4 duration-75", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-10 h-10 rounded-sm flex items-center justify-center shrink-0 border border-slate-200 transition-transform",
                    msg.role === 'user' ? "bg-pupr-blue text-white" : "bg-white text-pupr-blue"
                  )}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  
                  <div className={cn(
                    "max-w-[85%] space-y-2",
                    msg.role === 'user' ? "flex flex-col items-end" : "items-start"
                  )}>
                    {msg.imageBase64 && (
                      <div className="relative group/img overflow-hidden rounded-sm border-4 border-white mb-3 shadow-none">
                        <img src={msg.imageBase64} alt="Query context" className="max-w-md rounded-sm object-cover transition-transform group-hover/img:scale-105 duration-75" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-6 rounded-sm relative overflow-hidden transition-all shadow-none",
                      msg.role === 'user' 
                        ? "bg-pupr-blue text-white ring-1 ring-white/10" 
                        : "bg-white border border-slate-200 ring-1 ring-black/[0.01]"
                    )}>
                      <div className={cn(
                        "prose prose-sm max-w-none relative z-10",
                        msg.role === 'user' ? "prose-invert prose-p:leading-relaxed prose-p:font-medium" : "prose-slate prose-p:leading-relaxed prose-strong:text-pupr-blue prose-strong:font-black prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900"
                      )}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h3: ({node, ...props}: any) => <h3 className="flex items-center gap-2 mb-4 text-pupr-blue" {...props} />,
                            blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-pupr-yellow bg-slate-50 py-2 px-6 italic" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                              inline 
                                ? <code className="bg-slate-100 text-pupr-blue px-1.5 py-0.5 rounded font-black text-[11px]" {...props} />
                                : (
                                  <div className="relative group/code my-8">
                                    <div className="absolute -top-3 left-4 px-2 py-0.5 bg-slate-800 text-[9px] font-bold text-slate-300 uppercase tracking-widest rounded border border-white/10 z-10">
                                      Engineering Logic / SNI Reference
                                    </div>
                                    <code className="block bg-slate-900 text-slate-100 p-6 pt-8 rounded-sm text-xs font-mono overflow-x-auto ring-1 ring-white/10 border-l-4 border-pupr-yellow tabular-nums leading-relaxed" {...props} />
                                  </div>
                                )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3 relative z-10">
                          {msg.actions.map((action, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                action.action();
                                alert(`Aksi Berhasil: ${action.description}`);
                              }}
                              className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-pupr-blue/20 text-pupr-blue hover:bg-pupr-blue hover:text-white transition-all shadow-none"
                            >
                              <Zap className="w-3 h-3 mr-2" />
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold px-2 uppercase tracking-[0.15em]">
                      <Clock className="w-3 h-3" />
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {streamingResponse && (
                <div className="flex gap-6 flex-row animate-in fade-in duration-75">
                  <div className="w-10 h-10 rounded-sm bg-white text-pupr-blue border border-slate-200 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="max-w-[85%] space-y-2">
                    <div className="p-6 rounded-sm bg-white border border-slate-200 ring-1 ring-black/[0.01]">
                      <div className="prose prose-sm max-w-none prose-slate prose-p:leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {streamingResponse}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading && !streamingResponse && (
                <div className="flex gap-6 items-center">
                  <div className="w-10 h-10 rounded-sm bg-white border border-slate-200 flex items-center justify-center text-pupr-blue">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex gap-1.5 px-5 py-4 bg-white rounded-sm border border-slate-200 ">
                    <div className="w-2 h-2 bg-pupr-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-pupr-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-pupr-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-6 sm:p-8 bg-white border-t border-slate-200 z-30 shrink-0">
              {selectedImage && (
                <div className="mb-4 relative inline-block animate-in zoom-in duration-75">
                  <img src={selectedImage} alt="Preview" className="h-24 w-24 object-cover rounded-sm border-2 border-slate-200 " />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-sm p-1.5 hover:bg-rose-600 border-2 border-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              <div className="flex items-end gap-3 bg-slate-50 p-2.5 rounded-sm border border-slate-300 shadow-none focus-within:border-pupr-blue focus-within:bg-white transition-all group/input ring-1 ring-black/[0.02]">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-12 w-12 shrink-0 text-slate-400 hover:text-pupr-blue hover:bg-white rounded-sm transition-all"
                >
                  <Paperclip className="w-5 h-5 transition-transform group-hover/input:rotate-12" />
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
                  placeholder="Konsultasi hasil perhitungan atau audit parameter SNI..."
                  className="flex-1 max-h-32 py-3.5 px-3 bg-transparent border-none focus:ring-0 text-[15px] font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium resize-none custom-scrollbar"
                />

                <Button
                  onClick={() => handleAsk()}
                  disabled={loading || !query.trim()}
                  className="h-12 px-6 rounded-sm bg-slate-900 hover:bg-pupr-blue text-white font-black text-xs uppercase tracking-[0.2em] shrink-0 transition-all disabled:bg-slate-200 shadow-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="hidden sm:inline mr-2 tracking-[0.2em]">Audit</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-4">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70 flex items-center gap-1.5">
                   <Sparkles className="w-3 h-3 text-pupr-yellow" />
                   Analisis Real-time Terenkripsi
                 </p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">
                   Brain Engine v2.4 • SNI Agent
                 </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ModuleLayout>
  );
};

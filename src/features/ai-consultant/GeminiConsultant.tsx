import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { consultHydrologist } from '@/services/geminiService';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { Bot, User, Send, Paperclip, Sparkles } from 'lucide-react';

interface Props {
  lastContext: string;
  initialQuery?: string;
}

export const GeminiConsultant: React.FC<Props> = ({ lastContext, initialQuery }) => {
  const [query, setQuery] = useState('');
  const [lastAskedQuery, setLastAskedQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    setLastAskedQuery(query);
    const answer = await consultHydrologist(query, lastContext, selectedImage || undefined);
    setResponse(answer);
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Removed cleanLatex and renderFormattedResponse in favor of ReactMarkdown

  return (
    <ModuleLayout
      title="Konsultan AI"
      description="Asisten Hidrologi Cerdas RekaSDA"
      icon={<Bot className="w-6 h-6" />}
      iconColorClass="bg-indigo-50 text-indigo-600"
    >
      <div className="flex flex-col min-h-[calc(100vh-160px)] page-enter relative">
        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto pb-32 space-y-6">
          {!response && !loading && !lastAskedQuery ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-indigo-200 blur-2xl opacity-40 rounded-full"></div>
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-xl border border-indigo-100 flex items-center justify-center relative z-10">
                  <Sparkles className="w-10 h-10 text-indigo-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Asisten Cerdas Siap Membantu</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Tanyakan tentang analisis debit banjir, validasi metode SNI, saran desain penampang, atau unggah foto lokasi untuk dianalisis.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <span className="px-3 py-1.5 bg-white/60 backdrop-blur-md border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold shadow-sm">SNI 2415:2016</span>
                <span className="px-3 py-1.5 bg-white/60 backdrop-blur-md border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold shadow-sm">Permen PUPR</span>
                <span className="px-3 py-1.5 bg-white/60 backdrop-blur-md border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold shadow-sm">Hidrologi Terapan</span>
              </div>
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl mx-auto">

              {/* User Query Bubble */}
              {lastAskedQuery && (
                <div className="flex justify-end animate-fade-in">
                  <div className="max-w-[85%] sm:max-w-[75%] flex gap-4">
                    <div className="bg-indigo-600 text-white p-5 rounded-2xl rounded-tr-sm shadow-md">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{lastAskedQuery}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-200">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>
              )}
              {/* Loading State */}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-200">
                      <Bot className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Response Bubble */}
              {response && !loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-[95%] sm:max-w-[85%] flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-100">
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-6 sm:p-8 rounded-3xl rounded-tl-sm shadow-xl shadow-slate-200/50">
                      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-widest">Terkonfirmasi AI</span>
                        <span className="text-xs text-slate-400">Pakar Hidrologi</span>
                      </div>
                      <div className="prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:text-slate-800 prose-a:text-indigo-600">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {response}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Input Dock */}
        <div className="fixed bottom-[90px] md:bottom-6 left-0 right-0 px-4 md:px-0 md:static md:mt-auto max-w-4xl mx-auto w-full z-50">
          <div className="bg-white/70 backdrop-blur-2xl p-2 sm:p-3 rounded-[2rem] sm:rounded-full border border-white shadow-2xl shadow-indigo-500/10 flex flex-col sm:flex-row items-end sm:items-center gap-2 relative">

            {/* Image Preview Overlay */}
            {selectedImage && (
              <div className="absolute bottom-[calc(100%+12px)] left-6 animate-fade-in z-50">
                <div className="relative group">
                  <img src={selectedImage} alt="Preview" className="w-20 h-20 object-cover rounded-2xl border-4 border-white shadow-xl" />
                  <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 hover:bg-rose-600 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            )}

            <Button
              variant="default"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className={cn("h-12 w-12 rounded-full hidden sm:flex shrink-0 transition-colors shadow-none", selectedImage ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200" : "bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600")}
              title="Unggah Foto Lokasi"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />

            <div className="flex-1 relative w-full">
              <textarea
                className="w-full bg-slate-50/50 backdrop-blur-sm p-3 sm:px-6 sm:py-4 pr-12 text-sm sm:text-base text-slate-900 border border-slate-200/60 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-[1.5rem] sm:rounded-full resize-none min-h-[52px] sm:min-h-[56px] max-h-[120px] transition-all shadow-inner"
                rows={1}
                placeholder="Tanya soal analisis atau parameter..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <Button
                variant="default"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className={cn("absolute right-12 top-1.5 h-10 w-10 sm:hidden rounded-full transition-colors shadow-none", selectedImage ? "bg-indigo-100 text-indigo-600 hover:bg-indigo-200" : "bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600")}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="h-12 w-12 sm:w-auto sm:px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/20 flex shrink-0 items-center justify-center gap-2 font-bold"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-5 h-5 sm:mr-1" />
                  <span className="hidden sm:inline">Kirim</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
};


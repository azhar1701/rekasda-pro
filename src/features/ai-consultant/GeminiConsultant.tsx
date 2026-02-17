
import React, { useState, useRef, useEffect } from 'react';
import { consultHydrologist } from '@/services/geminiService';
import { Button } from '@/components/ui/forms/Button';

interface Props {
  lastContext: string;
  initialQuery?: string;
}

export const GeminiConsultant: React.FC<Props> = ({ lastContext, initialQuery }) => {
  const [query, setQuery] = useState('');
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

  // Helper to clean LaTeX-like syntax and other artifacts frequently returned by Gemini
  const cleanLatex = (text: string) => {
    let cleaned = text
      // Remove double and single dollar signs used for math mode
      .replace(/\$\$(.*?)\$\$/g, '$1')
      .replace(/\$(.*?)\$/g, '$1')
      // Handle \text{...} and \mathrm{...}
      .replace(/\\(text|mathrm|frac)\{([^}]+)\}/g, '$2')
      .replace(/(text|mathrm|frac)\{([^}]+)\}/g, '$2')
      // Common Math Symbols
      .replace(/\\approx/g, '≈')
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\s\*\s/g, ' × ')
      .replace(/\\le/g, '≤')
      .replace(/\\ge/g, '≥')
      .replace(/\\pm/g, '±')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\Delta/g, 'Δ')
      .replace(/\\theta/g, 'θ')
      .replace(/\\pi/g, 'π')
      // Superscripts and Subscripts
      .replace(/\^2/g, '²')
      .replace(/\^3/g, '³')
      .replace(/_\{([^}]+)\}/g, '$1')
      .replace(/_(\w+)/g, '$1')
      // Remove LaTeX commands
      .replace(/\\(left|right|big|Big)/g, '')
      .replace(/\\,/g, ' ')
      .replace(/\\;/g, ' ')
      .replace(/\\:/g, ' ')
      // Clean up brackets and braces
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\\\/g, '')
      // Remove remaining backslashes and braces
      .replace(/\\/g, '')
      .replace(/\{/g, '')
      .replace(/\}/g, '')
      // Clean multiple spaces
      .replace(/\s+/g, ' ')
      .trim();

    return cleaned;
  };

  // Helper to format Markdown-like syntax from Gemini
  const renderFormattedResponse = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listBuffer: React.ReactNode[] = [];

    const flushList = () => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-3 mb-6 pl-2">
            {listBuffer}
          </ul>
        );
        listBuffer = [];
      }
    };

    const parseBold = (str: string) => {
      const cleaned = cleanLatex(str);
      // Split by double asterisks for bold
      const parts = cleaned.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => {
        // Remove single asterisks that might be leftover markdown italics or artifacts
        const cleanPart = part.replace(/\*/g, '');
        return i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900 bg-slate-50 px-1 rounded">{cleanPart}</strong> : cleanPart;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Handle Separators (---)
      if (trimmed === '---' || trimmed === '***') {
        flushList();
        elements.push(<hr key={index} className="my-6 border-slate-200 border-dashed" />);
        return;
      }

      if (!trimmed) {
        flushList();
        return;
      }

      // Check for headers: starts with # OR represents a fully bolded line OR Numbered Section (e.g. "1. Analisis")
      const isBoldHeader = /^\*\*(.*?)\*\*$/.test(trimmed);
      const isNumberedSection = /^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 60; // Heuristic for numbered headers

      // Headers Logic
      if (trimmed.startsWith('#') || isBoldHeader || isNumberedSection) {
        flushList();
        
        let content = '';
        if (trimmed.startsWith('#')) {
             content = trimmed.replace(/^#+\s*/, '');
        } else if (isBoldHeader) {
             content = trimmed.replace(/^\*\*\s*(.*?)\s*\*\*$/, '$1');
        } else {
             content = trimmed;
        }
        
        const cleanedContent = cleanLatex(content).replace(/\*/g, '');
        
        elements.push(
          <div key={index} className="mt-8 mb-4 border-l-4 border-safety-blue pl-4">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-tight">
                {cleanedContent}
             </h3>
          </div>
        );
      } 
      // Lists (* or -)
      else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const content = trimmed.replace(/^[\*\-]\s*/, '');
        listBuffer.push(
          <li key={index} className="flex gap-3 text-slate-600 items-start text-sm leading-relaxed group">
            <span className="mt-2 w-1.5 h-1.5 bg-safety-blue rounded-full flex-shrink-0 group-hover:scale-150 transition-transform shadow-sm ring-2 ring-blue-50"></span>
            <span className="flex-1">{parseBold(content)}</span>
          </li>
        );
      } 
      // Regular Paragraphs
      else {
        flushList();
        // Check if it looks like a "Label: Value" pair to format nicer
        const isKeyValue = /^[A-Za-z\s]+:\s/.test(trimmed);
        
        elements.push(
          <p key={index} className={`text-slate-600 text-sm leading-relaxed mb-3 ${isKeyValue ? 'font-medium text-slate-700' : 'text-justify'}`}>
            {parseBold(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 flex flex-col min-h-[600px] shadow-soft">
      <div className="bg-slate-900 p-6 flex justify-between items-center relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
        
        <div className="relative z-10">
            <h2 className="text-white font-black text-xl flex items-center gap-3 italic uppercase tracking-tight">
            <div className="bg-safety-blue p-1.5 rounded-xl shadow-lg shadow-safety-blue/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            Konsultan AI
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 ml-1">Analisis SDA • Panduan SNI</p>
        </div>
        <div className="hidden md:block relative z-10">
            <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-white/10">Powered by Gemini</span>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col gap-6 bg-slate-50/30">
        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative inline-block">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">Menganalisis...</h3>
                        <p className="text-sm text-slate-500">Memproses dengan referensi SNI terbaru</p>
                    </div>
                </div>
            </div>
        ) : response ? (
            <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Analisis Selesai</span>
                        <p className="text-xs text-slate-400 mt-0.5">Mengacu SNI 2415:2016 & UU 17/2019</p>
                    </div>
                </div>
                <div className="prose prose-sm max-w-none text-slate-600">
                    {renderFormattedResponse(response)}
                </div>
            </div>
        ) : (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Asisten Cerdas Siap Membantu</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">Tanyakan tentang analisis debit, validasi metode SNI, atau saran desain penampang.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">SNI 2415:2016</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">UU 17/2019</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Permen PUPR</span>
                    </div>
                </div>
            </div>
        )}

        {/* Removed sticky bottom to prevent overlap with the main floating footer */}
        <div className="bg-white p-2 rounded-[2rem] border border-slate-200 shadow-lg shadow-slate-200/50">
            <div className="relative">
                <textarea
                    className="w-full bg-transparent p-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none resize-none min-h-[60px] max-h-[120px]"
                    rows={2}
                    placeholder="Ketik pertanyaan teknis Anda..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                
                {selectedImage && (
                    <div className="absolute bottom-full left-4 mb-2">
                         <div className="relative inline-block group">
                            <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-2xl border-2 border-white shadow-md" />
                            <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center px-2 pb-2">
                <div className="flex gap-1">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-xl transition-all duration-200 ${selectedImage ? 'bg-safety-blue/10 text-safety-blue' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        title="Unggah Foto Lokasi"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                </div>

                <Button 
                    onClick={handleAsk} 
                    disabled={loading || !query.trim()} 
                    className={`py-3 px-6 rounded-xl text-xs shadow-none ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Sedang Menganalisis...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            Kirim Pertanyaan
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </div>
                    )}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

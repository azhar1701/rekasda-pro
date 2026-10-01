import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Trash2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { toast } from '@/hooks/useToast';
import { 
  getActiveGeminiApiKey, 
  setActiveGeminiApiKey, 
  testGeminiConnection 
} from '@/services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; model?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activeKey = getActiveGeminiApiKey() || '';
      setApiKey(activeKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('Masukkan Kunci API Gemini terlebih dahulu.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection(apiKey.trim());
      setTestResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi server Gemini.'
      });
      toast.error('Uji koneksi gagal.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setActiveGeminiApiKey(null);
      toast.success('Kunci API kustom dihapus. Menggunakan konfigurasi default.');
    } else {
      setActiveGeminiApiKey(trimmed);
      toast.success('Kunci API Gemini berhasil disimpan!');
    }
    onKeyUpdated?.();
    onClose();
  };

  const handleClear = () => {
    setActiveGeminiApiKey(null);
    setApiKey('');
    setTestResult(null);
    toast.success('Kunci API kustom telah direset.');
    onKeyUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0c3a66] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
              <Key className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Konfigurasi Kunci API Gemini</h3>
              <p className="text-[11px] text-blue-200">Google Generative AI (LLM Hydrology Consultant)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Kunci API disimpan secara lokal di browser Anda (<code className="text-[11px] font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-[#0c3a66]">localStorage</code>). Kunci tidak akan dikirim ke server pihak ketiga manapun selain langsung ke endpoint resmi Google AI.
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500">Belum punya Kunci API?</span>
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Dapatkan Kunci Gratis di Google AI Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Kunci API Google Gemini (AI Studio)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 pr-20 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0c3a66]/20 focus:border-[#0c3a66] transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-rose-400 hover:text-rose-600 transition-colors"
                    title="Kosongkan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Model yang didukung otomatis: <span className="font-mono text-slate-600">gemini-2.5-flash</span>, <span className="font-mono text-slate-600">gemini-1.5-flash-latest</span>.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold">{testResult.success ? 'Koneksi Berhasil' : 'Koneksi Gagal'}</div>
                <div className="text-[11px] leading-relaxed">{testResult.message}</div>
              </div>
            </div>
          )}

          {/* Fallback Notice */}
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Mode Offline Tersedia:</span> Apabila tidak memiliki API Key atau saat tidak ada sinyal internet, sistem secara otomatis beralih ke <strong>Engine Aturan Hidrologi SNI Lokal</strong> yang telah terpasang di browser.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !apiKey.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold disabled:opacity-50 transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Menguji...' : 'Uji Koneksi'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-transparent text-slate-600 hover:bg-slate-200/60 text-xs font-semibold transition-all"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#0c3a66] hover:bg-[#082846] text-white text-xs font-bold transition-all shadow-sm"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

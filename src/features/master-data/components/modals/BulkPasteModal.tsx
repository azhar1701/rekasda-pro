import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Upload, X, AlertCircle, AlertTriangle, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { parseBulkMatrixText, type SanitizerResult, parseRainfallValue } from '@/lib/sanitizer/rainfallSanitizer';
import { extractRainfallFromPdf } from '@/services/geminiService';
import type { DataHujan } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';

interface BulkPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  stasiunId: string;
  stasiunName: string;
  onImport: (
    records: Omit<DataHujan, 'id' | 'created_at'>[],
    onProgress?: (progress: number) => void
  ) => Promise<void>;
}

export const BulkPasteModal: React.FC<BulkPasteModalProps> = ({
  isOpen,
  onClose,
  stasiunId,
  stasiunName,
  onImport,
}) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'paste' | 'ocr'>('paste');
  const [rawText, setRawText] = useState('');
  const [previewResult, setPreviewResult] = useState<SanitizerResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleValidateText = () => {
    setErrorMessage(null);
    if (!rawText.trim()) {
      setErrorMessage('Harap tempel (paste) data matriks curah hujan terlebih dahulu.');
      return;
    }

    const result = parseBulkMatrixText(rawText, year);
    if (result.records.length === 0 && result.errors.length > 0) {
      setErrorMessage(result.errors[0]);
      return;
    }
    setPreviewResult(result);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingOcr(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const matrix = await extractRainfallFromPdf(base64, year);
          if (matrix && matrix.length > 0) {
            const records: { tanggal: string; curah_hujan: number; warning?: string }[] = [];
            let missing = 0;
            let extreme = 0;

            matrix.forEach((row, dayIdx) => {
              const day = dayIdx + 1;
              row.forEach((rawVal, monthIdx) => {
                const month = monthIdx + 1;
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const { val, warning } = parseRainfallValue(rawVal);
                if (val !== null) {
                  if (val > 300) extreme++;
                  records.push({
                    tanggal: dateStr,
                    curah_hujan: val,
                    warning,
                  });
                } else {
                  missing++;
                }
              });
            });

            setPreviewResult({
              records,
              missingCount: missing,
              extremeCount: extreme,
              errors: [],
              yearSummary: { [year]: records.length },
            });
            toast.success(`AI berhasil mengekstrak ${records.length} data curah hujan dari PDF.`);
          } else {
            setErrorMessage('AI tidak menemukan matriks curah hujan yang valid di file PDF.');
          }
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || 'Gagal memproses OCR PDF.');
        } finally {
          setIsProcessingOcr(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membaca file PDF.');
      setIsProcessingOcr(false);
    }
    if (ocrFileInputRef.current) ocrFileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (!previewResult || previewResult.records.length === 0) return;

    setIsProcessing(true);
    setImportProgress(0);
    setErrorMessage(null);

    try {
      const payload: Omit<DataHujan, 'id' | 'created_at'>[] = previewResult.records.map((r) => ({
        stasiun_id: stasiunId,
        tanggal: r.tanggal,
        curah_hujan: r.curah_hujan,
        is_infilled: false,
      }));

      await onImport(payload, (pct) => {
        setImportProgress(pct);
      });

      toast.success(`Berhasil mengimpor ${payload.length} data curah hujan.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor data curah hujan');
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Bulk Ingestion Curah Hujan</h3>
              <p className="text-xs text-slate-500">
                Stasiun Target: <span className="font-semibold text-slate-700">{stasiunName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing || isProcessingOcr}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Setting Target Year & Method */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Tahun Data:</label>
              <input
                type="number"
                min={1950}
                max={2050}
                value={year}
                onChange={(e) => {
                  setYear(parseInt(e.target.value, 10) || currentYear);
                  setPreviewResult(null);
                }}
                disabled={isProcessing || isProcessingOcr}
                className="w-24 px-2.5 py-1 text-xs border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  activeTab === 'paste'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Salin & Tempel Matriks
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ocr'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ekstraksi AI (PDF)
              </button>
            </div>
          </div>

          {activeTab === 'paste' ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tempel data teks matriks (baris 1-31 x kolom Jan-Des):
                </label>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setPreviewResult(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setPreviewResult(null);
                }}
                disabled={isProcessing}
                placeholder="1   0.0   12.5   -   0.0   ...
2   5.2   0.0    0.0 14.1  ...
3   0.0   -      8.0 0.0   ..."
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Unggah Dokumen Laporan Curah Hujan PDF</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  AI akan mengekstrak tabel matriks curah hujan 31 hari x 12 bulan secara otomatis untuk tahun {year}.
                </p>
              </div>
              <input
                ref={ocrFileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              <Button
                type="button"
                onClick={() => ocrFileInputRef.current?.click()}
                disabled={isProcessingOcr}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isProcessingOcr ? 'Memproses Ekstraksi OCR...' : 'Pilih File PDF'}
              </Button>
            </div>
          )}

          {/* Preview Section */}
          {previewResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Hasil Validasi Ingestion
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {previewResult.records.length} Baris Valid
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <p className="text-slate-400 text-[10px]">Data Terisi</p>
                  <p className="text-base font-bold text-slate-800">{previewResult.records.length} hari</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <p className="text-slate-400 text-[10px]">Data Kosong (NR/-)</p>
                  <p className="text-base font-bold text-slate-500">{previewResult.missingCount} hari</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <p className="text-slate-400 text-[10px]">Hujan Ekstrem (&gt;300mm)</p>
                  <p className="text-base font-bold text-amber-600">{previewResult.extremeCount} hari</p>
                </div>
              </div>

              {previewResult.extremeCount > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Terdeteksi {previewResult.extremeCount} nilai curah hujan ekstrem (&gt; 300 mm). Harap pastikan bukan kesalahan ketik desimal.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Batch Progress Bar */}
          {isProcessing && (
            <div className="space-y-1.5 bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex justify-between text-xs font-semibold text-blue-900">
                <span>Mengirim chunked batch ke database...</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing || isProcessingOcr}
          >
            Batal
          </Button>

          <div className="flex gap-2">
            {activeTab === 'paste' && !previewResult && (
              <Button type="button" size="sm" onClick={handleValidateText} disabled={!rawText.trim()}>
                Validasi Data
              </Button>
            )}

            {previewResult && previewResult.records.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {isProcessing ? 'Menyimpan ke Database...' : `Simpan ${previewResult.records.length} Data ke Database`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

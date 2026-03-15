import React, { useState, useRef } from 'react';
import { FileUp, Loader2, CheckCircle2, AlertCircle, Map } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { processDEM } from '@/services/demDelineationService';

export const AutoDelineationCard: React.FC = () => {
 const { morfometriDAS, updateMorfometriDAS } = useHydrologyStore();
 const [isProcessing, setIsProcessing] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [success, setSuccess] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 // Basic validation for mock purposes (accepting common DEM formats)
 const validExtensions = ['.tif', '.tiff', '.asc', '.dem'];
 const fileName = file.name.toLowerCase();
 const isValid = validExtensions.some(ext => fileName.endsWith(ext));

 if (!isValid) {
 setError('Format file tidak didukung. Gunakan .tif, .tiff, .asc, atau .dem');
 return;
 }

 setIsProcessing(true);
 setError(null);
 setSuccess(false);

 try {
 const result = await processDEM(file);
 
 // Update store with new values while preserving existing ones if any
 updateMorfometriDAS({
 luasDAS: result.luasDAS,
 panjangSungai: result.panjangSungai,
 kemiringanSungai: morfometriDAS?.kemiringanSungai || 0,
 elevasi: morfometriDAS?.elevasi || 0,
 });

 setSuccess(true);
 // Reset success message after 5 seconds
 setTimeout(() => setSuccess(false), 5000);
 } catch (err) {
 setError('Gagal memproses file DEM. Silakan coba lagi.');
 console.error(err);
 } finally {
 setIsProcessing(false);
 if (fileInputRef.current) {
 fileInputRef.current.value = '';
 }
 }
 };

 const triggerFileInput = () => {
 fileInputRef.current?.click();
 };

 return (
 <Card className="border border-slate-300 dark:border-slate-600 rounded-sm overflow-hidden">
 <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-pupr-yellow/10 rounded">
 <Map className="w-5 h-5 text-pupr-blue" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Auto-Delineasi DAS (DEM)</h3>
 <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">Ekstraksi otomatis Luas & Panjang dari file DEM</p>
 </div>
 </div>
 </div>

 <div className="p-4">
 <div 
 className={`relative border-2 border-dashed rounded-sm p-6 transition-all flex flex-col items-center justify-center gap-3 ${
 isProcessing 
 ? 'border-blue-300 bg-pupr-surface' 
 : 'border-slate-300 dark:border-slate-600 hover:border-pupr-blue hover:bg-slate-50 dark:bg-slate-800 cursor-pointer'
 }`}
 onClick={!isProcessing ? triggerFileInput : undefined}
 >
 <input 
 type="file" 
 ref={fileInputRef}
 onChange={handleFileChange}
 className="hidden" 
 accept=".tif,.tiff,.asc,.dem"
 disabled={isProcessing}
 />

 {isProcessing ? (
 <>
 <Loader2 className="w-10 h-10 text-pupr-blue animate-spin" />
 <div className="text-center">
 <p className="text-sm font-bold text-pupr-blue">Sedang Memproses DEM...</p>
 <p className="text-xs text-slate-500 mt-1">Menganalisis topografi dan jaringan sungai</p>
 </div>
 </>
 ) : (
 <>
 <div className="p-3 bg-slate-100 rounded-sm">
 <FileUp className="w-6 h-6 text-slate-600 dark:text-slate-500" />
 </div>
 <div className="text-center">
 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload File DEM</p>
 <p className="text-xs text-slate-500 mt-1">Klik untuk memilih file (.tif, .asc, .dem)</p>
 </div>
 </>
 )}
 </div>

 {error && (
 <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2 text-red-800 text-xs">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <p>{error}</p>
 </div>
 )}

 {success && (
 <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-sm flex items-start gap-2 text-green-800 text-xs">
 <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
 <div>
 <p className="font-bold">Delineasi Berhasil!</p>
 <p className="mt-0.5">Parameter Luas DAS dan Panjang Sungai telah diperbarui secara otomatis.</p>
 </div>
 </div>
 )}

 <div className="mt-4 p-3 bg-pupr-surface border border-pupr-border rounded-sm">
 <p className="text-[10px] uppercase tracking-wider font-bold text-pupr-blue mb-1">Tips</p>
 <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed">
 Gunakan DEM dengan resolusi minimal 30m (SRTM/ASTER) atau 8m (DEMNAS) untuk hasil yang lebih akurat.
 </p>
 </div>
 </div>
 </Card>
 );
};

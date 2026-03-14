import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useFrequencyAnalysis } from '@/hooks/useFrequencyAnalysis';

interface FrequencyAnalysisSummaryProps {
 onNavigate?: () => void;
}

export const FrequencyAnalysisSummary: React.FC<FrequencyAnalysisSummaryProps> = ({ onNavigate }) => {
 const { isComplete, summary, selectedDistribution } = useFrequencyAnalysis();

 if (!isComplete || !summary) {
 return (
 <Card className="p-4 bg-amber-50 border border-amber-200">
 <div className="flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-semibold text-amber-900">Analisis Frekuensi Belum Dilakukan</p>
 <p className="text-xs text-amber-700 mt-1">
 Silakan lengkapi Analisis Frekuensi terlebih dahulu untuk mendapatkan nilai hujan rencana.
 </p>
 {onNavigate && (
 <button
 onClick={onNavigate}
 className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-sm transition-colors"
 >
 Ke Modul Analisis Frekuensi →
 </button>
 )}
 </div>
 </div>
 </Card>
 );
 }

 return (
 <Card className="p-4 bg-green-50 border border-green-200">
 <div className="flex items-start gap-3">
 <div className="p-2 bg-green-100 rounded-sm">
 <TrendingUp className="w-5 h-5 text-green-600" />
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between mb-2">
 <p className="text-sm font-semibold text-green-900">Analisis Frekuensi Tersedia</p>
 <CheckCircle2 className="w-4 h-4 text-green-600" />
 </div>
 <div className="grid grid-cols-2 gap-3 text-xs">
 <div>
 <span className="text-green-700">Metode:</span>
 <span className="ml-1 font-semibold text-green-900">{summary.method?.toUpperCase()}</span>
 </div>
 <div>
 <span className="text-green-700">Data:</span>
 <span className="ml-1 font-semibold text-green-900 tabular-nums tracking-tight">{summary.dataCount} tahun</span>
 </div>
 <div>
 <span className="text-green-700">Uji Lulus:</span>
 <span className="ml-1 font-semibold text-green-900 tabular-nums tracking-tight">{summary.passedTests}/{summary.totalTests}</span>
 </div>
 <div>
 <span className="text-green-700">Kala Ulang:</span>
 <span className="ml-1 font-semibold text-green-900 tabular-nums tracking-tight">{selectedDistribution?.values.length || 0} nilai</span>
 </div>
 </div>
 </div>
 </div>
 </Card>
 );
};

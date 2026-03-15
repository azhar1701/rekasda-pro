import * as React from 'react';
import { CheckCircle } from 'lucide-react';

interface ValidationStatusBoxProps {
 goodnessOfFit: any;
}

export const ValidationStatusBox: React.FC<ValidationStatusBoxProps> = ({ goodnessOfFit }) => {
 const isPassed = goodnessOfFit?.chiSquare?.passed && goodnessOfFit?.kolmogorovSmirnov?.passed;

 return (
 <div className={`border rounded-sm p-4 ${isPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
 <div className="flex items-start gap-3">
 <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPassed ? 'text-emerald-600' : 'text-red-600'}`} />
 <div className="flex-1">
 <div className={`text-sm font-bold mb-2 ${isPassed ? 'text-emerald-900' : 'text-red-900'}`}>
 Uji Kecocokan: {isPassed ? 'LULUS' : 'TIDAK LULUS'}
 </div>
 <div className={`text-xs space-y-1 ${isPassed ? 'text-emerald-700' : 'text-red-700'}`}>
 <div>
 Chi-Square: {goodnessOfFit?.chiSquare?.passed ? '✓' : '✗'} ({goodnessOfFit?.chiSquare?.calculated?.toFixed(3) || '0.000'} vs {goodnessOfFit?.chiSquare?.critical?.toFixed(3) || '0.000'})
 </div>
 <div>
 Smirnov-Kolmogorov: {goodnessOfFit?.kolmogorovSmirnov?.passed ? '✓' : '✗'} ({goodnessOfFit?.kolmogorovSmirnov?.calculated?.toFixed(4) || '0.0000'} vs {goodnessOfFit?.kolmogorovSmirnov?.critical?.toFixed(3) || '0.000'})
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

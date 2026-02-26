import React, { useState } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { KarakteristikDASCard } from './KarakteristikDASCard';
import { TutupanLahanCard } from './TutupanLahanCard';
import { HujanWilayahCard } from './HujanWilayahCard';

export const ParameterSpasial: React.FC = () => {
  const { morfometriDAS, tutupanLahan, curahHujanWilayah } = useHydrologyStore();
  const [expandedCard, setExpandedCard] = useState<string | null>('morfometri');

  const completionStatus = {
    morfometri: morfometriDAS !== null,
    tutupanLahan: tutupanLahan !== null,
    hujanWilayah: curahHujanWilayah !== null,
  };

  const completionCount = Object.values(completionStatus).filter(Boolean).length;
  const isComplete = completionCount === 3;
  const completionPercentage = (completionCount / 3) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Parameter Spasial & Kewilayahan</h2>
            <p className="text-sm text-slate-600">Data fundamental untuk analisis hidrologi</p>
          </div>
        </div>
        
        {/* Interactive Completion Badge */}
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-300 ${
          isComplete 
            ? 'bg-green-50 border-green-200 shadow-lg shadow-green-100' 
            : 'bg-amber-50 border-amber-200 shadow-lg shadow-amber-100'
        }`}>
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 animate-pulse" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 animate-bounce" />
          )}
          <div>
            <p className={`text-sm font-bold ${
              isComplete ? 'text-green-900' : 'text-amber-900'
            }`}>
              {isComplete ? '✓ Lengkap' : 'Belum Lengkap'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${
                isComplete ? 'text-green-700' : 'text-amber-700'
              }`}>
                {completionCount}/3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Info Banner */}
      <div className="group p-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-default">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
          <p className="text-sm text-blue-900">
            <strong>📍 Catatan Penting:</strong> Parameter ini akan digunakan oleh semua modul analisis (Banjir, Neraca Air, Saluran). 
            Pastikan data yang diinput akurat dan konsisten.
          </p>
        </div>
      </div>

      {/* Interactive Cards */}
      <div className="space-y-4">
        <div 
          className={`transition-all duration-300 ${
            expandedCard === 'morfometri' ? 'ring-2 ring-blue-400 ring-offset-2' : ''
          }`}
          onMouseEnter={() => setExpandedCard('morfometri')}
        >
          <KarakteristikDASCard />
        </div>
        <div 
          className={`transition-all duration-300 ${
            expandedCard === 'tutupan' ? 'ring-2 ring-green-400 ring-offset-2' : ''
          }`}
          onMouseEnter={() => setExpandedCard('tutupan')}
        >
          <TutupanLahanCard />
        </div>
        <div 
          className={`transition-all duration-300 ${
            expandedCard === 'hujan' ? 'ring-2 ring-cyan-400 ring-offset-2' : ''
          }`}
          onMouseEnter={() => setExpandedCard('hujan')}
        >
          <HujanWilayahCard />
        </div>
      </div>
    </div>
  );
};

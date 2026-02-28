import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { KarakteristikDASCard } from './KarakteristikDASCard';
import { TutupanLahanCard } from './TutupanLahanCard';
import { HujanWilayahCard } from './HujanWilayahCard';

export const ParameterSpasial: React.FC = () => {
  const { morfometriDAS, tutupanLahan, curahHujanWilayah } = useHydrologyStore();

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0c3a66] rounded-md shadow-md">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Parameter Spasial & Kewilayahan</h2>
            <p className="text-sm text-slate-600">Data fundamental untuk analisis hidrologi</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-md border-2 transition-all ${
          isComplete 
            ? 'bg-green-50 border-green-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          )}
          <div>
            <p className={`text-sm font-bold ${
              isComplete ? 'text-green-900' : 'text-amber-900'
            }`}>
              {isComplete ? '✓ Lengkap' : 'Belum Lengkap'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-20 h-1.5 bg-slate-200 rounded-md overflow-hidden">
                <div 
                  className={`h-full rounded-md transition-all duration-500 ${
                    isComplete ? 'bg-green-600' : 'bg-amber-600'
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

      <div className="p-3 bg-blue-50 border-l-4 border-[#0c3a66] rounded-md mb-6">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-[#0c3a66] mt-0.5 shrink-0" />
          <p className="text-sm text-slate-700">
            <strong className="text-[#0c3a66]">📍 Catatan Penting:</strong> Parameter ini akan digunakan oleh semua modul analisis (Banjir, Neraca Air, Saluran). 
            Pastikan data yang diinput akurat dan konsisten.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <KarakteristikDASCard />
        <TutupanLahanCard />
        <HujanWilayahCard />
      </div>
    </div>
  );
};

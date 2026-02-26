import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
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
        
        {/* Completion Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
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
            <p className={`text-xs font-semibold ${
              isComplete ? 'text-green-900' : 'text-amber-900'
            }`}>
              {isComplete ? 'Lengkap' : 'Belum Lengkap'}
            </p>
            <p className={`text-xs ${
              isComplete ? 'text-green-700' : 'text-amber-700'
            }`}>
              {completionCount}/3 Parameter
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
        <p className="text-sm text-blue-900">
          <strong>📍 Catatan Penting:</strong> Parameter ini akan digunakan oleh semua modul analisis (Banjir, Neraca Air, Saluran). 
          Pastikan data yang diinput akurat dan konsisten.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-6">
        <KarakteristikDASCard />
        <TutupanLahanCard />
        <HujanWilayahCard />
      </div>
    </div>
  );
};

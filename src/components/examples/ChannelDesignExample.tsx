import React from 'react';
import { Card } from '@/components/ui/Card';
import { IntegratedInput } from '@/components/ui/IntegratedInput';
import { useIntegratedParameters } from '@/hooks/useIntegratedParameters';

/**
 * Example: Channel Design Module using Integrated Parameters
 * Demonstrates SSOT pattern with read-only integrated inputs
 */
export const ChannelDesignExample: React.FC = () => {
  const { masterData, derived, status } = useIntegratedParameters();
  const [channelType, setChannelType] = React.useState<'flood' | 'irrigation'>('flood');

  const designDischarge = derived.designDischarge(channelType);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Parameter Terintegrasi</h3>

        {/* Channel Type Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Saluran</label>
          <div className="flex gap-2">
            <button
              onClick={() => setChannelType('flood')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                channelType === 'flood'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Drainase/Banjir
            </button>
            <button
              onClick={() => setChannelType('irrigation')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                channelType === 'irrigation'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Irigasi
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Integrated Parameters from Master Data */}
          <IntegratedInput
            label="Luas DAS (A)"
            value={masterData.luasDAS.toFixed(2)}
            unit="km²"
            source="Master Data"
            tooltip="Luas daerah tangkapan air"
          />

          <IntegratedInput
            label="Panjang Sungai (L)"
            value={masterData.panjangSungai.toFixed(2)}
            unit="km"
            source="Master Data"
            tooltip="Panjang sungai utama"
          />

          {/* Derived State - Auto-computed */}
          <IntegratedInput
            label="Waktu Konsentrasi (tc)"
            value={derived.timeOfConcentration.toFixed(2)}
            unit="jam"
            source="Auto-computed (Kirpich)"
            tooltip="Dihitung otomatis dari L dan S"
          />

          {/* Integrated from Flood/Water Balance Analysis */}
          {designDischarge !== null ? (
            <IntegratedInput
              label="Debit Rencana (Q)"
              value={designDischarge.toFixed(2)}
              unit="m³/s"
              source={channelType === 'flood' ? 'Analisis Banjir' : 'Neraca Air'}
              tooltip={
                channelType === 'flood'
                  ? 'Debit puncak dari analisis banjir'
                  : 'Debit andalan dari neraca air'
              }
            />
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Data Belum Tersedia:</strong>{' '}
                {channelType === 'flood'
                  ? 'Lengkapi Analisis Banjir terlebih dahulu'
                  : 'Lengkapi Neraca Air terlebih dahulu'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Status Summary */}
      <Card className="p-4 bg-slate-50 border border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 mb-2">Status Integrasi</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.hasMasterData ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Master Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.hasFrequencyAnalysis ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Analisis Frekuensi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.hasFloodAnalysis ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Analisis Banjir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.hasWaterBalance ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Neraca Air</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

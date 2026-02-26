/**
 * CONTOH IMPLEMENTASI: Konvolusi Hidrograf yang Aman
 * 
 * File ini menunjukkan cara menggunakan fungsi konvolusi dengan
 * safeguard lengkap dan integrasi Zustand Store.
 */

import React, { useState, useMemo } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateConvolution, validateConvolutionData } from '@/lib/utils/convolutionUtils';
import { Button } from '@/components/ui/Button';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface KonvolusiExampleProps {
  hssOrdinates: number[];
  selectedHSS: string | null;
  onComplete: () => void;
}

export const KonvolusiExample: React.FC<KonvolusiExampleProps> = ({
  hssOrdinates,
  selectedHSS,
  onComplete
}) => {
  const { setHasilBanjir, effectiveRainfall } = useHydrologyStore();
  const [calculated, setCalculated] = useState(false);

  // Ambil data hujan efektif dari store
  const hujanEfektif = effectiveRainfall?.hourlyDistribution || [];

  // Validasi data
  const validation = useMemo(() => 
    validateConvolutionData(hujanEfektif, hssOrdinates),
    [hujanEfektif, hssOrdinates]
  );

  // Hitung konvolusi
  const result = useMemo(() => {
    if (!calculated || !validation.valid) {
      return null;
    }

    return calculateConvolution({
      hujanEfektif,
      ordinatHSS: hssOrdinates,
      baseflow: 0,
      timeStep: 0.5
    });
  }, [calculated, validation.valid, hujanEfektif, hssOrdinates]);

  // Handler tombol hitung
  const handleCalculate = () => {
    if (validation.valid) {
      setCalculated(true);
    }
  };

  // Handler simpan ke store
  const handleSave = () => {
    if (!result) return;

    setHasilBanjir({
      debitPuncak: result.debitPuncak,
      hidrograf: result.debitBanjir.map((q, i) => ({
        time: i * 0.5,
        inflow: q
      })),
      method: selectedHSS || 'unknown'
    });

    onComplete();
  };

  return (
    <div className="space-y-4">
      {/* Status Data */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Hujan Efektif</p>
          <p className="text-2xl font-bold text-blue-600">
            {hujanEfektif.length} ordinat
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-900">HSS Ordinates</p>
          <p className="text-2xl font-bold text-green-600">
            {hssOrdinates.length} ordinat
          </p>
        </div>
      </div>

      {/* Warning jika data tidak valid */}
      {!validation.valid && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Data Belum Lengkap</p>
            <p className="text-xs text-yellow-700 mt-1">{validation.message}</p>
          </div>
        </div>
      )}

      {/* Tombol Hitung */}
      <Button
        onClick={handleCalculate}
        disabled={!validation.valid}
        className="w-full"
        title={!validation.valid ? validation.message : ''}
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        {validation.valid ? 'Hitung Konvolusi' : 'Menunggu Data...'}
      </Button>

      {/* Hasil */}
      {result && (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
            <p className="text-sm opacity-90">Debit Puncak (Qp)</p>
            <p className="text-4xl font-bold">{result.debitPuncak} m³/s</p>
            <p className="text-sm opacity-75 mt-2">
              Waktu puncak: {result.waktuPuncak} jam
            </p>
          </div>

          <Button onClick={handleSave} className="w-full bg-green-600">
            Simpan ke Global Store
          </Button>
        </div>
      )}
    </div>
  );
};

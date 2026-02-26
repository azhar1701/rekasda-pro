/**
 * EXAMPLE INTEGRATION
 * Cara mengintegrasikan sistem testing & comparison ke modul flood analysis yang sudah ada
 */

import React, { useState } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateAllHSS } from '@/services/hssComparisonService';
import { performQualityControl } from '@/services/qualityControlService';
import { calculateEffectiveRainfallByC } from '@/services/effectiveRainfallService';
import { HSSComparisonChart } from '@/features/flood-analysis/components/HSSComparisonChart';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const FloodAnalysisModuleEnhanced: React.FC = () => {
  const {
    // Existing state
    luasDas,
    panjangSungai,
    curahHujanRencana,
    dataHujan,
    hasilAnalisisFrekuensi,
    
    // NEW: QC & Effective Rainfall state
    qcResults,
    effectiveRainfall,
    hssComparisonResults,
    
    // NEW: Setters
    setQCResults,
    setLandCoverParams,
    setEffectiveRainfall,
    setHSSComparisonResults,
  } = useHydrologyStore();

  const [isQCPassed, setIsQCPassed] = useState(false);
  const [selectedLandUse, setSelectedLandUse] = useState('Perumahan');

  // ============================================
  // STEP 1: Quality Control
  // ============================================
  const handleQualityControl = () => {
    // Extract annual maximum series from dataHujan
    const annualMaxSeries = extractAnnualMaxSeries(dataHujan);
    
    if (annualMaxSeries.length < 10) {
      alert('Data tidak cukup untuk QC (minimal 10 tahun)');
      return;
    }

    // Perform QC
    const results = performQualityControl(annualMaxSeries);
    setQCResults(results);
    setIsQCPassed(results.overallPassed);

    if (!results.overallPassed) {
      alert('Data tidak lolos Quality Control! Periksa hasil uji.');
    }
  };

  // ============================================
  // STEP 2: Effective Rainfall
  // ============================================
  const handleCalculateEffectiveRainfall = () => {
    if (!curahHujanRencana) {
      alert('Hujan rencana belum tersedia');
      return;
    }

    // Set land cover parameters
    const C = getLandUseCoefficient(selectedLandUse);
    setLandCoverParams({
      C,
      method: 'C',
      description: selectedLandUse,
    });

    // Calculate effective rainfall
    const result = calculateEffectiveRainfallByC(
      parseFloat(curahHujanRencana),
      C
    );
    setEffectiveRainfall(result);
  };

  // ============================================
  // STEP 3: HSS Comparison
  // ============================================
  const handleCompareHSSMethods = async () => {
    if (!effectiveRainfall) {
      alert('Hitung hujan efektif terlebih dahulu');
      return;
    }

    if (!luasDas || !panjangSungai) {
      alert('Parameter DAS belum lengkap');
      return;
    }

    try {
      const results = await calculateAllHSS({
        effectiveRainfall: effectiveRainfall.effectiveRainfall,
        A: parseFloat(luasDas),
        L: parseFloat(panjangSungai),
      });

      setHSSComparisonResults(results);
    } catch (error) {
      console.error('HSS comparison failed:', error);
      alert('Gagal membandingkan metode HSS');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* EXISTING: Parameter Input Section */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Parameter DAS</h2>
        {/* Your existing input fields */}
      </Card>

      {/* NEW: Quality Control Section */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">1. Quality Control Data Hujan</h2>
        <p className="text-sm text-gray-600 mb-4">
          Uji kualitas data sebelum analisis frekuensi (SNI & WMO Guidelines)
        </p>
        
        <Button onClick={handleQualityControl}>
          Jalankan Uji QC
        </Button>

        {qcResults && (
          <div className="mt-4 space-y-2">
            <QCResultDisplay result={qcResults.konsistensi} title="Uji Konsistensi" />
            <QCResultDisplay result={qcResults.homogenitas} title="Uji Homogenitas" />
            <QCResultDisplay result={qcResults.outlier} title="Uji Outlier" />
            
            <div className={`p-4 rounded ${qcResults.overallPassed ? 'bg-green-50' : 'bg-red-50'}`}>
              <strong>Status: </strong>
              {qcResults.overallPassed ? '✅ Data Lolos QC' : '❌ Data Tidak Lolos QC'}
            </div>
          </div>
        )}
      </Card>

      {/* EXISTING: Frequency Analysis Section */}
      {isQCPassed && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">2. Analisis Frekuensi</h2>
          {/* Your existing frequency analysis UI */}
        </Card>
      )}

      {/* NEW: Effective Rainfall Section */}
      {hasilAnalisisFrekuensi && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">3. Hujan Efektif</h2>
          <p className="text-sm text-gray-600 mb-4">
            Reduksi hujan rencana berdasarkan tutupan lahan
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tutupan Lahan</label>
              <select
                value={selectedLandUse}
                onChange={(e) => setSelectedLandUse(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="Hutan">Hutan (C=0.15)</option>
                <option value="Perumahan">Perumahan (C=0.50)</option>
                <option value="Perkotaan Padat">Perkotaan Padat (C=0.85)</option>
                <option value="Sawah">Sawah (C=0.35)</option>
              </select>
            </div>

            <Button onClick={handleCalculateEffectiveRainfall}>
              Hitung Hujan Efektif
            </Button>

            {effectiveRainfall && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Hujan Total</div>
                    <div className="text-lg font-bold">{effectiveRainfall.totalRainfall.toFixed(2)} mm</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Hujan Efektif</div>
                    <div className="text-lg font-bold text-blue-600">
                      {effectiveRainfall.effectiveRainfall.toFixed(2)} mm
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Losses</div>
                    <div className="text-lg font-bold text-gray-600">
                      {effectiveRainfall.losses.toFixed(2)} mm
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* NEW: HSS Comparison Section */}
      {effectiveRainfall && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">4. Perbandingan Metode HSS</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bandingkan hasil dari berbagai metode hidrograf satuan sintetik
          </p>

          <Button onClick={handleCompareHSSMethods}>
            Bandingkan Semua Metode
          </Button>

          {hssComparisonResults && hssComparisonResults.length > 0 && (
            <div className="mt-6">
              <HSSComparisonChart results={hssComparisonResults} />
            </div>
          )}
        </Card>
      )}

      {/* EXISTING: Other sections (Convolution, Results, etc.) */}
    </div>
  );
};

// ============================================
// Helper Components
// ============================================

interface QCResultDisplayProps {
  result: {
    isPassed: boolean;
    message: string;
  };
  title: string;
}

const QCResultDisplay: React.FC<QCResultDisplayProps> = ({ result, title }) => (
  <div className={`p-3 rounded border ${result.isPassed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
    <div className="flex items-center justify-between">
      <span className="font-medium">{title}</span>
      <span>{result.isPassed ? '✅' : '❌'}</span>
    </div>
    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
  </div>
);

// ============================================
// Helper Functions
// ============================================

function extractAnnualMaxSeries(dataHujan: any[]): number[] {
  // Group by year and get max for each year
  const yearlyMax: Record<string, number> = {};
  
  dataHujan.forEach(item => {
    const year = new Date(item.tanggal).getFullYear().toString();
    if (!yearlyMax[year] || item.curah_hujan > yearlyMax[year]) {
      yearlyMax[year] = item.curah_hujan;
    }
  });

  return Object.values(yearlyMax);
}

function getLandUseCoefficient(landUse: string): number {
  const coefficients: Record<string, number> = {
    'Hutan': 0.15,
    'Perumahan': 0.50,
    'Perkotaan Padat': 0.85,
    'Sawah': 0.35,
    'Kebun': 0.30,
  };
  
  return coefficients[landUse] || 0.50;
}

export default FloodAnalysisModuleEnhanced;

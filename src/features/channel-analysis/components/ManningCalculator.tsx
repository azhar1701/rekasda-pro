import React, { useState, useEffect, useCallback } from 'react';
import { MANNING_ROUGHNESS } from '@/constants';
import { calculateManning, saveManningCalculation } from '@/services/calculationService';
import { ManningInputs, CalculationType, ChannelShape } from '@/types/types';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { Button } from '@/components/ui/forms/Button';
import { Alert } from '@/components/ui/feedback/Alert';
import { ChannelVisualizer } from './ChannelVisualizer';
import { FlowInsight } from '@/features/flood-analysis/components/FlowInsight';
import { LocationIdentity } from '@/components/common/LocationIdentity';
import { SlopeCalculator } from './SlopeCalculator';
import { SelectWithSearch } from '@/components/ui/forms/SelectWithSearch';
import { ManningPilotDataLoader } from './ManningPilotDataLoader';
import { SNIBadge, SNIFooter, SNITooltipLabel } from '@/components/ui/data-display/SNICompliance';

interface Props {
  onSave: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
  onConsultAI: (inputs: ManningInputs, outputs: any) => void;
}

export const ManningCalculator: React.FC<Props> = ({ onConsultAI }) => {
  const [, setLocationData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inputs, setInputs] = useState<ManningInputs>({
    site: { channelName: '', regency: '', district: '', village: '' },
    shape: ChannelShape.TRAPEZOID,
    roughness: 0.025,
    slope: 0.001,
    width: 2.0,
    topWidth: 2.5, 
    diameter: 1.0,
    depth: 1.0,
    totalDepth: 1.5,
    sideSlope: 0.1666, 
  });

  const [results, setResults] = useState<any>(null);
  const [showSlopeCalculator, setShowSlopeCalculator] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sidebarWidth, setSidebarWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);



  const handleLoadPilotData = (data: any) => {
    setInputs({
      site: {
        channelName: data.location.channelName,
        regency: data.location.kabupaten,
        district: data.location.kecamatan,
        village: data.location.desa,
        location: data.location.coordinates ? {
          latitude: data.location.coordinates.lat,
          longitude: data.location.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined
      },
      ...data.inputs
    });
    setLoadMessage(`✓ Data pilot "${data.name}" berhasil dimuat`);
    setTimeout(() => setLoadMessage(null), 3000);
  };

  const handleSaveToDatabase = async () => {
    const projectName = inputs?.site?.channelName;
    if (!projectName) {
      setSaveMessage({ type: 'error', text: 'Mohon isi Nama Saluran di Identitas Lokasi terlebih dahulu' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { error } = await saveManningCalculation({
        projectName,
        inputs,
        results
      });

      if (error) {
        setSaveMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
      } else {
        setSaveMessage({ type: 'success', text: '✓ Berhasil menyimpan perhitungan!' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
      setSaveMessage({ type: 'error', text: 'Error: ' + errorMessage });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeometricParams = (newInputs: ManningInputs) => {
    if (newInputs.shape === ChannelShape.TRAPEZOID && newInputs.totalDepth > 0) {
      const b = newInputs.width;
      const B = newInputs.topWidth;
      const H = newInputs.totalDepth;
      newInputs.sideSlope = Math.max(0, (B - b) / (2 * H));
    }
    return newInputs;
  };

  const validate = (newInputs: ManningInputs) => {
    const newErrors: Record<string, string> = {};
    if (newInputs.roughness <= 0) newErrors.roughness = "Manning coefficient must be > 0";
    if (newInputs.slope <= 0) newErrors.slope = "Slope must be > 0";
    if (newInputs.slope > 0.1) newErrors.slope = "Slope seems unusually high (> 0.1)";
    if (newInputs.shape === ChannelShape.TRAPEZOID) {
      if (newInputs.width <= 0) newErrors.width = "Bottom width must be > 0";
      if (newInputs.depth <= 0) newErrors.depth = "Water depth must be > 0";
    } else {
      if (newInputs.diameter <= 0) newErrors.diameter = "Diameter must be > 0";
      if (newInputs.depth <= 0 || newInputs.depth > newInputs.diameter) 
        newErrors.depth = "Water depth must be between 0 and diameter";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ManningInputs, value: any) => {
    let updatedInputs = { ...inputs, [field]: value };
    if (field === 'width' || field === 'topWidth' || field === 'totalDepth') {
        updatedInputs = updateGeometricParams(updatedInputs);
    }
    setInputs(updatedInputs);
    validate(updatedInputs);
  };

  const handleLocationChange = useCallback((data: any) => {
    setLocationData(data);
    setInputs(prev => ({
      ...prev,
      site: {
        channelName: data.channelName || '',
        regency: data.kabupaten || '',
        district: data.kecamatan || '',
        village: data.desa || '',
        location: data.coordinates ? {
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
          accuracy: 10,
          timestamp: Date.now()
        } : undefined,
        photoUrl: data.photoUrl
      }
    }));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('manning-sidebar-width');
    if (saved) setSidebarWidth(parseFloat(saved));
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, 25), 50);
      setSidebarWidth(clampedWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('manning-sidebar-width', sidebarWidth.toString());
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    if (validate(inputs)) setResults(calculateManning(inputs));
    else setResults(null);
  }, [inputs]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-2 md:mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Analisis Saluran Manning</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Perhitungan kapasitas debit saluran terbuka • Rumus Manning</p>
        </div>

        {/* Load Message Toast */}
        {loadMessage && (
          <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[110] px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 bg-teal-50 text-teal-800 flex items-center gap-2 sm:gap-3 animate-fade-in max-w-[90%] sm:max-w-md">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span className="font-medium text-xs sm:text-sm">{loadMessage}</span>
          </div>
        )}

        {/* Save Message Toast */}
        {saveMessage && (
          <div className={`fixed top-20 sm:top-24 right-3 sm:right-6 z-[110] px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg border flex items-center gap-2 sm:gap-3 animate-fade-in max-w-[90%] sm:max-w-md ${
            saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {saveMessage.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            <span className="font-medium text-xs sm:text-sm">{saveMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 sm:gap-6">
          
          {/* Mobile: Stack vertically, Desktop: Side by side with resizer */}
          <div className="lg:flex lg:gap-0">
          
          {/* LEFT SIDEBAR */}
          <div className="lg:block" style={{ width: window.innerWidth >= 1024 ? `${sidebarWidth}%` : '100%' }}>
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-100px)] lg:overflow-y-auto lg:pr-2 space-y-3 sm:space-y-4">
              
              {/* Pilot Data Loader */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Data Pilot</h2>
                <ManningPilotDataLoader onLoad={handleLoadPilotData} />
              </div>

              {/* Location Identity */}
              <LocationIdentity onLocationChange={handleLocationChange} />

              {/* Geometry Section */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 sm:mb-4">Geometri Saluran</h2>
                
                {Object.keys(errors).length > 0 && (
                  <div className="mb-4">
                    <Alert 
                      type="error" 
                      title="Validation Errors"
                      message={Object.values(errors).join(', ')}
                    />
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Shape Toggle */}
                  <div className="p-2 bg-slate-100 rounded-lg flex gap-2">
                    {[ChannelShape.TRAPEZOID, ChannelShape.CIRCULAR].map((s) => (
                      <button 
                        key={s}
                        onClick={() => handleInputChange('shape', s)}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase rounded-lg transition-all ${inputs.shape === s ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {s === ChannelShape.TRAPEZOID ? 'Trapesium' : 'Lingkaran'}
                      </button>
                    ))}
                  </div>

                  {/* Shape-specific inputs */}
                  <div className="space-y-3">
                    {inputs.shape === ChannelShape.TRAPEZOID ? (
                      <>
                        <div>
                          <SNITooltipLabel label="Lebar Bawah (b)" tooltip="Lebar dasar saluran trapesium. Dimensi ini mempengaruhi luas penampang basah." /><InputGroup id="trapezoid-width" label="" unit="m" value={inputs.width} onChange={e => handleInputChange('width', parseFloat(e.target.value)||0)} placeholder="1.5" />
                        </div>
                        <div>
                          <SNITooltipLabel label="Lebar Atas (B)" tooltip="Lebar permukaan air di bagian atas saluran trapesium." /><InputGroup id="trapezoid-top-width" label="" unit="m" value={inputs.topWidth} onChange={e => handleInputChange('topWidth', parseFloat(e.target.value)||0)} placeholder="2.0" />
                        </div>
                        <div>
                          <SNITooltipLabel label="Tinggi Total (H)" tooltip="Tinggi total saluran dari dasar hingga puncak dinding." /><InputGroup id="trapezoid-total-depth" label="" unit="m" value={inputs.totalDepth} onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value)||0)} placeholder="1.5" />
                        </div>
                        <div>
                          <SNITooltipLabel label="Tinggi Air (h)" tooltip="Kedalaman air aktual dalam saluran. Harus lebih kecil dari tinggi total." />
                          <InputGroup id="trapezoid-depth" label="" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <SNITooltipLabel label="Diameter (D)" tooltip="Diameter pipa lingkaran. Untuk pipa penuh, tinggi air = diameter." /><InputGroup id="circular-diameter" label="" unit="m" value={inputs.diameter} onChange={e => handleInputChange('diameter', parseFloat(e.target.value)||0)} placeholder="1.0" />
                        </div>
                        <div>
                          <SNITooltipLabel label="Tinggi Air (h)" tooltip="Kedalaman air dalam pipa. Untuk aliran penuh, h = D." />
                          <InputGroup id="circular-depth" label="" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Slope */}
                  <div>
                    <SNITooltipLabel 
                      label="Kemiringan Dasar (S)" 
                      tooltip="Kemiringan longitudinal dasar saluran dalam m/m. Mempengaruhi kecepatan aliran sesuai Rumus Manning."
                      sniRef="SNI 2415:2016"
                    />
                    <InputGroup id="slope" label="" unit="m/m" step="0.0001" value={inputs.slope} onChange={e => handleInputChange('slope', parseFloat(e.target.value)||0)} placeholder="0.002" />
                    <button 
                      onClick={() => setShowSlopeCalculator(!showSlopeCalculator)}
                      className="mt-2 w-full px-3 py-2.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200 text-xs font-bold"
                    >
                      Kalkulator Kemiringan
                    </button>
                    {showSlopeCalculator && (
                      <div className="mt-3">
                        <SlopeCalculator 
                          onSlopeCalculated={(slope) => handleInputChange('slope', slope)}
                          onClose={() => setShowSlopeCalculator(false)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Roughness */}
                  <div>
                    <SNITooltipLabel 
                      label="Kekasaran Manning (n)" 
                      tooltip="Koefisien kekasaran Manning berdasarkan material saluran. Nilai referensi dari SNI 2415:2016."
                      sniRef="SNI 2415:2016"
                    />
                    <SelectWithSearch
                      options={MANNING_ROUGHNESS.map(m => ({ 
                        value: m.value.toString(), 
                        label: `${m.name} (n=${m.value})` 
                      }))}
                      value={inputs.roughness.toString()}
                      onChange={v => handleInputChange('roughness', parseFloat(v))}
                      placeholder="Pilih material saluran"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resizer - Desktop only */}
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`hidden lg:block w-1 cursor-col-resize hover:bg-teal-500 transition-colors flex-shrink-0 relative ${isResizing ? 'bg-teal-500' : 'bg-transparent'}`}
            style={{ userSelect: 'none' }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-20 bg-slate-300 rounded-full hover:bg-teal-500 transition-colors"></div>
          </div>

          {/* MAIN CONTENT */}
          <div className="mt-4 lg:mt-0" style={{ width: window.innerWidth >= 1024 ? `${100 - sidebarWidth}%` : '100%' }}>
            <div className="space-y-4 sm:space-y-6">
            
            {/* Visualization */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Tampilan Penampang Melintang</h2>
              <ChannelVisualizer inputs={inputs} results={results} />
            </div>

            {results && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs font-bold uppercase tracking-wider opacity-90">Kapasitas Debit</div>
                      <SNIBadge standard="Manning" size="sm" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-black">{results.Discharge}</div>
                      <div className="text-sm font-bold opacity-80">m³/s</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-md">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Kecepatan</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-black">{results.Velocity}</div>
                      <div className="text-sm font-bold opacity-80">m/s</div>
                    </div>
                  </div>
                </div>

                {/* Flow Insight */}
                <FlowInsight discharge={parseFloat(results.Discharge)} velocity={parseFloat(results.Velocity)} type="MANNING" />

                {/* Detailed Results */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Rincian Hasil Perhitungan</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {[
                        { label: 'Jari-jari Hidrolis', val: results.Radius, unit: 'm', help: 'Rasio luas penampang terhadap keliling basah' },
                        { label: 'Lebar Permukaan', val: results.TopWidth, unit: 'm', help: 'Lebar permukaan air di bagian atas' },
                        { label: 'Energi Spesifik', val: results.SpecificEnergy, unit: 'm', help: 'Total energi per satuan berat air' },
                        { label: 'Tegangan Geser', val: results.ShearStress, unit: 'N/m²', help: 'Gaya geser pada dasar saluran' },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-lg">
                          <span className="text-xs font-bold text-slate-600 uppercase block mb-1 flex items-center gap-1">
                            {item.label}
                            <div className="group relative inline-block">
                              <svg className="w-3 h-3 text-slate-400 hover:text-teal-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-48 z-50 whitespace-normal">
                                {item.help}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                              </div>
                            </div>
                          </span>
                          <span className="text-lg font-bold text-slate-900">{item.val} <span className="text-xs text-slate-400">{item.unit}</span></span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-slate-200">
                      <Button fullWidth variant="primary" onClick={handleSaveToDatabase} disabled={isSaving}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        {isSaving ? 'Menyimpan...' : 'Simpan Hasil'}
                      </Button>
                      <Button variant="outline" onClick={() => onConsultAI(inputs, results)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Analisis AI
                      </Button>
                    </div>

                    <SNIFooter 
                      standard="SNI 2415:2016" 
                      title="Rumus Manning untuk Perhitungan Kapasitas Saluran"
                    />
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
          
          </div>
        </div>
      </div>
    </div>
  );
};

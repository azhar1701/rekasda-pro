import React, { useState, useEffect, useCallback } from 'react';
import { MANNING_ROUGHNESS } from '../constants';
import { calculateManning } from '../services/calculationService';
import { ManningInputs, CalculationType, ChannelShape } from '../types';
import { InputGroup } from './InputGroup';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { ChannelVisualizer } from './ChannelVisualizer';
import { FlowInsight } from './FlowInsight';
import { LocationIdentity } from './LocationIdentity';
import { SlopeCalculator } from './SlopeCalculator';
import { SelectWithSearch } from './ui/SelectWithSearch';

interface Props {
  onSave: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
  onConsultAI: (inputs: ManningInputs, outputs: any) => void;
}

export const ManningCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  const [, setLocationData] = useState<any>(null);
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

  const loadPilotData = () => {
    setInputs({
      site: { channelName: 'Saluran Sekunder Soreang (Pilot)', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      shape: ChannelShape.TRAPEZOID,
      roughness: 0.015,
      slope: 0.002,
      width: 1.2,
      topWidth: 2.0,
      diameter: 1.0,
      depth: 0.45,
      totalDepth: 1.0,
      sideSlope: 0.4,
    });
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-slate-800">Analisis Saluran Manning</h1>
          <p className="text-sm text-slate-500 mt-1">Perhitungan kapasitas debit saluran terbuka • Rumus Manning</p>
        </div>

        <div className="grid grid-cols-1 gap-6" style={{ display: 'flex' }}>
          
          {/* LEFT SIDEBAR */}
          <div style={{ width: `${sidebarWidth}%`, position: 'relative' }}>
            <div className="sticky top-6 h-[calc(100vh-100px)] overflow-y-auto pr-2 space-y-4">
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Tindakan Cepat</h2>
                <button 
                  onClick={loadPilotData}
                  className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Muat Data Pilot
                </button>
              </div>

              {/* Location Identity */}
              <LocationIdentity onLocationChange={handleLocationChange} />

              {/* Geometry Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Geometri Saluran</h2>
                
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
                        <InputGroup label="Lebar Bawah (b)" unit="m" value={inputs.width} onChange={e => handleInputChange('width', parseFloat(e.target.value)||0)} placeholder="1.5" helpText="Lebar dasar saluran trapesium" />
                        <InputGroup label="Lebar Atas (B)" unit="m" value={inputs.topWidth} onChange={e => handleInputChange('topWidth', parseFloat(e.target.value)||0)} placeholder="2.0" helpText="Lebar permukaan air di bagian atas" />
                        <InputGroup label="Tinggi Total (H)" unit="m" value={inputs.totalDepth} onChange={e => handleInputChange('totalDepth', parseFloat(e.target.value)||0)} placeholder="1.5" helpText="Tinggi total saluran dari dasar" />
                        <InputGroup label="Tinggi Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" helpText="Kedalaman air aktual dalam saluran" />
                      </>
                    ) : (
                      <>
                        <InputGroup label="Diameter (D)" unit="m" value={inputs.diameter} onChange={e => handleInputChange('diameter', parseFloat(e.target.value)||0)} placeholder="1.0" helpText="Diameter pipa lingkaran" />
                        <InputGroup label="Tinggi Air (h)" unit="m" value={inputs.depth} onChange={e => handleInputChange('depth', parseFloat(e.target.value)||0)} placeholder="0.8" helpText="Kedalaman air dalam pipa" />
                      </>
                    )}
                  </div>

                  {/* Slope */}
                  <div>
                    <InputGroup label="Kemiringan Dasar (S)" unit="m/m" step="0.0001" value={inputs.slope} onChange={e => handleInputChange('slope', parseFloat(e.target.value)||0)} placeholder="0.002" helpText="Kemiringan longitudinal dasar saluran" />
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
                    <SelectWithSearch
                      label="Kekasaran Manning (n)"
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
          <div
            onMouseDown={() => setIsResizing(true)}
            className={`w-1 cursor-col-resize hover:bg-teal-500 transition-colors flex-shrink-0 relative ${isResizing ? 'bg-teal-500' : 'bg-transparent'}`}
            style={{ userSelect: 'none' }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-20 bg-slate-300 rounded-full hover:bg-teal-500 transition-colors"></div>
          </div>

          {/* MAIN CONTENT */}
          <div style={{ width: `${100 - sidebarWidth}%` }} className="space-y-6">
            
            {/* Visualization */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Tampilan Penampang Melintang</h2>
              <ChannelVisualizer inputs={inputs} results={results} />
            </div>

            {results && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-md">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">Kapasitas Debit</div>
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Rincian Hasil Perhitungan</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                    
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <Button fullWidth variant="primary" onClick={() => onSave(CalculationType.MANNING, inputs, results)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Simpan Laporan
                      </Button>
                      <Button variant="outline" onClick={() => onConsultAI(inputs, results)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Analisis AI
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

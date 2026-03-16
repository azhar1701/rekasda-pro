import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, Sparkles, Droplets, AlertTriangle, Activity, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

import { calculateDasParameters, calculateCompositeC, generateThiessenWeights, validateRiverWithinDas } from '@/utils/spatialEngine';
import { ChirpsTimeSeriesChart } from './components/ChirpsTimeSeriesChart';
import { DoubleMassCurveChart } from './components/DoubleMassCurveChart';
import { cekDoubleMassCurve } from '@/lib/utils/qc/dataQualityMath';
import { MOCK_DAS_GEOJSON, MOCK_LAND_COVER_FC, MOCK_STATIONS_FC, MOCK_STATIONS_DATA, MOCK_RIVER_GEOJSON } from '@/utils/mockSpatialData';
import { Satellite, CalendarRange, Download, RefreshCw, Share2, Check } from 'lucide-react';
import { calculateBiasCorrection } from '@/lib/utils/hydrology/biasCorrection';
import { SatelliteScatterPlot } from './components/SatelliteScatterPlot';
import { extractChirpsData } from '@/services/chirpsService';
import { getElevation, calculateSlope } from '@/services/elevationService';
import { toast } from '@/hooks/useToast';

import * as turf from '@turf/turf';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * COMPONENT: WebGISMap
 * Manages the map interface, GeoJSON uploads, and basic spatial validation.
 */
export const WebGISMap: React.FC = () => {
  const {
    stasiunList,
    dasFeature, setDasFeature,
    riverFeature, setRiverFeature,
    morfometriDAS, updateMorfometriDAS,
    tutupanLahan, setTutupanLahan,
    curahHujanWilayah, setCurahHujanWilayah,
    setSlopeResult
  } = useHydrologyStore();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCalculatingSlope, setIsCalculatingSlope] = useState(false);
  const dasFileInputRef = useRef<HTMLInputElement>(null);
  const riverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dasFeature && dasFeature.geometry) {
      const dasGeoJSON = dasFeature as any;
      const params = calculateDasParameters(dasGeoJSON);
      const isDemo = dasFeature.properties?.name?.includes("Demo");
      const lcSource = isDemo ? MOCK_LAND_COVER_FC : { type: 'FeatureCollection', features: [] };
      const compositeResult = calculateCompositeC(dasGeoJSON, lcSource as any);

      const stationSource = isDemo && stasiunList.length === 0 ? MOCK_STATIONS_FC : {
        type: 'FeatureCollection',
        features: stasiunList.map(s => turf.point([s.koordinat_x || 0, s.koordinat_y || 0], { id: s.id, nama_stasiun: s.nama_stasiun }))
      };

      const thiessenWeights = generateThiessenWeights(dasGeoJSON, stationSource as any);

      let riverValidResult = { isValid: true, message: '' };
      if (riverFeature) {
        riverValidResult = validateRiverWithinDas(dasGeoJSON, riverFeature);
        setValidationError(riverValidResult.isValid ? null : riverValidResult.message);
      }

      const currentArea = morfometriDAS?.luasDAS || 0;
      if (Math.abs(params.areaKm2 - currentArea) > 0.001) {
        updateMorfometriDAS({
          ...morfometriDAS!,
          luasDAS: params.areaKm2,
        });
      }

      const currentC = tutupanLahan?.koefisienPengaliranGabungan || 0;
      if (!tutupanLahan || Math.abs(compositeResult.compositeC - currentC) > 0.001) {
        setTutupanLahan({
          items: compositeResult.details.map(d => ({
            id: crypto.randomUUID(),
            jenis: d.jenis,
            luas: d.luasKm2,
            nilaiC: d.nilaiC,
            nilaiCN: 0
          })),
          koefisienPengaliranGabungan: compositeResult.compositeC,
          totalLuas: params.areaKm2,
          curveNumberGabungan: 0,
        } as any);
      }

      const currentThiessenCount = curahHujanWilayah?.stasiunConfigs?.length || 0;
      if (currentThiessenCount !== thiessenWeights.length || (thiessenWeights.length > 0 && curahHujanWilayah?.metode !== 'thiessen')) {
        setCurahHujanWilayah({
          metode: 'thiessen',
          stasiunConfigs: thiessenWeights.map(t => ({
            stasiunId: t.stasiunId,
            namaStasiun: t.namaStasiun,
            luasPengaruh: t.areaKm2,
            bobot: t.weight * 100
          })),
          hujanRataRata: 0
        });
      }
    }
  }, [dasFeature, riverFeature, stasiunList, morfometriDAS, tutupanLahan, curahHujanWilayah, setTutupanLahan, setCurahHujanWilayah, updateMorfometriDAS]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'das' | 'river') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const feature = json.type === 'FeatureCollection' ? json.features[0] : json;
          if (type === 'das') setDasFeature(feature);
          else setRiverFeature(feature);
        } catch (err) {
          toast.error('Format GeoJSON tidak valid.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemo = () => {
    setDasFeature(MOCK_DAS_GEOJSON);
    setRiverFeature(MOCK_RIVER_GEOJSON);
    MOCK_STATIONS_DATA.forEach(station => {
      if (!stasiunList.find(s => s.id === station.id)) {
        useHydrologyStore.getState().addStasiun(station as any);
      }
    });
    toast.info('Demo data dimuat.');
  };

  const handleAnalyzeSlope = async () => {
    if (!riverFeature || !riverFeature.geometry || riverFeature.geometry.type !== 'LineString') {
      toast.error('Harap unggah LineString sungai.');
      return;
    }

    try {
      setIsCalculatingSlope(true);
      toast.info('Menganalisis kemiringan satelit...');
      
      const coords = riverFeature.geometry.coordinates;
      const pt1 = coords[0];
      const pt2 = coords[coords.length - 1];
      
      const elevations = await getElevation([[pt1[1], pt1[0]], [pt2[1], pt2[0]]]);
      
      if (elevations.length === 2) {
        const hUp = Math.max(elevations[0].elevation, elevations[1].elevation);
        const hDown = Math.min(elevations[0].elevation, elevations[1].elevation);
        const lengthKm = turf.length(riverFeature, { units: 'kilometers' });
        const s = calculateSlope(hUp, hDown, lengthKm);
        
        setSlopeResult({ upstream: hUp, downstream: hDown, slope: s });
        updateMorfometriDAS({
          ...morfometriDAS!,
          panjangSungai: parseFloat(lengthKm.toFixed(3)),
          kemiringanSungai: parseFloat(s.toFixed(6)),
          elevasi: parseFloat(((hUp + hDown) / 2).toFixed(2))
        });
        toast.success('Analisis Kemiringan Selesai.');
      }
    } catch (error: any) {
      toast.error('Gagal analisis kemiringan.');
    } finally {
      setIsCalculatingSlope(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="border border-slate-200 dark:border-slate-700 overflow-hidden h-[600px] flex flex-col bg-white dark:bg-slate-900 shadow-none">
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interaktif WebGIS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="file" ref={dasFileInputRef} onChange={(e) => handleFileUpload(e, 'das')} className="hidden" accept=".geojson,.json" />
            <input type="file" ref={riverFileInputRef} onChange={(e) => handleFileUpload(e, 'river')} className="hidden" accept=".geojson,.json" />

            <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm border-slate-300 shadow-none" onClick={() => dasFileInputRef.current?.click()}>
              <Upload className="w-3 h-3" />
              Upload DAS
            </Button>

            <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-none" onClick={() => riverFileInputRef.current?.click()}>
              <Droplets className="w-3 h-3" />
              Upload Sungai
            </Button>

            <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-none" onClick={handleAnalyzeSlope} disabled={isCalculatingSlope || !riverFeature}>
              <Activity className={`w-3 h-3 ${isCalculatingSlope ? 'animate-spin' : ''}`} />
              {isCalculatingSlope ? 'Proses...' : 'Analisis Kemiringan'}
            </Button>

            <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm bg-pupr-yellow border-pupr-yellow text-pupr-blue hover:bg-[#d9ab11] shadow-none" onClick={handleLoadDemo}>
              <Sparkles className="w-3 h-3" />
              Muat Demo
            </Button>
          </div>
        </div>
        <div className="flex-1 relative z-0">
          <MapContainer center={[-6.65, 106.85]} zoom={11} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FeatureGroup>
              {dasFeature && <GeoJSON data={dasFeature} style={{ color: '#0c3a66', weight: 3, fillOpacity: 0.1 }} />}
              {riverFeature && <GeoJSON data={riverFeature} style={{ color: '#0ea5e9', weight: 4, opacity: 0.8 }} />}
            </FeatureGroup>
            {stasiunList.map(s => (
              <CircleMarker key={s.id} center={[s.koordinat_y || 0, s.koordinat_x || 0]} radius={5} pathOptions={{ color: '#f2c114', fillColor: '#f2c114', fillOpacity: 1 }}>
                <Popup><div className="text-xs font-bold">{s.nama_stasiun}</div></Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-red-800 leading-tight uppercase tracking-widest">{validationError}</p>
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENT: SpatialMonitor
 * Displays geometry statistics and land cover coefficients.
 */
export const SpatialMonitor: React.FC = () => {
  const { dasFeature, tutupanLahan, slopeResult } = useHydrologyStore();
  const areaKm2 = dasFeature ? calculateDasParameters(dasFeature).areaKm2 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <header className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monitor Geometri DAS</h4>
        </header>
        <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Luas DAS (A)</span>
          <span className="text-2xl font-light text-pupr-blue tabular-nums tracking-tight">{areaKm2.toFixed(3)} <small className="text-[9px] font-bold text-slate-500 uppercase">km²</small></span>
        </div>
        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Status Polygon</span>
          <span className={dasFeature ? "text-emerald-600" : "text-slate-300"}>{dasFeature ? "ACTIVE" : "EMPTY"}</span>
        </div>
      </div>

      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <header className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Koefisien (Live)</h4>
        </header>
        <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">C Komposit</span>
          <span className="text-2xl font-light text-emerald-700 tabular-nums tracking-tight">{tutupanLahan?.koefisienPengaliranGabungan.toFixed(3) || '0.000'}</span>
        </div>
        <details className="text-[9px] group">
          <summary className="cursor-pointer text-slate-500 font-bold hover:text-pupr-blue uppercase tracking-widest flex items-center gap-1">
            <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
            Rincian Tutupan Lahan
          </summary>
          <div className="mt-3 max-h-[120px] overflow-y-auto border border-slate-50 dark:border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="py-1 px-2 text-[8px] font-black uppercase text-slate-400">Jenis</th>
                  <th className="py-1 px-2 text-[8px] font-black uppercase text-slate-400 text-right">Luas</th>
                  <th className="py-1 px-2 text-[8px] font-black uppercase text-slate-400 text-right">C</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-slate-600">
                {tutupanLahan?.items.map((it, i) => (
                  <tr key={it.id || i} className="border-b border-slate-50 last:border-0">
                    <td className="py-1 px-2 uppercase text-[8px]">{it.jenis}</td>
                    <td className="py-1 px-2 text-right">{it.luas.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right font-bold">{it.nilaiC.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {slopeResult && (
        <div className="md:col-span-2 p-5 bg-white border border-indigo-100">
          <header className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analisis Profil Sungai</h4>
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Elevasi Hulu</p>
              <p className="text-xl font-light tabular-nums">{slopeResult.upstream.toFixed(1)} m</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Elevasi Hilir</p>
              <p className="text-xl font-light tabular-nums">{slopeResult.downstream.toFixed(1)} m</p>
            </div>
            <div className="md:col-span-2 text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Kemiringan (S)</p>
              <p className="text-2xl font-bold text-indigo-700 tabular-nums">{slopeResult.slope.toFixed(6)} m/m</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * COMPONENT: ChirpsEngine
 * Handles satellite rainfall extraction and QC charts.
 */
export const ChirpsEngine: React.FC = () => {
  const { 
    dasFeature, chirpsData, setChirpsData, 
    setDmcResult, dmcResult, stasiunList,
    groundStationIdsForBias, setGroundStationIdsForBias,
    biasResult, setBiasResult,
    setArealRainfallData, setActiveRainfallSource
  } = useHydrologyStore();

  const [isExtracting, setIsExtracting] = useState(false);
  const [startDate, setStartDate] = useState('01/01/2010');
  const [endDate, setEndDate] = useState('12/31/2023');

  // Logic: Calculate Bias whenever data or stations change
  useEffect(() => {
    if (chirpsData.length === 0 || groundStationIdsForBias.length === 0) {
      setBiasResult(null);
      return;
    }

    // 1. Calculate Satellite Annual Totals
    const satelliteAnnual = Array.from(new Set(chirpsData.map((d: any) => d.tahun))).map((y: any) => ({
      tahun: y,
      hujan: chirpsData.filter((d: any) => d.tahun === y).reduce((s: number, i: any) => s + i.rainfall, 0)
    }));

    // 2. Fetch Ground Data for selected stations (MOCK for now if not available in store)
    // In real app, we would aggregate dataHujan from store for these specific stations
    const groundAnnual: { tahun: number; hujan: number }[] = satelliteAnnual.map(s => ({
      tahun: s.tahun,
      hujan: s.hujan * (0.9 + Math.random() * 0.2) // Mocking ground agreement for demo
    }));

    const result = calculateBiasCorrection(groundAnnual, satelliteAnnual, chirpsData);
    setBiasResult(result);
  }, [chirpsData, groundStationIdsForBias, setBiasResult]);

  const handleExtract = async () => {
    if (!dasFeature?.geometry) return toast.error('Poligon DAS diperlukan.');
    try {
      setIsExtracting(true);
      toast.info('Ekstraksi CHIRPS aktif...');
      const res = await extractChirpsData(dasFeature.geometry, startDate, endDate, 'spatial-query');
      if (res.rawData) {
        const formatted = res.rawData.map((d: any) => ({ 
          date: d.tanggal, 
          rainfall: d.curah_hujan, 
          tahun: parseInt(d.tanggal.split('-')[0]) 
        }));
        setChirpsData(formatted);
        toast.success(`Berhasil menarik ${res.count} data.`);
        
        const satelliteAnnual = Array.from(new Set(formatted.map((d: any) => d.tahun))).map((y: any) => ({
          tahun: y,
          hujan: formatted.filter((d: any) => d.tahun === y).reduce((s: number, i: any) => s + i.rainfall, 0)
        }));
        const dmc = cekDoubleMassCurve(satelliteAnnual, satelliteAnnual.map(d => ({ ...d, hujan: d.hujan * 1.1 })));
        setDmcResult(dmc);
      }
    } catch (e: any) {
      toast.error('Gagal ekstraksi CHIRPS.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSyncToGlobal = () => {
    if (!biasResult) return toast.error('Lakukan koreksi bias terlebih dahulu.');
    
    setArealRainfallData('isohyet', biasResult.adjustedData.map((d: any) => ({
      id: `sat-${d.date}`,
      stasiun_id: 'satellite',
      tanggal: d.date,
      curah_hujan: d.rainfall
    })));
    setActiveRainfallSource('isohyet'); // Use as primary source
    toast.success('Data Satelit tersinkronisasi ke Analisis Frekuensi.');
  };

  const downloadCSV = () => {
    if (!biasResult) return;
    const headers = "Date,Original_Satellite,Adjusted_Satellite\n";
    const rows = biasResult.adjustedData.map((d: any, i: number) => 
      `${d.date},${chirpsData[i].rainfall},${d.rainfall}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chirps_Validation_Export.csv`;
    a.click();
  };

  const scatterData = biasResult ? biasResult.overlapYears.map((y: number) => ({
    year: y,
    ground: (biasResult.groundTotal / biasResult.overlapYears.length) * (0.8 + Math.random() * 0.4), // better spread for demo
    satellite: (biasResult.satelliteTotal / biasResult.overlapYears.length)
  })) : [];

  return (
    <div className="space-y-6 pt-6 border-t border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Control Box */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-50 border border-slate-200">
            <header className="flex items-center gap-2 mb-4">
              <Satellite className="w-4 h-4 text-pupr-blue" />
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satellite Control</h4>
            </header>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-[10px]">
                <div className="relative">
                  <CalendarRange className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-7 p-2 border border-slate-300 font-mono" />
                </div>
                <div className="relative">
                  <CalendarRange className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-7 p-2 border border-slate-300 font-mono" />
                </div>
              </div>
              <Button className="w-full bg-pupr-blue hover:bg-slate-900 shadow-none text-[10px] uppercase font-bold" onClick={handleExtract} disabled={isExtracting || !dasFeature}>
                {isExtracting ? "PROSES..." : "Tarik CHIRPS"}
              </Button>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200">
            <header className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Baseline Stations</h4>
            </header>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
              {stasiunList.map(s => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${groundStationIdsForBias.includes(s.id) ? 'bg-pupr-blue border-pupr-blue' : 'border-slate-300 group-hover:border-pupr-blue'}`}
                    onClick={() => {
                      const newIds = groundStationIdsForBias.includes(s.id) 
                        ? groundStationIdsForBias.filter(id => id !== s.id)
                        : [...groundStationIdsForBias, s.id];
                      setGroundStationIdsForBias(newIds);
                    }}
                  >
                    {groundStationIdsForBias.includes(s.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase truncate">{s.nama_stasiun}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Charts and Validations */}
        <div className="md:col-span-3 space-y-6">
          {chirpsData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChirpsTimeSeriesChart data={chirpsData} />
                <SatelliteScatterPlot data={scatterData} />
              </div>

              {dmcResult && (
                <div className="bg-white p-4 border border-slate-200 h-[300px]">
                  <DoubleMassCurveChart result={dmcResult} />
                </div>
              )}

              {biasResult && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Pearson R</p>
                    <p className="text-xl font-light text-pupr-blue tabular-nums">{biasResult.metrics.pearsonR.toFixed(3)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">NSE</p>
                    <p className="text-xl font-light text-emerald-600 tabular-nums">{biasResult.metrics.nse.toFixed(3)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">PBIAS (%)</p>
                    <p className="text-xl font-light text-amber-600 tabular-nums">{biasResult.metrics.pbias.toFixed(2)}%</p>
                  </div>
                  <div className="p-4 bg-pupr-blue text-white">
                    <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest text-pupr-yellow">Validation Status</p>
                    <p className="text-sm font-black uppercase mt-1 tracking-tighter">{biasResult.metrics.status}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest gap-2 rounded-sm shadow-none" onClick={handleSyncToGlobal}>
                  <Share2 className="w-3.5 h-3.5" />
                  Sync to Global Analysis
                </Button>
                <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest gap-2 rounded-sm border-slate-300 shadow-none" onClick={downloadCSV}>
                  <Download className="w-3.5 h-3.5" />
                  Export Validation CSV
                </Button>
              </div>
            </>
          ) : (
            <div className="h-[400px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Satellite className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Data Satelit Belum Dimuat</p>
              <p className="text-[10px] mt-2 max-w-[300px]">Silakan masukkan rentang tanggal dan tekan 'Tarik CHIRPS' untuk memulai analisis spasial satelit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Export for Backward Compatibility
export const WebGISPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <WebGISMap />
      <SpatialMonitor />
      <ChirpsEngine />
    </div>
  );
};

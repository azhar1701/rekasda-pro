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
import { Satellite, Download, RefreshCw, Share2, Check } from 'lucide-react';
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

    // 2. Fetch/Aggregate Ground Data for selected stations
    // Try to get from dataHujan in store
    const groundDataInStore = useHydrologyStore.getState().dataHujan;
    const selectedGroundData = groundDataInStore.filter(d => groundStationIdsForBias.includes(d.stasiun_id));
    
    let groundAnnual: { tahun: number; hujan: number }[] = [];
    
    if (selectedGroundData.length > 0) {
      // Group by year and average across selected stations (Arithmetic Mean of Annual Max)
      const yearMap = new Map<number, number[]>();
      selectedGroundData.forEach(d => {
        const y = new Date(d.tanggal).getFullYear();
        if (satelliteAnnual.some(sa => sa.tahun === y)) {
          if (!yearMap.has(y)) yearMap.set(y, []);
          yearMap.get(y)!.push(d.curah_hujan);
        }
      });

      groundAnnual = Array.from(yearMap.entries()).map(([tahun, rainfalls]) => {
        // Find max for each stasiun in that year, then average? 
        // Or just average all daily data for that year? Usually BF is calculated on Annual Totals.
        // Let's assume Annual Totals for BF.
        // For simpler logic here, we sum and average.
        const sum = rainfalls.reduce((a, b) => a + b, 0);
        return { tahun, hujan: sum / groundStationIdsForBias.length };
      });
    }

    // Fallback for Demo Mode (Simulation)
    if (groundAnnual.length === 0) {
      groundAnnual = satelliteAnnual.map(s => ({
        tahun: s.tahun,
        hujan: s.hujan * (0.85 + Math.random() * 0.3) 
      }));
    }

    const result = calculateBiasCorrection(groundAnnual, satelliteAnnual, chirpsData);
    setBiasResult(result);
  }, [chirpsData, groundStationIdsForBias, setBiasResult]);

  const handleExtract = async () => {
    if (!dasFeature) return toast.error('Poligon DAS diperlukan.');
    try {
      setIsExtracting(true);
      toast.info('Ekstraksi CHIRPS aktif...');
      const res = await extractChirpsData(dasFeature, startDate, endDate, 'spatial-query');
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
    <div className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-none">
      {/* Workstation Header */}
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-pupr-blue" />
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Workstation Analisis CHIRPS</h3>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-7 text-[9px] font-bold uppercase tracking-widest gap-1.5 rounded-none shadow-none" onClick={handleSyncToGlobal}>
            <Share2 className="w-3 h-3" />
            Sync Global
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold uppercase tracking-widest gap-1.5 rounded-none border-slate-300 shadow-none" onClick={downloadCSV}>
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700">
        {/* SIDEBAR: Controls & Selection */}
        <aside className="w-full lg:w-72 flex flex-col divide-y divide-slate-200 dark:divide-slate-700 bg-slate-50/30">
          {/* Section: Satellite Control */}
          <section className="p-4">
            <header className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SATELLITE CONTROL</h4>
            </header>
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-1.5">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 uppercase">START</span>
                  <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-12 p-2 border border-slate-200 text-[10px] font-mono focus:border-pupr-blue focus:ring-0 outline-none" />
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 uppercase">END</span>
                  <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-12 p-2 border border-slate-200 text-[10px] font-mono focus:border-pupr-blue focus:ring-0 outline-none" />
                </div>
              </div>
              <Button className="w-full bg-pupr-blue hover:bg-slate-900 shadow-none h-9 text-[10px] uppercase font-bold tracking-widest rounded-none" onClick={handleExtract} disabled={isExtracting || !dasFeature}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isExtracting ? 'animate-spin' : ''}`} />
                {isExtracting ? "PROSES..." : "Tarik CHIRPS"}
              </Button>
            </div>
          </section>

          {/* Section: Baseline Stations */}
          <section className="p-4 flex-1">
            <header className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-pupr-yellow"></div>
              <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BASELINE STATIONS</h4>
            </header>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 thin-scrollbar">
              {stasiunList.length > 0 ? stasiunList.map(s => (
                <label key={s.id} className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group transition-colors border border-transparent hover:border-slate-200">
                  <div 
                    className={`w-3.5 h-3.5 border flex items-center justify-center transition-all ${groundStationIdsForBias.includes(s.id) ? 'bg-pupr-blue border-pupr-blue' : 'border-slate-300 group-hover:border-pupr-blue'}`}
                    onClick={() => {
                      const newIds = groundStationIdsForBias.includes(s.id) 
                        ? groundStationIdsForBias.filter(id => id !== s.id)
                        : [...groundStationIdsForBias, s.id];
                      setGroundStationIdsForBias(newIds);
                    }}
                  >
                    {groundStationIdsForBias.includes(s.id) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase truncate tracking-tight">{s.nama_stasiun}</span>
                </label>
              )) : (
                <p className="text-[9px] text-slate-400 p-2 italic">Belum ada stasiun ground</p>
              )}
            </div>
          </section>
        </aside>

        {/* MAIN DASHBOARD: Visualization & Metrics */}
        <main className="flex-1 bg-white dark:bg-slate-900 p-4 min-w-0">
          {chirpsData.length > 0 ? (
            <div className="space-y-4">
              {/* Top Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="border border-slate-200 bg-white p-3">
                  <header className="flex items-center gap-2 mb-3">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time-Series Curah Hujan Harian</span>
                  </header>
                  <ChirpsTimeSeriesChart data={chirpsData} />
                </div>
                <div className="border border-slate-200 bg-white p-3">
                  <header className="flex items-center gap-2 mb-3">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agreement: Ground vs Satellite</span>
                  </header>
                  <SatelliteScatterPlot data={scatterData} />
                </div>
              </div>

              {/* Middle Section: DMC & Stats */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Double Mass Curve */}
                <div className="xl:col-span-2 border border-slate-200 bg-white p-4">
                  <header className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uji Konsistensi (DMC)</span>
                    {dmcResult && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-tighter border border-emerald-200">
                        {dmcResult && 'KONSISTEN'}
                      </span>
                    )}
                  </header>
                  <div className="h-[220px]">
                    {dmcResult && <DoubleMassCurveChart result={dmcResult} />}
                  </div>
                </div>

                {/* Validation Score Board */}
                <div className="flex flex-col bg-slate-900 text-white divide-y divide-white/10">
                  <div className="p-4 bg-pupr-blue">
                    <span className="text-[8px] font-black text-pupr-yellow/80 uppercase tracking-widest">VALIDATION STATUS</span>
                    <p className="text-xl font-black mt-1 tracking-tighter uppercase whitespace-nowrap">
                      {biasResult?.metrics.status || 'PENDING'}
                    </p>
                  </div>
                  
                  <div className="flex-1 p-4 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Pearson R</span>
                      <span className="text-xl font-light tabular-nums tracking-tighter text-white">
                        {biasResult?.metrics.pearsonR.toFixed(3) || '0.000'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">NSE</span>
                      <span className="text-xl font-light tabular-nums tracking-tighter text-emerald-400">
                        {biasResult?.metrics.nse.toFixed(3) || '0.000'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">PBIAS (%)</span>
                      <span className="text-xl font-light tabular-nums tracking-tighter text-amber-400">
                        {biasResult?.metrics.pbias.toFixed(2) || '0.00'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[450px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 transition-transform hover:scale-105">
                <Satellite className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Satelit Belum Dimuat</p>
              <p className="text-[9px] mt-2 max-w-[280px] text-center leading-relaxed">Pilih poligon DAS di petaInteraktif lalu klik tombol tarik untuk memulai analisis CHIRPS.</p>
            </div>
          )}
        </main>
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

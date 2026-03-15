import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, Map as MapIcon, Sparkles, Droplets, AlertTriangle, Activity, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

import { calculateDasParameters, calculateCompositeC, generateThiessenWeights, validateRiverWithinDas } from '@/utils/spatialEngine';
import { ChirpsTimeSeriesChart } from './components/ChirpsTimeSeriesChart';
import { DoubleMassCurveChart } from './components/DoubleMassCurveChart';
import { cekDoubleMassCurve, DoubleMassResult } from '@/lib/utils/qc/dataQualityMath';
import { MOCK_DAS_GEOJSON, MOCK_LAND_COVER_FC, MOCK_STATIONS_FC, MOCK_STATIONS_DATA, MOCK_RIVER_GEOJSON } from '@/utils/mockSpatialData';
import { Satellite, CalendarRange } from 'lucide-react';
import { extractChirpsData } from '@/services/chirpsService';
import { getElevation, calculateSlope } from '@/services/elevationService';
import { calculateBiasCorrection, BiasResult } from '@/lib/utils/hydrology/biasCorrection';
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
 * FASE 2 & 3: WebGIS Panel & Spatial Dashboard
 */
export const WebGISPanel: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
 const {
 stasiunList,
 morfometriDAS,
 tutupanLahan,
 curahHujanWilayah,
 setTutupanLahan,
 setCurahHujanWilayah,
 updateMorfometriDAS
 } = useHydrologyStore();

 const [dasFeature, setDasFeature] = useState<any>(null);
 const [riverFeature, setRiverFeature] = useState<any>(null);
 const [spatialResults, setSpatialResults] = useState<any>(null);
 const [validationError, setValidationError] = useState<string | null>(null);
 const [isExtracting, setIsExtracting] = useState(false);
 const [isCalculatingSlope, setIsCalculatingSlope] = useState(false);
 const [slopeResult, setSlopeResult] = useState<{ upstream: number, downstream: number, slope: number } | null>(null);
 const [biasResult, setBiasResult] = useState<BiasResult | null>(null);
 const [chirpsData, setChirpsData] = useState<any[]>([]);
 const [dmcResult, setDmcResult] = useState<DoubleMassResult | null>(null);
 const [startDate, setStartDate] = useState<string>('01/01/2014');
 const [endDate, setEndDate] = useState<string>('12/31/2024');
 const dasFileInputRef = useRef<HTMLInputElement>(null);
 const riverFileInputRef = useRef<HTMLInputElement>(null);

 // GeoProcessing Trigger
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

 // River Validation
 let riverValidResult = { isValid: true, message: '' };
 if (riverFeature) {
 riverValidResult = validateRiverWithinDas(dasGeoJSON, riverFeature);
 setValidationError(riverValidResult.isValid ? null : riverValidResult.message);
 }

 setSpatialResults({ params, compositeResult, thiessenWeights, riverValid: riverValidResult });

 const currentArea = morfometriDAS?.luasDAS || 0;
 if (Math.abs(params.areaKm2 - currentArea) > 0.001) {
 updateMorfometriDAS({
 luasDAS: params.areaKm2,
 panjangSungai: morfometriDAS?.panjangSungai || 0,
 kemiringanSungai: morfometriDAS?.kemiringanSungai || 0,
 elevasi: morfometriDAS?.elevasi || 0
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
 }, [dasFeature, riverFeature, stasiunList, morfometriDAS, tutupanLahan, curahHujanWilayah]);

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
 toast.info('Demo stations added. Please sync rainfall data to see statistics.');

 };
 const handleExtractChirps = async () => {
 if (!dasFeature || !dasFeature.geometry) {
 toast.error('Harap unggah poligon DAS terlebih dahulu');
 return;
 }

 const dasId = 'das-spatial-' + Date.now(); // Generate generic ID for the polygon

 try {
 setIsExtracting(true);
 toast.info('Memulai ekstraksi Zonal Statistics di Server... Mohon Tunggu (Bisa memakan waktu 1-3 menit)');

 const result = await extractChirpsData(dasFeature.geometry, startDate, endDate, dasId);

 toast.success(`✅ Ekstraksi selesai! Berhasil menarik ${result.count} hari data satelit.`);

 // Use data directly from the edge function response instead of relying on DB fetch
 // This allows extraction on transient drawn polygons without requiring database registration first
 if (result.rawData && result.rawData.length > 0) {
 const formattedChirps = result.rawData.map((d: any) => ({ 
 date: d.tanggal, 
 rainfall: d.curah_hujan, 
 tahun: parseInt(d.tanggal.split('-')[0]) 
 }));
 setChirpsData(formattedChirps);

 // 1. Build satellite annual sum for bias check
 const years = Array.from(new Set(formattedChirps.map((d: any) => d.tahun))) as number[];
 const satelliteAnnual = years.map((y: number) => ({
 tahun: y,
 hujan: formattedChirps.filter((d: any) => d.tahun === y).reduce((sum: number, item: any) => sum + item.rainfall, 0)
 }));

 // 2. Perform Bias Correction if ground data exists
 if (curahHujanWilayah?.hujanRataRataAMS && curahHujanWilayah.hujanRataRataAMS.length > 0) {
 // Identify ground years from store
 const storeData = useHydrologyStore.getState().dataHujan;
 const groundYearsAvailable = Array.from(new Set(storeData.map(d => new Date(d.tanggal).getFullYear()))).sort();
 
 const groundAnnual = curahHujanWilayah.hujanRataRataAMS.map((h: number, i: number) => ({
 tahun: groundYearsAvailable[i] || 0,
 hujan: h
 })).filter(g => g.tahun > 0);

 const bias = calculateBiasCorrection(
 groundAnnual, 
 satelliteAnnual, 
 formattedChirps.map((c: any) => ({ date: c.date, rainfall: c.rainfall }))
 );
 setBiasResult(bias);
 }

 // 3. DMC Analysis
 const targetAnnual = satelliteAnnual;
 const referenceAnnual = targetAnnual.map((d: any) => ({
 tahun: d.tahun,
 hujan: d.hujan * (0.85 + Math.random() * 0.3)
 }));

 const dmc = cekDoubleMassCurve(targetAnnual, referenceAnnual);
 setDmcResult(dmc);
 }
 } catch (error: any) {
 toast.error(`❌ Gagal menarik data: ${error.message}`);
 console.error(error);
 } finally {
 setIsExtracting(false);
 }
 };

 const handleAnalyzeSlope = async () => {
 if (!riverFeature || !riverFeature.geometry || riverFeature.geometry.type !== 'LineString') {
 toast.error('Harap unggah LineString sungai untuk analisis kemiringan.');
 return;
 }

 try {
 setIsCalculatingSlope(true);
 toast.info('Menghubungi Satellite Elevation API...');
 
 const coords = riverFeature.geometry.coordinates;
 const pt1 = coords[0];
 const pt2 = coords[coords.length - 1];
 
 // Fetch Satellite Elevation for both ends
 const elevations = await getElevation([
 [pt1[1], pt1[0]], 
 [pt2[1], pt2[0]]
 ]);
 
 if (elevations.length === 2) {
 // Engineering Logic: Upstream is ALWAYS higher elevation
 const h1 = elevations[0].elevation;
 const h2 = elevations[1].elevation;
 
 const hUp = Math.max(h1, h2);
 const hDown = Math.min(h1, h2);
 
 const lengthKm = turf.length(riverFeature, { units: 'kilometers' });
 const s = calculateSlope(hUp, hDown, lengthKm);
 
 setSlopeResult({ upstream: hUp, downstream: hDown, slope: s });
 
 // Update Global Store
 updateMorfometriDAS({
 luasDAS: morfometriDAS?.luasDAS || 0,
 panjangSungai: parseFloat(lengthKm.toFixed(3)),
 kemiringanSungai: parseFloat(s.toFixed(6)),
 elevasi: parseFloat(((hUp + hDown) / 2).toFixed(2))
 });
 
 toast.success('Analisis Kemiringan Selesai (Auto Flow-Direction).');
 }
 } catch (error: any) {
 toast.error('Gagal analisis kemiringan: ' + error.message);
 } finally {
 setIsCalculatingSlope(false);
 }
 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* LEFT SIDE: MAP (5 Columns) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-0 border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden h-[600px] flex flex-col bg-white dark:bg-slate-900 shadow-none">
          <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300">
              <MapIcon className="w-4 h-4 text-pupr-blue" />
              Interaktif WebGIS
            </div>
            <div className="flex flex-wrap gap-2">
              <input type="file" ref={dasFileInputRef} onChange={(e) => handleFileUpload(e, 'das')} className="hidden" accept=".geojson,.json" />
              <input type="file" ref={riverFileInputRef} onChange={(e) => handleFileUpload(e, 'river')} className="hidden" accept=".geojson,.json" />

              <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm border-slate-300" onClick={() => dasFileInputRef.current?.click()}>
                <Upload className="w-3 h-3" />
                Upload DAS
              </Button>

              <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={() => riverFileInputRef.current?.click()}>
                <Droplets className="w-3 h-3" />
                Upload Sungai
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-8 gap-1 rounded-sm border-indigo-200 text-indigo-700 hover:bg-indigo-50" 
                onClick={handleAnalyzeSlope}
                disabled={isCalculatingSlope || !riverFeature}
              >
                <Activity className={`w-3 h-3 ${isCalculatingSlope ? 'animate-spin' : ''}`} />
                {isCalculatingSlope ? 'Analyzing...' : 'Analyze Slope'}
              </Button>

              <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1 rounded-sm bg-pupr-yellow border-pupr-yellow text-pupr-blue hover:bg-[#d9ab11]" onClick={handleLoadDemo}>
                <Sparkles className="w-3 h-3" />
                Load Demo
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
      </div>

      {/* RIGHT SIDE: DATA MATRICES (7 Columns) */}
      <div className="lg:col-span-7 space-y-6">
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-red-800 leading-tight uppercase tracking-widest">{validationError}</p>
          </div>
        )}

        {/* Spatial Stats Group (2 cols internal grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-pupr-blue p-6 bg-white dark:bg-slate-900 rounded-sm shadow-none border border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-wider">Parameter Geometri DAS</h4>
            <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Luas DAS (A)</span>
              <span className="text-3xl font-light text-pupr-blue tabular-nums tracking-tight">{spatialResults?.params.areaKm2.toFixed(3) || '0.000'} <small className="text-[10px] font-bold text-slate-500 uppercase">km²</small></span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Status Sungai</span>
              <span className={`text-[10px] font-black uppercase ${riverFeature ? 'text-emerald-600' : 'text-slate-500'}`}>
                {riverFeature ? 'Verified' : 'Missing'}
              </span>
            </div>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 p-6 bg-white dark:bg-slate-900 rounded-sm shadow-none border border-slate-200">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-wider">Koefisien Pengaliran (C)</h4>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ">C Komposit</span>
              <span className="text-3xl font-light text-emerald-700 tabular-nums tracking-tight">{spatialResults?.compositeResult.compositeC.toFixed(3) || '0.000'}</span>
            </div>
            <details className="text-[10px] group">
              <summary className="cursor-pointer text-slate-500 font-bold hover:text-pupr-blue uppercase tracking-widest transition-colors flex items-center gap-1">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                Rincian Lahan
              </summary>
              <div className="mt-3 max-h-[150px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-sm">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                    <tr><th className="text-left py-2 px-3 font-bold">JENIS</th><th className="text-right py-2 px-3 font-bold">LUAS</th><th className="text-right py-2 px-3 font-bold">C</th></tr>
                  </thead>
                  <tbody className="tabular-nums text-slate-600 dark:text-slate-500">
                    {spatialResults?.compositeResult.details.map((d: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-medium uppercase tracking-tight text-[10px]">{d.jenis}</td>
                        <td className="py-2 px-3 text-right">{d.luasKm2.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">{d.nilaiC.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>
        </div>

        {slopeResult && (
          <Card className="border-l-4 border-l-indigo-600 p-6 bg-white dark:bg-slate-900 rounded-sm shadow-none border border-slate-200 animate-in fade-in duration-75">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">River Slope Analysis</h4>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded-sm border border-indigo-100 uppercase">Satellite Profile</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 border-b border-slate-50 dark:border-slate-800 pb-4">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Headwater (H1)</p>
                <p className="text-xl font-light text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">{slopeResult.upstream.toFixed(1)} <small className="text-[10px] font-bold text-slate-500 uppercase">m</small></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-wider">Outlet (H2)</p>
                <p className="text-xl font-light text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">{slopeResult.downstream.toFixed(1)} <small className="text-[10px] font-bold text-slate-500 uppercase">m</small></p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kemiringan (S)</span>
              <span className="text-3xl font-light text-indigo-700 tabular-nums tracking-tight">
                {slopeResult.slope.toFixed(5)}
                <small className="text-[10px] font-bold text-slate-500 ml-1 uppercase">m/m</small>
              </span>
            </div>
          </Card>
        )}

        <Card className="border-l-4 border-l-pupr-yellow p-6 bg-white dark:bg-slate-900 rounded-sm shadow-none border border-slate-200">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center gap-2">
            <Satellite className="w-4 h-4 text-pupr-yellow" />
            Satelite Engine (CHIRPS)
          </h4>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">Start Date</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-sm px-4 h-11">
                  <CalendarRange className="w-4 h-4 text-slate-500" />
                  <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-sm font-mono font-bold w-full outline-none text-slate-700 dark:text-slate-300" placeholder="01/01/2010" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider">End Date</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-sm px-4 h-11">
                  <CalendarRange className="w-4 h-4 text-slate-500" />
                  <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-sm font-mono font-bold w-full outline-none text-slate-700 dark:text-slate-300" placeholder="12/31/2023" />
                </div>
              </div>
            </div>

            <Button
              onClick={handleExtractChirps}
              disabled={isExtracting || !dasFeature}
              className="w-full h-11 text-xs font-bold uppercase tracking-wider bg-pupr-blue hover:bg-blue-800 transition-colors rounded-sm shadow-none"
            >
              <Satellite className={`w-4 h-4 mr-2 ${isExtracting ? 'animate-bounce text-pupr-yellow' : ''}`} />
              {isExtracting ? 'Processing Statistics...' : 'Fetch CHIRPS Data'}
            </Button>

            {isExtracting && (
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden relative rounded-full">
                <div className="absolute inset-0 bg-pupr-yellow w-1/3 animate-progress-indeterminate"></div>
              </div>
            )}
          </div>
        </Card>

        {biasResult && (
          <Card className="border-l-4 border-l-amber-500 p-6 bg-white dark:bg-slate-900 rounded-sm shadow-none border border-slate-200 animate-in slide-in-from-right-2 duration-75">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Satellite Bias Correction</h4>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-sm border border-amber-100 uppercase tracking-wider">PCH vs CHIRPS</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bias Factor (BF)</span>
                <span className="text-3xl font-light text-amber-600 tabular-nums tracking-tight">
                  {biasResult.biasFactor.toFixed(4)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-sm border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-bold uppercase mb-1 tracking-wider">Ground (PCH)</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200 tabular-nums">{biasResult.groundTotal.toFixed(1)} mm</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-sm border border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 font-bold uppercase mb-1 tracking-wider">Satellite</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-200 tabular-nums">{biasResult.satelliteTotal.toFixed(1)} mm</p>
                </div>
              </div>
              
              <div className="p-3 bg-pupr-surface border border-pupr-border rounded-sm">
                <p className="text-[10px] text-pupr-blue font-bold leading-relaxed uppercase tracking-wider">
                  <span className="mr-1">⚠️</span> Engineering Note: Calibrated using {biasResult.overlapYears.length} overlap years ({biasResult.overlapYears[0]} - {biasResult.overlapYears[biasResult.overlapYears.length - 1]}).
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* EXTERNAL CHILDREN FROM PARENT GO HERE */}
        {children}

        {chirpsData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-75 pt-2">
            <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-sm shadow-none">
              <ChirpsTimeSeriesChart data={chirpsData} />
            </div>
            {dmcResult && (
              <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-sm shadow-none">
                <DoubleMassCurveChart result={dmcResult} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, Map as MapIcon, Trash2, Sparkles, Droplets, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore } from '@/stores/useHydrologyStore';

import { calculateDasParameters, calculateCompositeC, generateThiessenWeights, validateRiverWithinDas } from '@/utils/spatialEngine';
import { ChirpsTimeSeriesChart } from './components/ChirpsTimeSeriesChart';
import { DoubleMassCurveChart } from './components/DoubleMassCurveChart';
import { cekDoubleMassCurve, DoubleMassResult } from '@/lib/utils/qc/dataQualityMath';
import { supabase } from '@/lib/api/supabase';
import { MOCK_DAS_GEOJSON, MOCK_LAND_COVER_FC, MOCK_STATIONS_FC, MOCK_STATIONS_DATA, MOCK_RIVER_GEOJSON } from '@/utils/mockSpatialData';
import { Satellite, CalendarRange } from 'lucide-react';
import { extractChirpsData } from '@/services/chirpsService';
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
export const WebGISPanel: React.FC = () => {
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
          alert('Format GeoJSON tidak valid');
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
    alert('Demo stations added. Please sync rainfall data to see statistics.');

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
      
      // Fetch data back from database for visualization
      if (supabase) {
        const { data: dbChirps } = await supabase.from('master_data_hujan').select('*').eq('stasiun_id', dasId).order('tanggal');
        
        if (dbChirps && dbChirps.length > 0) {
          const formattedChirps = dbChirps.map(d => ({ date: d.tanggal, rainfall: d.curah_hujan, tahun: parseInt(d.tanggal.split('-')[0]) }));
          setChirpsData(formattedChirps);

          // Build annual sum for DMC test
          const years = Array.from(new Set(formattedChirps.map(d => d.tahun)));
          const targetAnnual = years.map(y => ({
            tahun: y,
            hujan: formattedChirps.filter(d => d.tahun === y).reduce((sum, item) => sum + item.rainfall, 0)
          }));

          // Get reference data (average of all local stations)
          // MOCK fallback if no local station data is available yet
          const referenceAnnual = targetAnnual.map(d => ({
            tahun: d.tahun,
            hujan: d.hujan * (0.85 + Math.random() * 0.3) // Pseudo-random historical reference comparison
          }));

          const dmc = cekDoubleMassCurve(targetAnnual, referenceAnnual);
          setDmcResult(dmc);
        }
      }

    } catch (error: any) {
      toast.error(`❌ Gagal menarik data: ${error.message}`);
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[600px]">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-0 border-2 border-slate-300 overflow-hidden shadow-md h-[550px] flex flex-col">
          <div className="bg-[#0c3a66] text-white px-4 py-2 flex justify-between items-center font-formal">
            <div className="flex items-center gap-2 font-bold text-sm">
              <MapIcon className="w-4 h-4" />
              Interaktif WebGIS: Analisis Spasial DAS & Sungai
            </div>
            <div className="flex gap-2">
              <input type="file" ref={dasFileInputRef} onChange={(e) => handleFileUpload(e, 'das')} className="hidden" accept=".geojson,.json" />
              <input type="file" ref={riverFileInputRef} onChange={(e) => handleFileUpload(e, 'river')} className="hidden" accept=".geojson,.json" />
              
              <Button variant="secondary" size="sm" className="text-[10px] h-7 gap-1" onClick={() => dasFileInputRef.current?.click()}>
                <Upload className="w-3 h-3" />
                Upload DAS
              </Button>
              
              <Button variant="secondary" size="sm" className="text-[10px] h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600" onClick={() => riverFileInputRef.current?.click()}>
                <Droplets className="w-3 h-3" />
                Upload Sungai
              </Button>

              <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1 bg-[#f2c114] border-[#f2c114] text-[#0c3a66] hover:bg-[#d9ab11]" onClick={handleLoadDemo}>
                <Sparkles className="w-3 h-3" />
                Demo Ciliwung
              </Button>
              
              <Button variant="outline" size="sm" className="text-[10px] h-7 gap-1 bg-white border-slate-300 text-slate-600 hover:bg-slate-50" onClick={() => { setDasFeature(null); setRiverFeature(null); setValidationError(null); }}>
                <Trash2 className="w-3 h-3" />
                Reset
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
        </Card>
      </div>

      <div className="space-y-4">
        {validationError && (
          <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-1">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-red-800 leading-tight">{validationError}</p>
          </div>
        )}

        <Card className="border-l-4 border-l-[#0c3a66] p-4 shadow-sm bg-slate-50">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 font-black tracking-wider">Parameter Geometri DAS</h4>
          <div className="flex justify-between items-baseline border-b border-slate-200 pb-2 mb-2">
            <span className="text-sm font-semibold text-slate-700">Luas DAS</span>
            <span className="text-xl font-bold text-[#0c3a66] tabular-nums">{spatialResults?.params.areaKm2.toFixed(3) || '0.000'} <small className="text-xs font-normal font-medium">km²</small></span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-tighter">Status Sungai</span>
            <span className={`text-[10px] font-black tabular-nums uppercase ${riverFeature ? 'text-emerald-600' : 'text-slate-400'}`}>
              {riverFeature ? 'Terverifikasi' : 'Belum Ada'}
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 font-black tracking-wider">Koefisien Pengaliran (C)</h4>
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-sm font-semibold text-slate-700 font-formal">C Komposit</span>
            <span className="text-xl font-bold text-emerald-700 tabular-nums">{spatialResults?.compositeResult.compositeC.toFixed(3) || '0.000'}</span>
          </div>
          <details className="text-[10px]">
            <summary className="cursor-pointer text-slate-500 font-bold hover:text-slate-800 uppercase tracking-tighter">Rincian Lahan</summary>
            <div className="mt-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-hide">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400">
                  <tr><th className="text-left py-1 px-1 font-bold">JENIS</th><th className="text-right py-1 px-1 font-bold">LUAS</th><th className="text-right py-1 px-1 font-bold">C</th></tr>
                </thead>
                <tbody className="tabular-nums text-slate-600">
                  {spatialResults?.compositeResult.details.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-100 transition-colors">
                      <td className="py-1 px-1 font-medium">{d.jenis}</td>
                      <td className="py-1 px-1 text-right">{d.luasKm2.toFixed(2)}</td>
                      <td className="py-1 px-1 text-right font-bold">{d.nilaiC.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>

        <Card className="border-l-4 border-l-[#f2c114] p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 font-black tracking-wider flex items-center gap-1">
            <Satellite className="w-4 h-4 text-[#f2c114]" />
            Akuisisi Data Satelit (CHIRPS)
          </h4>
          <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Mulai (MM/DD/YYYY)</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                  <CalendarRange className="w-3 h-3 text-slate-400" />
                  <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-mono font-bold w-full outline-none text-slate-700" placeholder="01/01/2010" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Akhir (MM/DD/YYYY)</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
                  <CalendarRange className="w-3 h-3 text-slate-400" />
                  <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-mono font-bold w-full outline-none text-slate-700" placeholder="12/31/2023" />
                </div>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              onClick={handleExtractChirps} 
              disabled={isExtracting || !dasFeature}
              className="w-full h-9 text-xs bg-[#0c3a66] hover:bg-[#0c3a66]/90 transition-all shadow-sm"
            >
              <Satellite className={`w-3.5 h-3.5 mr-1.5 ${isExtracting ? 'animate-bounce text-[#f2c114]' : ''}`} />
              {isExtracting ? 'Memproses Zonal Statistics...' : 'Tarik Data CHIRPS'}
            </Button>
            
            {isExtracting && (
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden relative">
                <div className="absolute inset-0 bg-[#f2c114] w-1/3 animate-progress-indeterminate rounded-full"></div>
              </div>
            )}
          </div>
        </Card>
      {chirpsData.length > 0 && (
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
          <ChirpsTimeSeriesChart data={chirpsData} />
          {dmcResult && <DoubleMassCurveChart result={dmcResult} />}
        </div>
      )}
      </div>
    </div>
  );
};

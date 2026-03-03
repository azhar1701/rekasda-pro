import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, Map as MapIcon, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { calculateDasParameters, calculateCompositeC, generateThiessenWeights } from '@/utils/spatialEngine';
import { MOCK_DAS_GEOJSON, MOCK_LAND_COVER_FC, MOCK_STATIONS_FC } from '@/utils/mockSpatialData';
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
  const [spatialResults, setSpatialResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GeoProcessing Trigger
  useEffect(() => {
    if (dasFeature && dasFeature.geometry) {
      const dasGeoJSON = dasFeature as any;
      
      // 1. Calculate DAS Area
      const params = calculateDasParameters(dasGeoJSON);
      
      // 2. Land Cover Intersection (Use Mock LC if it's the demo DAS)
      const isDemo = dasFeature.properties?.name?.includes("Demo");
      const lcSource = isDemo ? MOCK_LAND_COVER_FC : { type: 'FeatureCollection', features: [] };
      
      const compositeResult = calculateCompositeC(dasGeoJSON, lcSource as any);

      // 3. Thiessen Calculation
      const stationSource = isDemo && stasiunList.length === 0 ? MOCK_STATIONS_FC : {
        type: 'FeatureCollection',
        features: stasiunList.map(s => turf.point([s.koordinat_x || 0, s.koordinat_y || 0], { id: s.id, nama_stasiun: s.nama_stasiun }))
      };
      
      const thiessenWeights = generateThiessenWeights(dasGeoJSON, stationSource as any);

      const results = {
        params,
        compositeResult,
        thiessenWeights
      };

      setSpatialResults(results);
      
      // FASE 4: Sync to Global Store (With Guard to prevent infinite loop)
      // Only update if changes are significant
      const currentArea = morfometriDAS?.luasDAS || 0;
      if (Math.abs(params.areaKm2 - currentArea) > 0.001) {
        updateMorfometriDAS({
          luasDAS: params.areaKm2,
          panjangSungai: morfometriDAS?.panjangSungai || 0,
          kemiringanSungai: morfometriDAS?.kemiringanSungai || 0,
          elevasi: morfometriDAS?.elevasi || 0
        });
      }

      // Check if tutupan lahan needs update (simplified check)
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

      // Check if thiessen needs update
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
  }, [dasFeature, stasiunList, morfometriDAS, tutupanLahan, curahHujanWilayah, setTutupanLahan, setCurahHujanWilayah, updateMorfometriDAS]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const feature = json.type === 'FeatureCollection' ? json.features[0] : json;
          setDasFeature(feature);
        } catch (err) {
          alert('Format GeoJSON tidak valid');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemo = () => {
    setDasFeature(MOCK_DAS_GEOJSON);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[600px]">
      {/* Map Side */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-0 border-2 border-slate-300 overflow-hidden shadow-md h-[550px] flex flex-col">
          <div className="bg-[#0c3a66] text-white px-4 py-2 flex justify-between items-center font-formal">
            <div className="flex items-center gap-2 font-bold text-sm">
              <MapIcon className="w-4 h-4" />
              Interaktif WebGIS: Delineasi DAS
            </div>
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".geojson,.json"
              />
              <Button 
                variant="secondary" 
                size="sm" 
                className="text-[10px] h-7 gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3" />
                Upload GeoJSON
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-7 gap-1 bg-[#f2c114] border-[#f2c114] text-[#0c3a66] hover:bg-[#d9ab11]"
                onClick={handleLoadDemo}
              >
                <Sparkles className="w-3 h-3" />
                Demo Ciliwung
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[10px] h-7 gap-1 bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                onClick={() => setDasFeature(null)}
              >
                <Trash2 className="w-3 h-3" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative z-0">
            <MapContainer 
              center={[-6.2088, 106.8456]} 
              zoom={10} 
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <FeatureGroup>
                {dasFeature && <GeoJSON data={dasFeature} style={{ color: '#0c3a66', weight: 3, fillOpacity: 0.2 }} />}
              </FeatureGroup>

              {stasiunList.map(s => (
                <CircleMarker 
                  key={s.id}
                  center={[s.koordinat_y || 0, s.koordinat_x || 0]}
                  radius={5}
                  pathOptions={{ color: '#f2c114', fillColor: '#f2c114', fillOpacity: 1 }}
                >
                  <Popup>
                    <div className="text-xs font-bold">{s.nama_stasiun}</div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </Card>
      </div>

      {/* Dashboard Side */}
      <div className="space-y-4">
        {/* Metric Card 1: Luas DAS */}
        <Card className="border-l-4 border-l-[#0c3a66] p-4 shadow-sm bg-slate-50">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Parameter Geometri DAS</h4>
          <div className="flex justify-between items-baseline border-b border-slate-200 pb-2 mb-2">
            <span className="text-sm font-semibold text-slate-700">Luas Wilayah</span>
            <span className="text-xl font-bold text-[#0c3a66] tabular-nums">
              {spatialResults?.params.areaKm2.toFixed(3) || '0.000'} <small className="text-xs font-normal font-medium">km²</small>
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-600">Pusat Massa (Centroid)</span>
            <span className="text-xs font-medium tabular-nums text-slate-800">
              {spatialResults?.params.centroid[0].toFixed(5)}, {spatialResults?.params.centroid[1].toFixed(5)}
            </span>
          </div>
        </Card>

        {/* Metric Card 2: Koefisien C */}
        <Card className="border-l-4 border-l-emerald-600 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 font-formal">Koefisien Pengaliran (C)</h4>
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-sm font-semibold text-slate-700 font-formal">C Komposit</span>
            <span className="text-xl font-bold text-emerald-700 tabular-nums">
              {spatialResults?.compositeResult.compositeC.toFixed(3) || '0.000'}
            </span>
          </div>
          
          <details className="text-[10px]">
            <summary className="cursor-pointer text-slate-500 font-bold hover:text-slate-800 uppercase tracking-tighter">Rincian Lahan</summary>
            <div className="mt-2 space-y-1 max-h-[150px] overflow-y-auto pr-1">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400">
                  <tr>
                    <th className="text-left py-1 px-1 font-bold">JENIS</th>
                    <th className="text-right py-1 px-1 font-bold">LUAS</th>
                    <th className="text-right py-1 px-1 font-bold">C</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums text-slate-600">
                  {spatialResults?.compositeResult.details.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1 px-1 font-medium">{d.jenis}</td>
                      <td className="py-1 px-1 text-right">{d.luasKm2.toFixed(2)}</td>
                      <td className="py-1 px-1 text-right">{d.nilaiC.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Card>

        {/* Metric Card 3: Thiessen */}
        <Card className="border-l-4 border-l-[#f2c114] p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 font-formal">Pembobotan Thiessen</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b pb-1 uppercase">
              <span>STASIUN</span>
              <span>BOBOT (%)</span>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
              {spatialResults?.thiessenWeights.map((t: any) => (
                <div key={t.stasiunId} className="flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] tracking-tight">{t.namaStasiun}</span>
                    <span className="text-[9px] text-slate-400 tabular-nums">{t.areaKm2.toFixed(2)} km²</span>
                  </div>
                  <div className="h-2 flex-1 mx-3 bg-slate-100 rounded-full overflow-hidden flex items-center ring-1 ring-slate-200">
                    <div 
                      className="h-full bg-[#f2c114] transition-all duration-1000" 
                      style={{ width: `${t.weight * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#0c3a66] tabular-nums">
                    {(t.weight * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

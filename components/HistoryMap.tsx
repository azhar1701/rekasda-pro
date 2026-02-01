
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CalculationResult, CalculationType } from '../types';

interface Props {
  data: CalculationResult[];
}

export const HistoryMap: React.FC<Props> = ({ data }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
    }

    if (!mapContainerRef.current) return;

    const validData = data.filter(item => {
      const hasLocation = item.location && 
                         typeof item.location.latitude === 'number' && 
                         typeof item.location.longitude === 'number' &&
                         !isNaN(item.location.latitude) &&
                         !isNaN(item.location.longitude) &&
                         item.location.latitude !== 0 &&
                         item.location.longitude !== 0;
      
      if (!hasLocation) {
        console.log('Item without valid location:', item.id, item.location);
      }
      
      return hasLocation;
    });
    
    console.log(`HistoryMap: Total items: ${data.length}, Valid locations: ${validData.length}`);
    if (validData.length > 0) {
      console.log('First valid location:', validData[0].location);
    }
    
    const defaultCenter: [number, number] = [-6.9175, 107.6191]; 
    const initialCenter = validData.length > 0 
      ? [validData[0].location!.latitude, validData[0].location!.longitude] as [number, number]
      : defaultCenter;

    const map = L.map(mapContainerRef.current, {
        zoomControl: false
    }).setView(initialCenter, 13);
    
    mapInstanceRef.current = map;
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const redIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

    const bounds = L.latLngBounds([]);

    validData.forEach(item => {
        if (!item.location) return;
        
        const { latitude, longitude } = item.location;
        const icon = item.type === CalculationType.MANNING ? blueIcon : redIcon;
        const colorClass = item.type === CalculationType.MANNING ? 'text-blue-600' : 'text-red-600';

        L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px;">
                <div style="margin-bottom: 4px;">
                    <span class="text-[10px] font-bold uppercase tracking-widest ${colorClass} bg-gray-100 px-2 py-0.5 rounded">${item.type}</span>
                </div>
                <h3 style="font-weight: 800; font-size: 14px; color: #111; margin: 0 0 4px 0;">${item.inputs.site?.channelName || 'Tanpa Nama'}</h3>
                <p style="font-size: 11px; color: #666; margin: 0 0 8px 0;">
                    ${new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                </p>
                <div style="background: #f8fafc; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong style="display:block; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Output Utama</strong>
                    <span style="font-size: 16px; font-weight: 900; color: #0f172a;">${item.outputs.Discharge} m³/s</span>
                </div>
            </div>
        `);
        
        bounds.extend([latitude, longitude]);
    });

    if (validData.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 200);

    return () => {
        map.remove();
        mapInstanceRef.current = null;
    };
  }, [data]);

  return (
    <div className="relative w-full h-[350px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-lg border border-gray-200 z-0 bg-slate-100">
         <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
         
         {data.length === 0 && (
             <div className="absolute inset-0 bg-white/80 z-[1000] flex items-center justify-center backdrop-blur-sm">
                 <div className="text-center">
                    <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    <p className="font-bold text-gray-400 text-sm">Belum ada data lokasi.</p>
                 </div>
             </div>
         )}
    </div>
  );
};

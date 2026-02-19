import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CalculationResult, CalculationType } from '@/types/types';

interface Props {
  data: CalculationResult[];
  onViewDetail?: (item: CalculationResult) => void;
  focusItemId?: string;
}

export const HistoryMap: React.FC<Props> = ({ data, onViewDetail, focusItemId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<CalculationResult | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<CalculationResult | null>(null);

  useEffect(() => {
    // Cleanup previous map instance safely
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (error) {
        console.warn('Error removing previous map:', error);
      }
      mapInstanceRef.current = null;
    }

    // Validate container exists
    if (!mapContainerRef.current) {
      console.warn('HistoryMap: Container ref not available');
      return;
    }

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
    
    try {
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

      const blueIconLarge = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [35, 57],
        iconAnchor: [17, 57],
        popupAnchor: [1, -48],
        shadowSize: [57, 57]
      });

      const redIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

      const redIconLarge = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [35, 57],
          iconAnchor: [17, 57],
          popupAnchor: [1, -48],
          shadowSize: [57, 57]
        });

      const greenIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

      const greenIconLarge = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [35, 57],
          iconAnchor: [17, 57],
          popupAnchor: [1, -48],
          shadowSize: [57, 57]
        });



      // Add scale control
      L.control.scale({ position: 'bottomright', imperial: false, metric: true }).addTo(map);

      const bounds = L.latLngBounds([]);

      validData.forEach(item => {
          if (!item.location) return;
          
          const { latitude, longitude } = item.location;
          
          // Validate coordinates one more time
          if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
              isNaN(latitude) || isNaN(longitude)) {
            console.warn('Skipping item with invalid coordinates:', item.id);
            return;
          }

          const isManning = item.type === CalculationType.MANNING;
          const isWater = item.type === 'WATER_BALANCE';
          
          let icon, iconLarge, colorClass, bgClass;
          
          if (isManning) {
            icon = blueIcon;
            iconLarge = blueIconLarge;
            colorClass = '#2563eb';
            bgClass = '#eff6ff';
          } else if (isWater) {
            icon = greenIcon;
            iconLarge = greenIconLarge;
            colorClass = '#059669';
            bgClass = '#f0fdf4';
          } else {
            icon = redIcon;
            iconLarge = redIconLarge;
            colorClass = '#dc2626';
            bgClass = '#fef2f2';
          }

          try {
            const marker = L.marker([latitude, longitude], { icon })
              .addTo(map);
            
            // Auto-open popup if this is the focused item
            if (focusItemId && item.id === focusItemId) {
              setTimeout(() => {
                marker.openPopup();
              }, 1800);
            }
            
            // Hover effect
            marker.on('mouseover', function() {
              this.setIcon(iconLarge);
              setHoveredMarker(item);
            });
            
            marker.on('mouseout', function() {
              this.setIcon(icon);
              setHoveredMarker(null);
            });
            
            // Click to show detail
            marker.on('click', () => {
              if (onViewDetail) {
                onViewDetail(item);
              } else {
                setSelectedMarker(item);
              }
            });
            
            marker.bindPopup(`
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px; max-width: 240px;">
                    <div style="margin-bottom: 6px;">
                        <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${colorClass}; background: ${bgClass}; padding: 3px 8px; border-radius: 4px;">${item.type}</span>
                    </div>
                    <h3 style="font-weight: 700; font-size: 13px; color: #0f172a; margin: 0 0 4px 0; line-height: 1.3;">${item.inputs.site?.channelName || 'Tanpa Nama'}</h3>
                    <p style="font-size: 10px; color: #64748b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 3px;">
                        <svg style="width: 10px; height: 10px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </p>
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
                        <strong style="display:block; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px;">Output Utama</strong>
                        <div style="display: flex; align-items: baseline; gap: 4px;">
                          <span style="font-size: 18px; font-weight: 800; color: #0f172a;">${item.outputs.Discharge}</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b;">m³/s</span>
                        </div>
                    </div>
                </div>
            `, { maxWidth: 240, closeButton: true });
            
            bounds.extend([latitude, longitude]);
          } catch (markerError) {
            console.error('Error adding marker for item:', item.id, markerError);
          }
      });

      // Only fit bounds if we have valid markers
      if (validData.length > 0 && bounds.isValid?.()) {
        try {
          if (focusItemId) {
            const focusItem = validData.find(item => item.id === focusItemId);
            if (focusItem && focusItem.location) {
              setTimeout(() => {
                map.flyTo([focusItem.location!.latitude, focusItem.location!.longitude], 15, {
                  duration: 1.5
                });
              }, 300);
            } else {
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
            }
          } else {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        } catch (boundsError) {
          console.warn('Error fitting bounds:', boundsError);
        }
      }

      // Invalidate size with safety check
      const timeoutId = setTimeout(() => {
          if (mapInstanceRef.current && mapInstanceRef.current.getContainer()) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch (sizeError) {
              console.warn('Error invalidating map size:', sizeError);
            }
          }
      }, 200);

      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
        
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }
        } catch (cleanupError) {
          console.warn('Error in cleanup:', cleanupError);
        }
        
        mapInstanceRef.current = null;
      };
    } catch (error) {
      console.error('Fatal error initializing HistoryMap:', error);
      
      return () => {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
          }
        } catch (cleanupError) {
          console.warn('Error in cleanup:', cleanupError);
        }
        
        mapInstanceRef.current = null;
      };
    }
  }, [data, focusItemId]);

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0 bg-slate-50">
         <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
         
         {/* Hover Info Card - Compact */}
         {hoveredMarker && !selectedMarker && (
           <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[1000] bg-white rounded-lg shadow-xl p-3 sm:p-4 max-w-[280px] pointer-events-none">
             <div className={`inline-block px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold mb-1.5 ${hoveredMarker.type === CalculationType.MANNING ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
               {hoveredMarker.type}
             </div>
             <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 line-clamp-1">{hoveredMarker.inputs.site?.channelName || 'Tanpa Nama'}</h3>
             <p className="text-[10px] sm:text-xs text-slate-500 mb-2 flex items-center gap-1">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               {new Date(hoveredMarker.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
             </p>
             <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-2.5 rounded-md border border-slate-200">
               <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wide block mb-0.5">Output</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-lg sm:text-xl font-black text-slate-900">{hoveredMarker.outputs.Discharge}</span>
                 <span className="text-[10px] sm:text-xs font-semibold text-slate-600">m³/s</span>
               </div>
             </div>
             <p className="text-[9px] sm:text-[10px] text-slate-400 mt-2 text-center">Klik untuk detail lengkap</p>
           </div>
         )}
         
         {/* Floating Info Card - Mobile Optimized */}
         {selectedMarker && (
           <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] bg-white rounded-xl shadow-2xl p-4 sm:p-5 w-[calc(100%-1rem)] sm:w-auto sm:max-w-sm animate-in slide-in-from-right duration-300">
             <button 
               onClick={() => setSelectedMarker(null)}
               className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
             >
               <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <div className={`inline-block px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 ${selectedMarker.type === CalculationType.MANNING ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
               {selectedMarker.type}
             </div>
             <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-1.5 sm:mb-2 pr-6">{selectedMarker.inputs.site?.channelName || 'Tanpa Nama'}</h3>
             <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4 flex items-center gap-1">
               <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               {new Date(selectedMarker.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
             </p>
             <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 rounded-lg border border-slate-200">
               <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Output Utama</span>
               <div className="flex items-baseline gap-1.5 sm:gap-2">
                 <span className="text-2xl sm:text-3xl font-black text-slate-900">{selectedMarker.outputs.Discharge}</span>
                 <span className="text-xs sm:text-sm font-semibold text-slate-600">m³/s</span>
               </div>
             </div>
             <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200">
               <p className="text-[10px] sm:text-xs text-slate-600">
                 <span className="font-semibold">Lokasi:</span> {selectedMarker.location?.latitude.toFixed(6)}, {selectedMarker.location?.longitude.toFixed(6)}
               </p>
             </div>
           </div>
         )}
         
         {data.length === 0 && (
           <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80">
                 <div className="text-center px-4">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">Belum ada data lokasi</p>
                 </div>
             </div>
         )}
    </div>
  );
};

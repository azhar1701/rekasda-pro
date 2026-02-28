import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CalculationResult, CalculationType, ExtendedCalculationType } from '@/types/types';

interface Props {
  data: CalculationResult[];
  onViewDetail?: (item: CalculationResult) => void;
  focusItemId?: string;
}

// ─── Centralized type → visual mapping ────────────────────────────────
function getTypeInfo(type: CalculationType | ExtendedCalculationType) {
  const isManning = type === CalculationType.MANNING;
  const isWater = type === CalculationType.WATER_BALANCE;

  if (isManning) return {
    label: 'Saluran Manning',
    outputLabel: 'Kapasitas Saluran',
    color: '#2563eb', bg: '#eff6ff',
    badgeClass: 'bg-blue-100 text-blue-700',
    zOffset: 200,    // middle layer
    iconColor: 'blue' as const,
  };
  if (isWater) return {
    label: 'Neraca Air',
    outputLabel: 'Ketersediaan Total',
    color: '#059669', bg: '#f0fdf4',
    badgeClass: 'bg-green-100 text-green-700',
    zOffset: 100,    // bottom layer
    iconColor: 'green' as const,
  };
  // default = RATIONAL / flood
  return {
    label: 'Banjir Rasional',
    outputLabel: 'Debit Puncak',
    color: '#dc2626', bg: '#fef2f2',
    badgeClass: 'bg-red-100 text-red-700',
    zOffset: 300,    // top layer  (so red always visible when overlapping)
    iconColor: 'red' as const,
  };
}

// ─── Icon factory (cached) ────────────────────────────────────────────
function buildIcons(color: 'blue' | 'red' | 'green') {
  const url = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`;
  const shadow = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';
  return {
    normal: L.icon({ iconUrl: url, shadowUrl: shadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
    large: L.icon({ iconUrl: url, shadowUrl: shadow, iconSize: [35, 57], iconAnchor: [17, 57], popupAnchor: [1, -48], shadowSize: [57, 57] }),
  };
}

export const HistoryMap: React.FC<Props> = ({ data, onViewDetail, focusItemId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<CalculationResult | null>(null);
  const prevFocusIdRef = useRef<string | undefined>(undefined);

  // Expose onViewDetail globally so the raw-HTML popup button can call it
  useEffect(() => {
    (window as any).__mapPopupDetail = (id: string) => {
      const item = data.find(d => d.id === id);
      if (item) {
        if (onViewDetail) onViewDetail(item);
        else setSelectedMarker(item);
      }
    };
    return () => { delete (window as any).__mapPopupDetail; };
  }, [data, onViewDetail]);

  // ─── Main map effect ──────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) {
      try { mapInstanceRef.current.remove(); } catch (_) { /* */ }
      mapInstanceRef.current = null;
    }
    if (!mapContainerRef.current) return;

    const validData = data.filter(item => {
      const loc = item.location;
      return loc &&
        typeof loc.latitude === 'number' && typeof loc.longitude === 'number' &&
        !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
        loc.latitude !== 0 && loc.longitude !== 0;
    });

    try {
      const defaultCenter: [number, number] = [-6.9175, 107.6191];
      const initialCenter = validData.length > 0
        ? [validData[0].location!.latitude, validData[0].location!.longitude] as [number, number]
        : defaultCenter;

      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(initialCenter, 13);
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);
      L.control.scale({ position: 'bottomright', imperial: false, metric: true }).addTo(map);

      // Pre-build icons for the 3 colors
      const icons = {
        blue: buildIcons('blue'),
        red: buildIcons('red'),
        green: buildIcons('green'),
      };

      const bounds = L.latLngBounds([]);

      // ── Create markers ────────────────────────────────────────────
      validData.forEach(item => {
        if (!item.location) return;
        const { latitude, longitude } = item.location;
        if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) return;

        const info = getTypeInfo(item.type);
        const icon = icons[info.iconColor].normal;
        const iconLarge = icons[info.iconColor].large;

        const marker = L.marker([latitude, longitude], {
          icon,
          zIndexOffset: info.zOffset,  // avoids visual overlap confusion
        }).addTo(map);

        // Attach custom ID so we can target this exact marker later
        (marker as any).customId = item.id;

        // Auto-open popup if this is the focused item (initial load)
        if (focusItemId && item.id === focusItemId) {
          marker.setZIndexOffset(9000); // bring to absolute front
          setTimeout(() => marker.openPopup(), 1800);
        }

        // Hover effects
        marker.on('mouseover', function (this: L.Marker) { this.setIcon(iconLarge); });
        marker.on('mouseout', function (this: L.Marker) { this.setIcon(icon); });

        // Click → detail
        marker.on('click', () => {
          if (onViewDetail) onViewDetail(item);
          else setSelectedMarker(item);
        });

        // ── Popup HTML ────────────────────────────────────────────
        marker.bindPopup(`
          <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:200px;max-width:240px">
            <div style="margin-bottom:6px">
              <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:${info.color};background:${info.bg};padding:3px 8px;border-radius:4px">${info.label}</span>
            </div>
            <h3 style="font-weight:700;font-size:13px;color:#0f172a;margin:0 0 4px;line-height:1.3">${item.inputs.site?.channelName || 'Tanpa Nama'}</h3>
            <p style="font-size:10px;color:#64748b;margin:0 0 8px;display:flex;align-items:center;gap:3px">
              <svg style="width:10px;height:10px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              ${new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);padding:10px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:8px">
              <strong style="display:block;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px">${info.outputLabel}</strong>
              <div style="display:flex;align-items:baseline;gap:4px">
                <span style="font-size:18px;font-weight:800;color:#0f172a">${item.outputs.Discharge}</span>
                <span style="font-size:11px;font-weight:600;color:#64748b">m³/s</span>
              </div>
            </div>
            <button onclick="window.__mapPopupDetail('${item.id}')" style="width:100%;appearance:none;border:none;background:#0f172a;color:#fff;border-radius:6px;padding:8px 12px;font-size:11px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">
              <svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              Lihat Detail Analisis
            </button>
          </div>
        `, { maxWidth: 240, closeButton: true });

        bounds.extend([latitude, longitude]);
      });

      // Fit bounds only when NOT focusing a specific marker
      if (validData.length > 0 && bounds.isValid?.() && !focusItemId) {
        try { map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 }); } catch (_) { /* */ }
      }

      const tid = setTimeout(() => {
        if (mapInstanceRef.current?.getContainer()) {
          try { mapInstanceRef.current.invalidateSize(); } catch (_) { /* */ }
        }
      }, 200);

      return () => {
        clearTimeout(tid);
        try { mapInstanceRef.current?.remove(); } catch (_) { /* */ }
        mapInstanceRef.current = null;
      };
    } catch (error) {
      console.error('Fatal error initializing HistoryMap:', error);
      return () => {
        try { mapInstanceRef.current?.remove(); } catch (_) { /* */ }
        mapInstanceRef.current = null;
      };
    }
  }, [data]);

  // ─── Focus effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!focusItemId || !mapInstanceRef.current || prevFocusIdRef.current === focusItemId) return;
    prevFocusIdRef.current = focusItemId;
    const focusItem = data.find(item => item.id === focusItemId);

    if (focusItem?.location) {
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && (layer as any).customId === focusItem.id) {
          // Bring this specific marker to front so it's visually on top
          layer.setZIndexOffset(9000);
          const latLng = layer.getLatLng();
          mapInstanceRef.current?.flyTo(latLng, 16, { duration: 1.5 });
          setTimeout(() => layer.openPopup(), 1500);
        }
      });
    }
  }, [focusItemId, data]);

  // ─── Helpers for floating card ─────────────────────────────────────
  const selInfo = selectedMarker ? getTypeInfo(selectedMarker.type) : null;

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-md overflow-hidden shadow-sm border border-slate-200 z-0 bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* Floating Info Card — handles all 3 types */}
      {selectedMarker && selInfo && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] bg-white rounded-md shadow-sm p-4 sm:p-5 w-[calc(100%-1rem)] sm:w-auto sm:max-w-sm animate-in slide-in-from-right duration-300">
          <button
            onClick={() => setSelectedMarker(null)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Type badge — color synced with marker */}
          <div className={`inline-block px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 ${selInfo.badgeClass}`}>
            {selInfo.label}
          </div>

          <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-1.5 sm:mb-2 pr-6">{selectedMarker.inputs.site?.channelName || 'Tanpa Nama'}</h3>
          <p className="text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-4 flex items-center gap-1">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {new Date(selectedMarker.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="bg-pupr-blue text-white p-3 sm:p-4 rounded-md border border-slate-200">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{selInfo.outputLabel}</span>
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

          <button
            onClick={() => { if (onViewDetail) onViewDetail(selectedMarker); }}
            className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-md text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Tampilkan Detail Analisis
          </button>
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

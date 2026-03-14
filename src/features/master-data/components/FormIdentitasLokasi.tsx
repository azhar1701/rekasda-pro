import React, { useMemo, useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Briefcase, Navigation, Map as MapIcon, Info, Activity } from 'lucide-react';
import { useOnboarding } from '@/providers/OnboardingProvider';

// Leaflet imports
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet's default icon issue with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Pusat peta default: Indonesia (Jakarta)
const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 5;

// Komponen MapEvents untuk menangkap interaksi peta
const LocationMarker = ({ position, setPosition }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void }) => {
  const markerRef = useRef<L.Marker>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    [setPosition],
  );

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

export const FormIdentitasLokasi: React.FC = () => {
  const { identitasLokasi, setIdentitasLokasi } = useHydrologyStore();
  const { completeStep } = useOnboarding();
  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'namaPekerjaan' && value.length > 3) {
      completeStep('identitas');
    }
    if (name === 'lat' || name === 'lng') {
      const parsedValue = value === '' ? null : parseFloat(value);
      setIdentitasLokasi({
        koordinat: {
          ...identitasLokasi.koordinat,
          [name]: parsedValue
        }
      });
    } else {
      setIdentitasLokasi({ [name]: value });
    }
  };

  const handleMapPositionChange = (latlng: L.LatLng) => {
    // Membatasi desimal maksimal 6 digit (standard presisi GPS sub-meter)
    const lat = Number(latlng.lat.toFixed(6));
    const lng = Number(latlng.lng.toFixed(6));

    setIsSyncing(true);
    setIdentitasLokasi({
      koordinat: {
        lat,
        lng
      }
    });

    // Simulate Spatial Engine Auto-fetch (DEM & LandUse)
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  // State koordinat untuk map
  const mapCenter: [number, number] =
    identitasLokasi.koordinat.lat != null && identitasLokasi.koordinat.lng != null
      ? [identitasLokasi.koordinat.lat, identitasLokasi.koordinat.lng]
      : DEFAULT_CENTER;

  const markerPosition =
    identitasLokasi.koordinat.lat != null && identitasLokasi.koordinat.lng != null
      ? new L.LatLng(identitasLokasi.koordinat.lat, identitasLokasi.koordinat.lng)
      : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none overflow-hidden flex flex-col">
      {/* Professional Header */}
      <div className="bg-pupr-blue text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-pupr-yellow" />
          <div className="flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider leading-tight">Identitas Lokasi & Koordinat</h3>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-medium">Data Master Referensi Spasial</span>
          </div>
        </div>
        {isSyncing && (
          <div className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-none animate-pulse border border-white/20">
            <Activity className="w-3.5 h-3.5 text-pupr-yellow" />
            <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Spatial Sync Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-300 dark:divide-slate-700">
        {/* Kolom Kiri: Form Identitas Tabular */}
        <div className="xl:col-span-4 flex flex-col bg-white dark:bg-slate-900 border-b border-pupr-blue xl:border-b-0 min-h-[400px]">
          
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-t-2 border-t-pupr-blue/10">
            Informasi Proyek
          </div>

          <div className="grid grid-cols-[135px_1fr] text-sm text-slate-800 dark:text-slate-200">
            {/* Row: Pekerjaan */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Nama Pekerjaan
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group">
              <input
                type="text"
                name="namaPekerjaan"
                value={identitasLokasi.namaPekerjaan}
                onChange={handleChange}
                placeholder="Perencanaan Bendungan X"
                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm font-semibold transition-colors"
              />
            </div>

            {/* Row: DAS */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Nama DAS
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group">
              <input
                type="text"
                name="namaDAS"
                value={identitasLokasi.namaDAS}
                onChange={handleChange}
                placeholder="DAS Citarum"
                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm font-semibold transition-colors"
              />
            </div>

            {/* Row: Sungai */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Nama Sungai
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group">
              <input
                type="text"
                name="namaSungai"
                value={identitasLokasi.namaSungai}
                onChange={handleChange}
                placeholder="Sungai Ciliwung"
                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm font-semibold transition-colors"
              />
            </div>

            {/* Row: Provinsi */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Provinsi
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group">
              <input
                type="text"
                name="provinsi"
                value={identitasLokasi.provinsi}
                onChange={handleChange}
                placeholder="Jawa Barat"
                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm font-semibold transition-colors"
              />
            </div>

            {/* Row: Kabupaten */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Kabupaten/Kota
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group">
              <input
                type="text"
                name="kabupaten"
                value={identitasLokasi.kabupaten}
                onChange={handleChange}
                placeholder="Bogor"
                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm font-semibold transition-colors"
              />
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-auto border-t-4 border-t-pupr-surface border-x-0">
            <Navigation className="w-3.5 h-3.5 text-pupr-blue" /> Koordinat Geografis (WGS84)
          </div>

          <div className="grid grid-cols-[135px_1fr] text-sm text-slate-800 dark:text-slate-200 relative">
            {/* Row: Latitude */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Latitude (y)
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group bg-[#fdfdfd] dark:bg-slate-900">
              <input
                type="number"
                step="any"
                name="lat"
                value={identitasLokasi.koordinat.lat ?? ''}
                onChange={handleChange}
                placeholder="-6.1754"
                className="w-full h-full min-h-[40px] px-3 py-2 font-mono tabular-nums tracking-tighter bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm text-pupr-blue dark:text-blue-400 font-bold transition-colors"
              />
            </div>

            {/* Row: Longitude */}
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center font-bold text-slate-600 dark:text-slate-400 text-xs">
              Longitude (x)
            </div>
            <div className="p-0 border-b border-slate-200 dark:border-slate-800 border-l relative group bg-[#fdfdfd] dark:bg-slate-900">
              <input
                type="number"
                step="any"
                name="lng"
                value={identitasLokasi.koordinat.lng ?? ''}
                onChange={handleChange}
                placeholder="106.8272"
                className="w-full h-full min-h-[40px] px-3 py-2 font-mono tabular-nums tracking-tighter bg-transparent outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/20 focus:ring-inset focus:ring-1 focus:ring-pupr-blue text-sm text-pupr-blue dark:text-blue-400 font-bold transition-colors"
              />
            </div>
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-900 text-[10px] font-medium text-slate-500 flex items-center flex-col sm:flex-row gap-2 h-full">
            <Info className="w-4 h-4 text-pupr-blue shrink-0" />
            <p className="leading-tight text-center sm:text-left">Klik pada kanvas Peta secara interaktif untuk menentukan kordinat secara otomatis.</p>
          </div>
        </div>

        {/* Kolom Kanan: WebGIS Leaflet */}
        <div className="xl:col-span-8 flex flex-col h-[450px] xl:h-[500px] relative bg-slate-100 dark:bg-slate-800 p-0 m-0">
          <div className="absolute top-3 left-3 z-[1000] bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-700 shadow-sm rounded-none">
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-pupr-blue" />
              Interactive Workstation Map
            </p>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={markerPosition ? 12 : DEFAULT_ZOOM}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker
              position={markerPosition}
              setPosition={handleMapPositionChange}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

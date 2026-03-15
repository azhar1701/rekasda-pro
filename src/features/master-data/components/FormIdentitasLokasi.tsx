import React, { useMemo, useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { ProjectContextBanner } from '@/components/ui/ProjectContextBanner';
import { Map as MapIcon, Info, Activity } from 'lucide-react';
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
    <div className="space-y-8 p-1">
      <ProjectContextBanner />

      {/* Header: Flattened & Quieter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-slate-700 pb-8">
        <div>
          <h2 className="text-3xl font-medium text-[#1e293b] dark:text-slate-100 tracking-tight">Identitas Lokasi & Koordinat</h2>
          <p className="text-sm text-slate-500 mt-1">Data master referensi spasial dan informasi proyek terpusat</p>
        </div>

        {isSyncing && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-pupr-surface border border-pupr-border animate-pulse">
            <Activity className="w-4 h-4 text-pupr-blue" />
            <span className="text-[10px] font-bold text-pupr-blue uppercase tracking-wider">Spatial Sync Active</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Kolom Kiri: Form Identitas Tabular */}
        <div className="lg:col-span-4 space-y-8">
          
          <section className="space-y-6">
            <header className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Informasi Proyek</h3>
            </header>

            <div className="space-y-4">
              {[
                { label: 'Nama Pekerjaan', name: 'namaPekerjaan', placeholder: 'Perencanaan Bendungan X' },
                { label: 'Nama DAS', name: 'namaDAS', placeholder: 'DAS Citarum' },
                { label: 'Nama Sungai', name: 'namaSungai', placeholder: 'Sungai Ciliwung' },
                { label: 'Provinsi', name: 'provinsi', placeholder: 'Jawa Barat' },
                { label: 'Kabupaten/Kota', name: 'kabupaten', placeholder: 'Bogor' },
              ].map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    name={field.name}
                    value={(identitasLokasi as any)[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-pupr-blue focus:ring-1 focus:ring-pupr-blue/20 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <header className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pupr-blue"></div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Koordinat Geografis (WGS84)</h3>
            </header>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Latitude (Y)</label>
                <input
                  type="number"
                  step="any"
                  name="lat"
                  value={identitasLokasi.koordinat.lat ?? ''}
                  onChange={handleChange}
                  placeholder="-6.1754"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-sm font-bold text-pupr-blue dark:text-blue-400 font-mono tabular-nums focus:border-pupr-blue outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Longitude (X)</label>
                <input
                  type="number"
                  step="any"
                  name="lng"
                  value={identitasLokasi.koordinat.lng ?? ''}
                  onChange={handleChange}
                  placeholder="106.8272"
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm text-sm font-bold text-pupr-blue dark:text-blue-400 font-mono tabular-nums focus:border-pupr-blue outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-sm border border-slate-100 dark:border-slate-800">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-pupr-blue shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                  Gunakan kanvas peta interaktif untuk menentukan koordinat secara otomatis dengan sekali klik.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Kolom Kanan: WebGIS Leaflet */}
        <div className="lg:col-span-8 space-y-6">
          <section className="h-full flex flex-col space-y-6">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interactive Workstation Map</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500 uppercase">
                <MapIcon className="w-3 h-3" />
                Leaflet Engine
              </div>
            </header>

            <div className="flex-1 min-h-[500px] border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden relative group">
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
              
              {/* Corner Accents - Engineering Feel */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pupr-blue/20 z-[1000] pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pupr-blue/20 z-[1000] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pupr-blue/20 z-[1000] pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pupr-blue/20 z-[1000] pointer-events-none"></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

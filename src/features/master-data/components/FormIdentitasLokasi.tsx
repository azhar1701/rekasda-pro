import React, { useMemo, useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Card } from '@/components/ui/Card';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { Briefcase, Navigation, Map as MapIcon, Info } from 'lucide-react';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
    
    setIdentitasLokasi({
      koordinat: {
        lat,
        lng
      }
    });
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
    <Card className="p-6 bg-white shadow-md border border-slate-200 rounded-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#0c3a66]/10 rounded-md">
          <Briefcase className="w-5 h-5 text-[#0c3a66]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Identitas Lokasi & Koordinat</h3>
          <p className="text-xs text-slate-500 font-medium">Data master untuk referensi spasial PostGIS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kolom Kiri: Form Identitas */}
        <div className="space-y-4">
          <InputGroup
            id="namaPekerjaan"
            name="namaPekerjaan"
            label="Nama Pekerjaan / Proyek"
            value={identitasLokasi.namaPekerjaan}
            onChange={handleChange}
            placeholder="Contoh: Perencanaan Bendungan X"
          />
          <InputGroup
            id="namaDAS"
            name="namaDAS"
            label="Nama Daerah Aliran Sungai (DAS)"
            value={identitasLokasi.namaDAS}
            onChange={handleChange}
            placeholder="Contoh: DAS Citarum"
          />
          <InputGroup
            id="namaSungai"
            name="namaSungai"
            label="Nama Sungai"
            value={identitasLokasi.namaSungai}
            onChange={handleChange}
            placeholder="Contoh: Sungai Ciliwung"
          />
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <InputGroup
              id="provinsi"
              name="provinsi"
              label="Provinsi"
              value={identitasLokasi.provinsi}
              onChange={handleChange}
              placeholder="Jawa Barat"
            />
            <InputGroup
              id="kabupaten"
              name="kabupaten"
              label="Kabupaten/Kota"
              value={identitasLokasi.kabupaten}
              onChange={handleChange}
              placeholder="Bogor"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md mt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Navigation className="w-3.5 h-3.5" /> Koordinat Geografis (WGS84)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                id="lat"
                name="lat"
                label="Latitude"
                type="number"
                step="any"
                value={identitasLokasi.koordinat.lat ?? ''}
                onChange={handleChange}
                placeholder="-6.1754"
                className="font-mono tabular-nums tracking-tighter"
              />
              <InputGroup
                id="lng"
                name="lng"
                label="Longitude"
                type="number"
                step="any"
                value={identitasLokasi.koordinat.lng ?? ''}
                onChange={handleChange}
                placeholder="106.8272"
                className="font-mono tabular-nums tracking-tighter"
              />
            </div>
            <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 bg-blue-50/50 p-2 rounded border border-blue-100">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p>Mengubah angka secara manual akan menggeser marker di peta secara otomatis.</p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: WebGIS Leaflet */}
        <div className="flex flex-col h-full min-h-[400px]">
          <h4 className="text-sm font-bold text-[#0c3a66] flex items-center gap-2 mb-3">
            <MapIcon className="w-4 h-4" /> 
            Peta Lokasi Interaktif
          </h4>
          
          {/* Kontainer Kaku Institusional */}
          <div className="flex-1 border-2 border-[#cbd5e1] rounded-md overflow-hidden relative shadow-sm z-0">
            <MapContainer 
              center={mapCenter} 
              zoom={markerPosition ? 12 : DEFAULT_ZOOM} 
              scrollWheelZoom={true}
              className="h-full w-full"
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
            
            {/* Instruksi overlay di peta */}
            <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 border border-slate-200 rounded-md shadow-sm pointer-events-none">
              <p className="text-[10px] font-semibold text-slate-700">
                Klik peta atau geser marker
              </p>
            </div>
          </div>
        </div>

      </div>
    </Card>
  );
};

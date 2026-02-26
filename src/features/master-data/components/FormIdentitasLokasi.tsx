import React from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Card } from '@/components/ui/Card';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { Briefcase, Navigation } from 'lucide-react';

export const FormIdentitasLokasi: React.FC = () => {
  const { identitasLokasi, setIdentitasLokasi } = useHydrologyStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'lat' || name === 'lng') {
      setIdentitasLokasi({
        koordinat: {
          ...identitasLokasi.koordinat,
          [name]: value === '' ? null : parseFloat(value)
        }
      });
    } else {
      setIdentitasLokasi({ [name]: value });
    }
  };

  return (
    <Card className="p-6 bg-white/40 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Identitas Lokasi Proyek</h3>
          <p className="text-xs text-slate-500 font-medium italic">Single Source of Truth (Master Data)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
              <Navigation className="w-3 h-3" /> Koordinat Lokasi
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
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

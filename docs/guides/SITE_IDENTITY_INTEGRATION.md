# Site Identity Form - Integration Guide

## Overview
Komponen `SiteIdentityForm` adalah reusable component untuk mengumpulkan data identitas lokasi proyek dengan fitur geotagging dan dokumentasi foto.

## Features
- ✅ Input Nama Saluran/Sungai
- ✅ Dropdown Wilayah (Provinsi, Kabupaten, Kecamatan, Desa)
- ✅ Geotagging (GPS Coordinates)
- ✅ Upload Foto Dokumentasi
- ✅ Preview Foto dengan opsi hapus

## Component Structure

```tsx
import { SiteIdentityForm } from './components/SiteIdentityForm';
import { SiteIdentity } from './types';

// State untuk menyimpan data lokasi
const [locationData, setLocationData] = useState<SiteIdentity>({
  channelName: '',
  regency: '',
  district: '',
  village: ''
});

// Render component
<SiteIdentityForm 
  value={locationData} 
  onChange={setLocationData} 
/>
```

## Data Structure

```typescript
interface SiteIdentity {
  channelName: string;           // Nama Saluran/Sungai
  regency: string;               // Kabupaten/Kota
  district: string;              // Kecamatan
  village: string;               // Desa/Kelurahan
  location?: GeoLocationData;    // GPS Coordinates
  photoUrl?: string;             // Base64 foto dokumentasi
}

interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}
```

## Integration Examples

### 1. FloodDischargeCalculator.tsx
```tsx
// Import
import { SiteIdentityForm } from './SiteIdentityForm';
import { SiteIdentity } from '../types';

// State
const [locationData, setLocationData] = useState<SiteIdentity>({
  channelName: '',
  regency: '',
  district: '',
  village: ''
});

// Render (di sidebar kiri, paling atas)
<SiteIdentityForm value={locationData} onChange={setLocationData} />

// Saat save, sertakan locationData
const inputs = method === 'RATIONAL' 
  ? { ...rationalInputs, site: locationData } 
  : { ...nakayasuInputs, site: locationData };
```

### 2. WaterBalanceAnalysis.tsx
```tsx
// Import
import { SiteIdentityForm } from './SiteIdentityForm';
import { SiteIdentity } from '../types';

// State
const [locationData, setLocationData] = useState<SiteIdentity>({
  channelName: '',
  regency: '',
  district: '',
  village: ''
});

// Render (di sidebar kiri, paling atas)
<SiteIdentityForm value={locationData} onChange={setLocationData} />

// Saat save, sertakan locationData
const { data, error } = await saveWaterBalance({
  projectName,
  monthlyInputs: { ...inputs, site: locationData },
  monthlyResults: results,
  summary
});
```

## UI Styling
- Container: `bg-white p-5 md:p-8 rounded-[2rem] shadow-soft border border-slate-100`
- Responsive: Mobile-first design dengan grid 2 kolom untuk action buttons
- Icons: Menggunakan inline SVG untuk MapPin, Camera, dan Crosshair
- Colors: 
  - Geotagging: `field-green` (#10b981)
  - Dokumentasi: `safety-blue` (#3b82f6)

## Browser Permissions
- **Geolocation**: Memerlukan user permission untuk akses GPS
- **Camera**: Memerlukan user permission untuk akses kamera (mobile)
- **File Upload**: Mendukung image/* format

## Notes
- Komponen sudah terintegrasi dengan `LocationSelector` untuk dropdown wilayah
- Auto-trigger GPS saat component mount (jika belum ada data)
- Foto disimpan sebagai Base64 string untuk kemudahan penyimpanan
- Koordinat GPS otomatis terisi jika dipilih dari LocationSelector

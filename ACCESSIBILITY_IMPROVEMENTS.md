# Laporan Perbaikan Aksesibilitas (A11y)

## Ringkasan
Telah dilakukan perbaikan menyeluruh pada aksesibilitas form di seluruh aplikasi untuk mengatasi error "Form field missing id/label". Semua elemen `<input>` dan `<select>` kini memiliki atribut `id`, `name`, dan hubungan eksplisit dengan `<label>` melalui atribut `htmlFor`.

## Komponen yang Diperbaiki

### 1. **InputGroup.tsx** (Komponen Dasar)
**Perubahan:**
- Menambahkan parameter `id` dan `name` pada props
- Generate unique ID otomatis jika tidak disediakan: `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
- Menambahkan atribut `htmlFor` pada `<label>` yang menghubungkan ke input
- Menambahkan atribut `id` dan `name` pada `<input>`

**Contoh:**
```tsx
<label htmlFor={inputId}>Label Text</label>
<input id={inputId} name={inputName} ... />
```

### 2. **ManningCalculator.tsx**
**Perubahan:**
- Select "Kekasaran Manning (n)":
  - `id="select-roughness"`
  - `name="roughness"`
  - `<label htmlFor="select-roughness">`

### 3. **RationalCalculator.tsx**
**Perubahan:**
- Select "Koefisien Limpasan (C)":
  - `id="select-runoff-coefficient"`
  - `name="runoffCoefficient"`
  - `<label htmlFor="select-runoff-coefficient">`

### 4. **SiteIdentityForm.tsx**
**Perubahan:**
- Input "Nama Saluran / Sungai":
  - `id="input-channel-name"`
  - `name="channelName"`

### 5. **LocationSelector.tsx**
**Perubahan:**
- Select Kabupaten/Kota:
  - `id="select-kabupaten"`
  - `name="kabupaten"`
  - `<label htmlFor="select-kabupaten">`
- Select Kecamatan:
  - `id="select-kecamatan"`
  - `name="kecamatan"`
  - `<label htmlFor="select-kecamatan">`
- Select Desa/Kelurahan:
  - `id="select-desa"`
  - `name="desa"`
  - `<label htmlFor="select-desa">`

### 6. **SlopeCalculator.tsx**
**Perubahan:**
- Input Elevasi Awal:
  - `id="input-elevation-start"`
  - `name="elevationStart"`
- Input Elevasi Akhir:
  - `id="input-elevation-end"`
  - `name="elevationEnd"`
- Input Jarak Horizontal:
  - `id="input-distance"`
  - `name="distance"`

### 7. **DependableFlowCalc.tsx**
**Perubahan:**
- Input Koefisien Limpasan:
  - Sudah memiliki `id` dan `name` melalui InputGroup
- Input Luas DAS:
  - Sudah memiliki `id` dan `name` melalui InputGroup
- Input bulanan (Curah Hujan):
  - `id="rainfall-{index}"`
  - `name="rainfall-{month}"`
  - `aria-label="Curah hujan bulan {month}"`
- Input bulanan (Hari Hujan):
  - `id="rainyDays-{index}"`
  - `name="rainyDays-{month}"`
  - `aria-label="Hari hujan bulan {month}"`

### 8. **WaterBalanceTab.tsx**
**Perubahan:**
- Input manual debit bulanan:
  - `id="supply-{index}"`
  - `name="supply-{month}"`
  - `aria-label="Debit andalan bulan {month}"`

### 9. **WaterBalanceAnalysis.tsx**
**Perubahan:**
- Input Jumlah Penduduk:
  - `id="input-population"`
  - `name="population"`
- Input Standar Domestik:
  - `id="input-domestic-standard"`
  - `name="domesticStandard"`
- Input Luas Pertanian:
  - `id="input-agriculture-area"`
  - `name="agricultureArea"`
- Input Kebutuhan Irigasi:
  - `id="input-irrigation-demand"`
  - `name="irrigationDemand"`
- Input debit bulanan: Sama seperti WaterBalanceTab

### 10. **ManualEntryModal.tsx**
**Perubahan:**
- Manning Form:
  - Input Lebar Bawah: `id="input-manual-width"`, `name="width"`
  - Input Tinggi Air: `id="input-manual-depth"`, `name="depth"`
  - Input Diameter: `id="input-manual-diameter"`, `name="diameter"`
  - Input Kemiringan: `id="input-manual-slope"`, `name="slope"`
  - Select Kekasaran: `id="select-manual-roughness"`, `name="roughness"`
- Rational Form:
  - Input Luas DAS: `id="input-manual-area"`, `name="area"`
  - Input Hujan: `id="input-manual-rainfall"`, `name="rainfallDesign"`
  - Input Panjang: `id="input-manual-flow-length"`, `name="flowLength"`
  - Input Kemiringan: `id="input-manual-catchment-slope"`, `name="catchmentSlope"`
  - Select Koefisien: `id="select-manual-runoff"`, `name="runoffCoefficient"`

## Strategi Penamaan ID

### 1. **Input dengan Label Visual**
Format: `input-{deskripsi-singkat}`
Contoh: `input-channel-name`, `input-population`

### 2. **Select dengan Label Visual**
Format: `select-{deskripsi-singkat}`
Contoh: `select-roughness`, `select-kabupaten`

### 3. **Input Tanpa Label Visual (Grid/Tabel)**
Menggunakan `aria-label` untuk deskripsi:
```tsx
<input
  id="rainfall-0"
  name="rainfall-Jan"
  aria-label="Curah hujan bulan Januari"
/>
```

## Manfaat Perbaikan

1. **Aksesibilitas Screen Reader**: Pengguna dengan screen reader dapat memahami fungsi setiap input
2. **Navigasi Keyboard**: Pengguna dapat menggunakan Tab untuk navigasi antar field dengan jelas
3. **Form Validation**: Browser dapat mengidentifikasi field dengan benar untuk validasi
4. **Testing**: Automated testing tools dapat menemukan dan berinteraksi dengan form elements
5. **SEO & Semantik**: Struktur HTML lebih semantik dan mudah dipahami mesin pencari

## Standar yang Diikuti

- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **WAI-ARIA**: Accessible Rich Internet Applications
- **HTML5 Best Practices**: Semantic HTML structure

## Testing

Untuk memverifikasi perbaikan:
1. Gunakan browser DevTools > Accessibility Inspector
2. Test dengan screen reader (NVDA, JAWS, atau VoiceOver)
3. Navigasi menggunakan keyboard (Tab, Shift+Tab)
4. Jalankan automated accessibility testing tools (axe, Lighthouse)

## Catatan

- Semua styling Tailwind CSS tetap dipertahankan
- Tidak ada perubahan pada tampilan visual
- Backward compatible dengan kode yang ada
- Auto-generation ID memastikan uniqueness

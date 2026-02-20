# 🎨 Glassmorphism Design System

## Overview

RekaSDA Pro menggunakan **Refined Glassmorphism** - efek kaca modern yang tetap menjaga keterbacaan data teknis.

---

## 🎯 Prinsip Glassmorphism

### 1. **Transparansi Terkontrol**
- Background semi-transparan dengan blur 12-20px
- Konten tetap jelas dan mudah dibaca
- Data numerik tidak terpengaruh efek blur

### 2. **Multi-Layer Depth**
- Shadow lembut untuk kedalaman visual
- Border semi-transparan untuk definisi tajam
- Gradient background untuk konteks

### 3. **Production-Ready**
- Keterbacaan prioritas utama
- Kontras warna optimal
- Performa rendering terjaga

---

## 🎨 Glass Utilities

### `.glass`
Efek kaca ringan untuk elemen interaktif:
```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.2);
```

**Penggunaan:**
- Hover states
- Navigation items
- Secondary buttons

### `.glass-strong`
Efek kaca medium untuk container:
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.25);
```

**Penggunaan:**
- Sidebar
- Modals
- Floating panels

### `.glass-card`
Efek kaca kuat untuk konten utama:
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(12px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.3);
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
```

**Penggunaan:**
- Cards
- Forms
- Data tables
- Input fields

---

## 📦 Komponen dengan Glassmorphism

### Card
```tsx
<Card title="Input Parameter">
  {/* Content dengan background glass-card */}
</Card>
```

### Button
```tsx
<Button variant="primary">Gradient + Shadow</Button>
<Button variant="secondary">Glass Effect</Button>
<Button variant="outline">Glass Border</Button>
```

### Modal
```tsx
<Modal isOpen={true} title="Dialog">
  {/* Glass-strong background dengan backdrop blur */}
</Modal>
```

### InputField
```tsx
<InputField 
  label="Parameter"
  unit="m³/s"
  // Glass-card background, teks tetap jelas
/>
```

### DataTable
```tsx
<DataTable 
  columns={columns}
  data={data}
  // Glass-card container, data numerik tajam
/>
```

---

## 🎨 Background Gradient

Body menggunakan gradient purple-blue:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background-attachment: fixed;
```

Gradient ini memberikan konteks visual untuk efek kaca.

---

## ✅ Best Practices

### DO ✅
- Gunakan `.glass-card` untuk konten dengan teks/data
- Gunakan `.glass` untuk elemen interaktif
- Pastikan kontras teks minimal 4.5:1
- Terapkan efek hanya pada container, bukan data

### DON'T ❌
- Jangan blur data numerik atau grafik
- Jangan stack terlalu banyak layer glass
- Jangan gunakan glass pada area visualisasi utama
- Jangan korbankan keterbacaan untuk estetika

---

## 🎯 Contoh Implementasi

### Form Input
```tsx
<Card title="Parameter Teknis">
  <div className="grid grid-cols-2 gap-6">
    <InputField label="Debit" unit="m³/s" />
    <InputField label="Luas" unit="ha" />
  </div>
  <Button variant="primary">Hitung</Button>
</Card>
```

### Data Table
```tsx
<DataTable
  caption="Hasil Perhitungan SNI 2415:2016"
  columns={[
    { key: 'param', header: 'Parameter' },
    { key: 'value', header: 'Nilai', align: 'right' }
  ]}
  data={results}
/>
```

### Modal Dialog
```tsx
<Modal isOpen={open} title="Konfirmasi">
  <p>Data akan disimpan ke database.</p>
  <div className="flex gap-3">
    <Button variant="primary">Simpan</Button>
    <Button variant="outline">Batal</Button>
  </div>
</Modal>
```

---

## 🔧 Customization

Untuk menyesuaikan intensitas glass effect, edit `src/index.css`:

```css
.glass-card {
  background: rgba(255, 255, 255, 0.95); /* Ubah opacity */
  backdrop-filter: blur(12px);            /* Ubah blur */
}
```

---

**Glassmorphism yang Refined = Modern + Functional** ✨

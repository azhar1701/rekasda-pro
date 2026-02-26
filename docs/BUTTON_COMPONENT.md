# 🎨 Button Component - Design System

**Komponen Button Terpusat untuk RekaSDA Pro**

---

## 📦 Lokasi

- **Primary:** `src/components/ui/Button.tsx` (shadcn/ui based)
- **Legacy:** `src/components/ui/forms/Button.tsx` (sudah di-sync)

---

## 🎯 Variants

### 1. Primary (Default)
```tsx
<Button variant="primary">Hitung Debit</Button>
```
- Background: `primary-600` (#2563EB)
- Hover: `primary-700` (#1D4ED8)
- Use case: CTA utama, submit form

### 2. Secondary (Outline)
```tsx
<Button variant="secondary">Batal</Button>
```
- Border: `neutral-200` → `primary-600` on hover
- Background: white → `primary-50` on hover
- Use case: Aksi sekunder, cancel

### 3. Ghost (Transparent)
```tsx
<Button variant="ghost">Lihat Detail</Button>
```
- Background: transparent → `neutral-100` on hover
- Use case: Aksi tersier, navigation

### 4. Danger (Destructive)
```tsx
<Button variant="danger">Hapus Data</Button>
```
- Background: `error` (#DC2626)
- Use case: Delete, destructive actions

---

## 📏 Sizes

```tsx
<Button size="sm">Small</Button>      // h-8, text-xs
<Button size="default">Default</Button> // h-10, text-sm
<Button size="lg">Large</Button>      // h-12, text-base
```

---

## 🔧 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Button size |
| `fullWidth` | `boolean` | `false` | Full width button |
| `isLoading` | `boolean` | `false` | Show spinner |
| `disabled` | `boolean` | `false` | Disable button |

---

## 💡 Penggunaan dengan Lucide Icons

```tsx
import { Button } from '@/components/ui/Button';
import { Save, Trash2, Download, Plus } from 'lucide-react';

// Icon di dalam children
<Button variant="primary">
  <Save />
  Simpan Data
</Button>

<Button variant="secondary">
  <Download />
  Export Excel
</Button>

<Button variant="ghost" size="sm">
  <Plus />
  Tambah
</Button>

<Button variant="danger">
  <Trash2 />
  Hapus
</Button>
```

---

## ⚡ Features

- ✅ **Auto icon sizing:** `[&_svg]:size-4` - semua icon otomatis 16px
- ✅ **Active feedback:** `active:scale-[0.98]` untuk primary & danger
- ✅ **Loading state:** Spinner otomatis dengan `isLoading`
- ✅ **Disabled state:** `opacity-50 cursor-not-allowed`
- ✅ **Smooth transitions:** 200ms duration
- ✅ **Accessible:** Semua HTML button attributes supported

---

## 🚫 Aturan Penggunaan

### ✅ DO
```tsx
// Gunakan lucide-react untuk icons
import { Save } from 'lucide-react';
<Button><Save /> Simpan</Button>

// Gunakan variant yang sesuai konteks
<Button variant="danger">Hapus</Button>

// Gunakan size yang konsisten
<Button size="sm">Aksi Kecil</Button>
```

### ❌ DON'T
```tsx
// Jangan gunakan library icon lain
import { FaSave } from 'react-icons/fa'; // ❌

// Jangan hardcode warna
<Button className="bg-red-500"> // ❌

// Jangan gunakan variant yang tidak ada
<Button variant="success"> // ❌ (tidak ada)
```

---

## 🎨 Color Mapping

| Variant | Background | Hover | Text |
|---------|-----------|-------|------|
| Primary | `#2563EB` | `#1D4ED8` | White |
| Secondary | White | `#EFF6FF` | `#334155` |
| Ghost | Transparent | `#E0F2FE` | `#0EA5E9` |
| Danger | `#DC2626` | `#991B1B` | White |

---

## 📱 Responsive

Button otomatis responsive dengan:
- Touch-friendly height (min 44px untuk default)
- Proper tap targets
- Full width option untuk mobile

```tsx
<Button fullWidth>Mobile Full Width</Button>
```

---

**Status:** TAHAP 3 SELESAI ✅  
**Updated:** Design System v1.0

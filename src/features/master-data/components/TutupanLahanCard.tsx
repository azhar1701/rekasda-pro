import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Trees, Plus, Trash2, AlertTriangle, Save, CheckCircle,
  SlidersHorizontal, BookOpen, ChevronDown, Info, Sparkles,
  RefreshCw, Search, X
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useHydrologyStore, type TutupanLahan, type TutupanLahanItem } from '@/stores/useHydrologyStore';
import { toast } from '@/hooks/useToast';
import {
  SNI_LAND_COVER_CLASSIFICATIONS,
  type LandCoverClassification,
  type LandCoverCategory,
} from '@/lib/constants/sni';

// ─── Types ─────────────────────────────────────────────────────────────────

type InputMode = 'manual' | 'klasifikasi';

interface TutupanLahanItemWithClass extends TutupanLahanItem {
  classificationId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const CATEGORY_ORDER: LandCoverCategory[] = [
  'hutan_alami', 'pertanian', 'permukiman', 'industri_komersial',
  'permukaan_keras', 'perairan', 'lain',
];

function getCategoryLabel(cat: string): string {
  const first = SNI_LAND_COVER_CLASSIFICATIONS.find(c => c.kategori === cat);
  return first?.kategoriLabel ?? cat;
}

// ─── Sub-component: Classification Dropdown (Portal Based to Prevent Clipping) ───

interface ClassDropdownProps {
  value: string;
  onChange: (cls: LandCoverClassification) => void;
}

const ClassDropdown: React.FC<ClassDropdownProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const selected = SNI_LAND_COVER_CLASSIFICATIONS.find(c => c.id === value);

  // Compute fixed viewport coordinates to escape table overflow-x-auto & card overflow-hidden
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const calculatedTop = placeAbove
      ? Math.max(10, rect.top - dropdownHeight - 4)
      : rect.bottom + 4;

    const availableHeight = placeAbove
      ? Math.min(dropdownHeight, rect.top - 16)
      : Math.min(dropdownHeight, window.innerHeight - rect.bottom - 16);

    const calculatedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 340));
    const calculatedWidth = Math.max(rect.width, 320);

    setCoords({
      top: calculatedTop,
      left: calculatedLeft,
      width: calculatedWidth,
      maxHeight: availableHeight,
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open]);

  // Click outside listener
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && buttonRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpen(false);
      setSearch('');
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  // Filter items based on search query
  const filteredClassifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SNI_LAND_COVER_CLASSIFICATIONS;
    return SNI_LAND_COVER_CLASSIFICATIONS.filter(c =>
      c.nama.toLowerCase().includes(q) ||
      c.deskripsi.toLowerCase().includes(q) ||
      c.kategoriLabel.toLowerCase().includes(q)
    );
  }, [search]);

  // Group filtered classifications
  const grouped = useMemo(() => {
    return CATEGORY_ORDER.reduce<Record<string, LandCoverClassification[]>>((acc, cat) => {
      const items = filteredClassifications.filter(c => c.kategori === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {});
  }, [filteredClassifications]);

  const dropdownPortal = open && coords && typeof document !== 'undefined' ? createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        maxHeight: `${coords.maxHeight}px`,
        zIndex: 99999,
      }}
      className="bg-white border border-slate-300 rounded-lg shadow-2xl flex flex-col text-xs animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5"
    >
      {/* Search Header */}
      <div className="p-2 border-b border-slate-200 bg-slate-50 rounded-t-lg flex items-center gap-1.5 shrink-0">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari jenis tutupan (contoh: sawah, hutan, aspal)..."
          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
        {Object.keys(grouped).length === 0 ? (
          <div className="p-4 text-center text-slate-400 italic">
            Tidak ditemukan jenis tutupan lahan yang sesuai &quot;{search}&quot;.
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="py-1">
              <div className="px-3 py-1 bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 backdrop-blur-sm z-10 border-y border-slate-200/60">
                {getCategoryLabel(cat)}
              </div>
              {items.map(cls => {
                const isSelected = cls.id === value;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      onChange(cls);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-start justify-between gap-2 px-3 py-2 text-left hover:bg-primary-50 transition-colors ${
                      isSelected ? 'bg-primary-50 text-primary-900 font-semibold' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 leading-snug flex items-center gap-1.5">
                        <span className="truncate">{cls.nama}</span>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
                      </div>
                      <div className="text-slate-500 text-[10px] leading-tight mt-0.5 line-clamp-1">
                        {cls.deskripsi}
                      </div>
                    </div>
                    {/* Badge nilai C & CN */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[10px] font-bold rounded">
                        C: {cls.nilaiC.toFixed(2)}
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-bold rounded">
                        CN: {cls.nilaiCN}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between shrink-0 rounded-b-lg">
        <span>SNI 2415:2016 &amp; SCS-CN</span>
        <span className="text-slate-400">Total 22 klasifikasi</span>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen(prev => !prev);
          if (!open) setSearch('');
        }}
        className={`w-full flex items-center justify-between gap-1 py-1.5 px-2 text-xs border rounded-md bg-white transition-all text-left shadow-sm ${
          open
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-slate-300 hover:border-primary-400'
        }`}
      >
        <span className="truncate text-slate-800 font-medium">
          {selected?.nama ?? <span className="text-slate-400 italic">Pilih jenis tutupan lahan...</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180 text-primary-600' : ''}`} />
      </button>

      {dropdownPortal}
    </div>
  );
};

// ─── Sub-component: C/CN Badge with Tooltip ────────────────────────────────

interface CnBadgeProps {
  cls: LandCoverClassification;
  field: 'C' | 'CN';
}

const RangeBadge: React.FC<CnBadgeProps> = ({ cls, field }) => {
  const range = field === 'C' ? cls.rangeC : cls.rangeCN;
  const val = field === 'C' ? cls.nilaiC : cls.nilaiCN;

  const tooltipTitle = `Standar: ${cls.sumber}\nRentang ${field}: ${
    field === 'C' ? `${range[0].toFixed(2)} - ${range[1].toFixed(2)}` : `${range[0]} - ${range[1]}`
  }`;

  return (
    <span
      title={tooltipTitle}
      className="inline-flex items-center gap-1 cursor-help px-2 py-0.5 rounded bg-slate-50 border border-slate-200 hover:border-primary-300 transition-colors"
    >
      <span className="text-primary-700 font-bold tabular-nums">
        {field === 'C' ? val.toFixed(2) : val.toFixed(0)}
      </span>
      <Info className="w-3 h-3 text-slate-400" />
    </span>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

export const TutupanLahanCard: React.FC = () => {
  const { tutupanLahan, saveTutupanLahan, morfometriDAS } = useHydrologyStore();
  const [inputMode, setInputMode] = useState<InputMode>('klasifikasi');
  const [isSaved, setIsSaved] = useState(false);

  const defaultItem = (): TutupanLahanItemWithClass => ({
    id: crypto.randomUUID(),
    jenis: '',
    luas: 0,
    nilaiC: 0,
    nilaiCN: 0,
    classificationId: undefined,
  });

  const [items, setItems] = useState<TutupanLahanItemWithClass[]>([defaultItem()]);

  // Sync from store
  useEffect(() => {
    if (tutupanLahan) {
      setItems(tutupanLahan.items.map(i => ({ ...i, classificationId: (i as TutupanLahanItemWithClass).classificationId })));
      setIsSaved(true);
    } else {
      setItems([defaultItem()]);
      setIsSaved(false);
    }
  }, [tutupanLahan]);

  // ─── Computed values ─────────────────────────────────────────────────────
  const { totalLuas, cGabungan, cnGabungan, luasError, maxTolerance } = useMemo(() => {
    const safeItems = items.map(i => ({
      ...i,
      luas: typeof i.luas === 'string' ? parseFloat(i.luas as string) || 0 : i.luas,
      nilaiC: typeof i.nilaiC === 'string' ? parseFloat(i.nilaiC as string) || 0 : i.nilaiC,
      nilaiCN: typeof i.nilaiCN === 'string' ? parseFloat(i.nilaiCN as string) || 0 : i.nilaiCN,
    }));
    const total = safeItems.reduce((sum, item) => sum + item.luas, 0);
    const cWeighted = total > 0 ? safeItems.reduce((sum, i) => sum + i.nilaiC * i.luas, 0) / total : 0;
    const cnWeighted = total > 0 ? safeItems.reduce((sum, i) => sum + i.nilaiCN * i.luas, 0) / total : 0;
    const dasLuas = morfometriDAS?.luasDAS || 0;
    const error = dasLuas > 0 ? Math.abs(total - dasLuas) : 0;
    const tol = Math.max(0.05, 0.005 * dasLuas);
    return { totalLuas: total, cGabungan: cWeighted, cnGabungan: cnWeighted, luasError: error, maxTolerance: tol };
  }, [items, morfometriDAS]);

  const hasError = morfometriDAS !== null && (morfometriDAS.luasDAS || 0) > 0 && luasError > maxTolerance;

  // ─── Handlers ────────────────────────────────────────────────────────────
  const markDirty = () => setIsSaved(false);

  const handleAddRow = () => {
    setItems(prev => [...prev, defaultItem()]);
    markDirty();
  };

  const handleRemoveRow = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(i => i.id !== id));
      markDirty();
    }
  };

  const handleManualChange = (id: string, field: keyof TutupanLahanItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    markDirty();
  };

  const handleClassificationChange = (id: string, cls: LandCoverClassification) => {
    setItems(prev => prev.map(i =>
      i.id === id
        ? { ...i, jenis: cls.nama, nilaiC: cls.nilaiC, nilaiCN: cls.nilaiCN, classificationId: cls.id }
        : i,
    ));
    markDirty();
  };

  const handleLuasChange = (id: string, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, luas: value as unknown as number } : i));
    markDirty();
  };

  const handleNormalizeArea = () => {
    const targetDAS = morfometriDAS?.luasDAS || 0;
    if (targetDAS <= 0 || totalLuas <= 0) return;
    const factor = targetDAS / totalLuas;
    setItems(prev => prev.map(i => ({ ...i, luas: Number(((i.luas || 0) * factor).toFixed(3)) })));
    markDirty();
    toast.info('Luas tutupan lahan berhasil dinormalisasi agar tepat sama dengan Luas DAS.');
  };

  const handleFillFromDAS = () => {
    const dasLuas = morfometriDAS?.luasDAS;
    if (!dasLuas) {
      toast.error('Morfometri DAS belum diinput. Masukkan Luas DAS terlebih dahulu.');
      return;
    }
    if (items.length === 1 && items[0].luas === 0) {
      setItems(prev => prev.map(i => ({ ...i, luas: dasLuas })));
      markDirty();
      toast.info(`Luas diisi otomatis dari DAS: ${dasLuas.toFixed(2)} km²`);
    } else {
      toast.info('Distribusikan luas secara manual atau gunakan tombol Normalisasi.');
    }
  };

  const handleSave = async () => {
    const safeItems = items.map(i => ({
      ...i,
      luas: typeof i.luas === 'string' ? parseFloat(i.luas as string) || 0 : i.luas,
      nilaiC: typeof i.nilaiC === 'string' ? parseFloat(i.nilaiC as string) || 0 : i.nilaiC,
      nilaiCN: typeof i.nilaiCN === 'string' ? parseFloat(i.nilaiCN as string) || 0 : i.nilaiCN,
    }));
    const data: TutupanLahan = {
      items: safeItems,
      koefisienPengaliranGabungan: cGabungan,
      curveNumberGabungan: cnGabungan,
      totalLuas,
    };
    try {
      await saveTutupanLahan(data);
      setItems(safeItems);
      setIsSaved(true);
      toast.success('Data tutupan lahan berhasil disimpan.');
    } catch (err) {
      console.error('Failed to save Tutupan Lahan:', err);
      toast.error('Gagal menyimpan data Tutupan Lahan.');
    }
  };

  const handleResetAll = () => {
    setItems([defaultItem()]);
    markDirty();
    toast.info('Data tutupan lahan direset.');
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Card className="border border-slate-300 shadow-sm rounded-md">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded">
              <Trees className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Analisis Tutupan Lahan</h3>
              <p className="text-xs text-slate-600 font-medium">Koefisien pengaliran (C) dan curve number (CN)</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:block">Mode Input:</span>
            <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs font-semibold bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setInputMode('klasifikasi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${inputMode === 'klasifikasi'
                  ? 'bg-primary-700 text-white shadow-inner'
                  : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Klasifikasi SNI
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${inputMode === 'manual'
                  ? 'bg-primary-700 text-white shadow-inner'
                  : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Baris
            </button>
          </div>
        </div>

        {/* Mode info banner */}
        {inputMode === 'klasifikasi' && (
          <div className="mt-3 flex items-start gap-2 text-xs bg-sky-50 border border-sky-100 rounded-md px-3 py-2 text-sky-800">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-600" />
            <span>
              <strong>Mode Klasifikasi SNI</strong> — Pilih jenis tutupan lahan dari daftar standar.
              Nilai C &amp; CN terisi otomatis berdasarkan SNI 2415:2016, Suripin (2004), dan SCS-CN USDA.
              Arahkan kursor pada angka C &amp; CN untuk melihat rentang nilai.
            </span>
          </div>
        )}
        {inputMode === 'manual' && (
          <div className="mt-3 flex items-start gap-2 text-xs bg-amber-50 border border-amber-100 rounded-md px-3 py-2 text-amber-800">
            <SlidersHorizontal className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
            <span>
              <strong>Mode Manual</strong> — Masukkan nilai C &amp; CN secara langsung. Pastikan nilai C ∈ [0, 1] dan CN ∈ [0, 100].
              Gunakan <strong>Mode Klasifikasi SNI</strong> sebagai referensi nilai yang tepat.
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Table Container without excessive clipping */}
        <div className="overflow-x-auto mb-4 border border-slate-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-700 min-w-[240px]">Jenis Tutupan Lahan</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-700 w-32">Luas (km²)</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-700 w-28">Koef. C</th>
                <th className="px-3 py-2.5 text-right font-semibold text-slate-700 w-28">CN</th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-700 w-16">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const cls = SNI_LAND_COVER_CLASSIFICATIONS.find(c => c.id === item.classificationId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">

                    {/* Jenis Tutupan Lahan */}
                    <td className="px-3 py-2">
                      {inputMode === 'klasifikasi' ? (
                        <ClassDropdown
                          value={item.classificationId ?? ''}
                          onChange={(c) => handleClassificationChange(item.id, c)}
                        />
                      ) : (
                        <input
                          type="text"
                          value={item.jenis}
                          onChange={(e) => handleManualChange(item.id, 'jenis', e.target.value)}
                          className="w-full py-1.5 px-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Contoh: Hutan Lindung"
                        />
                      )}
                    </td>

                    {/* Luas */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <input
                          type="number"
                          value={item.luas === 0 ? 0 : (item.luas ?? '')}
                          onChange={(e) => handleLuasChange(item.id, e.target.value)}
                          className="w-full py-1.5 px-2 text-xs text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 tabular-nums"
                          placeholder="0.00"
                          step="0.01"
                        />
                      </div>
                    </td>

                    {/* Koef. C */}
                    <td className="px-3 py-2 text-right">
                      {inputMode === 'klasifikasi' && cls ? (
                        <div className="flex justify-end">
                          <RangeBadge cls={cls} field="C" />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={item.nilaiC === 0 ? 0 : (item.nilaiC ?? '')}
                          onChange={(e) => handleManualChange(item.id, 'nilaiC', e.target.value)}
                          className="w-full py-1.5 px-2 text-xs text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 tabular-nums"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max="1"
                        />
                      )}
                    </td>

                    {/* CN */}
                    <td className="px-3 py-2 text-right">
                      {inputMode === 'klasifikasi' && cls ? (
                        <div className="flex justify-end">
                          <RangeBadge cls={cls} field="CN" />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={item.nilaiCN === 0 ? 0 : (item.nilaiCN ?? '')}
                          onChange={(e) => handleManualChange(item.id, 'nilaiCN', e.target.value)}
                          className="w-full py-1.5 px-2 text-xs text-right border border-slate-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500 tabular-nums"
                          placeholder="0"
                          step="1"
                          min="0"
                          max="100"
                        />
                      )}
                    </td>

                    {/* Hapus */}
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(item.id)}
                        disabled={items.length === 1}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs text-slate-600 font-medium mb-1">Total Luas Tutupan</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {totalLuas.toFixed(2)} <span className="text-sm font-normal text-slate-500">km²</span>
            </p>
            {morfometriDAS?.luasDAS && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                DAS: {morfometriDAS.luasDAS.toFixed(2)} km²
              </p>
            )}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs text-slate-600 font-medium mb-1">C Gabungan <span className="text-slate-400">(Weighted)</span></p>
            <p className="text-lg font-bold text-primary-700 tabular-nums">{cGabungan.toFixed(3)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Koefisien Pengaliran Komposit</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs text-slate-600 font-medium mb-1">CN Gabungan <span className="text-slate-400">(Weighted)</span></p>
            <p className="text-lg font-bold text-primary-700 tabular-nums">{cnGabungan.toFixed(1)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Curve Number Komposit (SCS-CN)</p>
          </div>
        </div>

        {/* Error Alert */}
        {hasError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Peringatan: Selisih Luas DAS Melebihi Toleransi (0.5%)</p>
                <p className="text-xs text-red-700 mt-1">
                  Total luas ({totalLuas.toFixed(2)} km²) berbeda dari Luas DAS ({morfometriDAS?.luasDAS.toFixed(2)} km²).
                  Selisih: <strong>{luasError.toFixed(2)} km²</strong> (Batas: ±{maxTolerance.toFixed(2)} km²).
                </p>
              </div>
            </div>
            <button
              onClick={handleNormalizeArea}
              type="button"
              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded border border-red-300 self-start sm:self-center shrink-0 transition-colors"
            >
              Normalisasikan Luas ke 100%
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleFillFromDAS}
            type="button"
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-md transition-colors"
            title="Isi luas dari Luas DAS"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Isi dari Luas DAS
          </button>
          <button
            onClick={handleResetAll}
            type="button"
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Semua
          </button>
          <button
            onClick={handleSave}
            disabled={hasError}
            className={`flex-1 px-4 py-2 font-semibold rounded-md transition-all flex items-center justify-center gap-2 text-sm ${hasError
              ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
              : isSaved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-primary-700 hover:bg-primary-800 text-white'
              }`}
          >
            {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {hasError ? 'Perbaiki Selisih Luas Terlebih Dahulu' : isSaved ? 'Tersimpan ✓' : 'Simpan Tutupan Lahan'}
          </button>
        </div>
      </div>
    </Card>
  );
};

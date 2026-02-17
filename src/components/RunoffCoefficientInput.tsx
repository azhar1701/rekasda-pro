import React, { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { SelectWithSearch } from '@/components/ui/SelectWithSearch';

interface RunoffCoefficientInputProps {
  value?: number;
  onChange: (value: number | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

interface LandUseCategory {
  id: string;
  name: string;
  description: string;
  minC: number;
  maxC: number;
}

// Embedded reference data: Land Use Categories with C-value ranges
const LAND_USE_CATEGORIES: LandUseCategory[] = [
  {
    id: 'forest',
    name: 'Hutan/vegetasi lebat',
    description: 'Kawasan hutan dengan vegetasi padat',
    minC: 0.10,
    maxC: 0.30,
  },
  {
    id: 'grassland',
    name: 'Padang rumput/sawah',
    description: 'Area rumput atau sawah yang teratur',
    minC: 0.25,
    maxC: 0.50,
  },
  {
    id: 'agriculture',
    name: 'Pertanian terbuka',
    description: 'Lahan pertanian dengan tanaman musiman',
    minC: 0.40,
    maxC: 0.60,
  },
  {
    id: 'roof',
    name: 'Atap bangunan',
    description: 'Permukaan atap (genteng, metal, dll)',
    minC: 0.80,
    maxC: 0.95,
  },
  {
    id: 'asphalt',
    name: 'Aspal/jalan beton',
    description: 'Permukaan aspal atau jalan beton',
    minC: 0.70,
    maxC: 0.95,
  },
  {
    id: 'urban',
    name: 'Kawasan kota padat',
    description: 'Area perkotaan dengan bangunan dan jalan raya',
    minC: 0.70,
    maxC: 0.90,
  },
];

export const RunoffCoefficientInput: React.FC<RunoffCoefficientInputProps> = ({
  value,
  onChange,
  label = 'Koefisien Aliran Permukaan (C)',
  error: externalError,
  required = true,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [cValue, setCValue] = useState<number | ''>(value || '');

  // Get current selected category
  const selectedCategory = LAND_USE_CATEGORIES.find((cat) => cat.id === selectedCategoryId);

  // No manual numeric input validation required for slider-only flow

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = LAND_USE_CATEGORIES.find((cat) => cat.id === categoryId);

    // Reset C value to middle of range when category changes
    if (category) {
      const midValue = (category.minC + category.maxC) / 2;
      setCValue(parseFloat(midValue.toFixed(2)));
      onChange(parseFloat(midValue.toFixed(2)));
    } else {
      setCValue('');
      onChange(null);
    }
  };

  // manual number input removed; slider-only flow used

  // Handle slider input
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value);
    setCValue(numValue);
    onChange(numValue);
  };

  const isValid = selectedCategory !== undefined && typeof cValue === 'number';

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
      {/* Header */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-900 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <p className="text-xs text-slate-500">
          Pilih kategori tata guna lahan terlebih dahulu, kemudian sesuaikan nilai koefisien
        </p>
      </div>

      {/* Step 1: Land Use Category Selection */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          Langkah 1: Pilih Tata Guna Lahan
        </label>

        <SelectWithSearch
          options={LAND_USE_CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))}
          value={selectedCategoryId}
          onChange={handleCategoryChange}
          placeholder="-- Pilih kategori tata guna lahan --"
        />

        {selectedCategory && (
          <p className="text-xs text-slate-600 mt-2 font-medium flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <span>{selectedCategory.description}</span>
          </p>
        )}
      </div>

      {/* Step 2: Display Valid Range */}
      {selectedCategory && (
        <div className="mb-6 p-4 bg-blue-50/80 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Rentang yang Disarankan
              </p>
              <p className="text-lg font-bold text-blue-600">
                {selectedCategory.minC.toFixed(2)} - {selectedCategory.maxC.toFixed(2)}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p className="font-semibold">{selectedCategory.name}</p>
              <p className="text-slate-500 mt-1">Gunakan slider atau input manual</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Slider-only selection (no manual numeric input) */}
      {selectedCategory && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Langkah 2: Pilih nilai dengan Slider
            </label>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min={selectedCategory.minC}
                max={selectedCategory.maxC}
                step={0.01}
                value={typeof cValue === 'number' ? cValue : selectedCategory.minC}
                onChange={handleSliderChange}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />

              <div className="text-right min-w-16">
                <p className="text-2xl font-bold text-teal-600">
                  {(typeof cValue === 'number' ? cValue : selectedCategory.minC).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-500 font-medium">{selectedCategory.minC.toFixed(2)}</span>
              <span className="text-xs text-slate-500 font-medium">{selectedCategory.maxC.toFixed(2)}</span>
            </div>

            {/* Quick presets: min / mid / max */}
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={() => { const v = selectedCategory.minC; setCValue(parseFloat(v.toFixed(2))); onChange(parseFloat(v.toFixed(2))); }}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
              >
                Min ({selectedCategory.minC.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => { const v = (selectedCategory.minC + selectedCategory.maxC) / 2; setCValue(parseFloat(v.toFixed(2))); onChange(parseFloat(v.toFixed(2))); }}
                className="px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-100"
              >
                Mid ({((selectedCategory.minC + selectedCategory.maxC) / 2).toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => { const v = selectedCategory.maxC; setCValue(parseFloat(v.toFixed(2))); onChange(parseFloat(v.toFixed(2))); }}
                className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
              >
                Max ({selectedCategory.maxC.toFixed(2)})
              </button>
            </div>
          </div>

          {/* Success State */}
          {isValid && (
            <div className="flex items-start gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-emerald-700 font-medium">
                Nilai C: <span className="font-bold">{(typeof cValue === 'number' ? cValue : selectedCategory.minC).toFixed(2)}</span> sudah dipilih untuk kategori ini
              </p>
            </div>
          )}
        </div>
      )}

      {/* External Error Display */}
      {externalError && (
        <div className="mt-6 flex items-start gap-3 p-3 bg-red-50/80 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{externalError}</p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">💡 Tips:</span> Koefisien aliran (C) menunjukkan persentase curah hujan yang menjadi aliran permukaan. Nilai lebih tinggi berarti lebih banyak air mengalir di permukaan.
        </p>
      </div>
    </div>
  );
};

export default RunoffCoefficientInput;

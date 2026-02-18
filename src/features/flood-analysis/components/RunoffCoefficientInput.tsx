import React, { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { SelectWithSearch } from '@/components/ui/forms/SelectWithSearch';
import { SNI_RUNOFF_COEFFICIENTS } from '@/lib/constants/sni';

interface RunoffCoefficientInputProps {
  value?: number;
  onChange: (value: number | null) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

// Konversi data SNI ke format dropdown
const LAND_USE_OPTIONS = Object.entries(SNI_RUNOFF_COEFFICIENTS).map(([key, data]) => ({
  id: key,
  name: data.description,
  value: data.value,
  category: data.category,
  source: data.source,
}));

export const RunoffCoefficientInput: React.FC<RunoffCoefficientInputProps> = ({
  value,
  onChange,
  label = 'Koefisien Pengaliran (C)',
  error: externalError,
  required = true,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');

  const selectedOption = LAND_USE_OPTIONS.find((opt) => opt.id === selectedId);

  const handleChange = (id: string) => {
    setSelectedId(id);
    const option = LAND_USE_OPTIONS.find((opt) => opt.id === id);
    if (option) {
      onChange(option.value);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      <SelectWithSearch
        options={LAND_USE_OPTIONS.map(opt => ({ 
          value: opt.id, 
          label: `${opt.name} (C = ${opt.value})` 
        }))}
        value={selectedId}
        onChange={handleChange}
        placeholder="-- Pilih karakteristik tata guna lahan --"
      />

      {selectedOption && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">{selectedOption.name}</p>
              <p className="text-xs text-emerald-700 mt-1">Koefisien C = <span className="font-bold">{selectedOption.value}</span></p>
              <p className="text-xs text-emerald-600 mt-1">Referensi: {selectedOption.source}</p>
            </div>
          </div>
        </div>
      )}

      {externalError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{externalError}</p>
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Koefisien Pengaliran (C)</span> menunjukkan rasio antara limpasan permukaan dengan curah hujan total. Nilai sesuai <span className="font-semibold">Permen PU No. 12/2014</span> dan <span className="font-semibold">Suripin (2004)</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RunoffCoefficientInput;

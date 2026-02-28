import React, { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { SelectWithSearch } from '@/components/ui/forms/SelectWithSearch';

interface AlphaParameterInputProps {
  value?: number;
  onChange: (value: number | null) => void;
  error?: string;
  required?: boolean;
}

// Parameter Alpha berdasarkan karakteristik DAS (SNI 2415:2016 Pasal 6.3)
const ALPHA_OPTIONS = [
  {
    id: 'steep',
    name: 'DAS Curam (Pegunungan)',
    description: 'Kemiringan > 15%, sungai pendek, respon cepat',
    value: 1.5,
    characteristics: 'Topografi curam, vegetasi jarang, tanah berbatu',
  },
  {
    id: 'moderate-steep',
    name: 'DAS Agak Curam',
    description: 'Kemiringan 10-15%, respon sedang-cepat',
    value: 1.8,
    characteristics: 'Topografi bergelombang, vegetasi sedang',
  },
  {
    id: 'standard',
    name: 'DAS Normal (Standard)',
    description: 'Kemiringan 5-10%, kondisi umum Indonesia',
    value: 2.0,
    characteristics: 'Topografi bergelombang ringan, vegetasi normal',
  },
  {
    id: 'moderate-flat',
    name: 'DAS Agak Landai',
    description: 'Kemiringan 2-5%, respon sedang-lambat',
    value: 2.5,
    characteristics: 'Topografi landai, vegetasi lebat, tanah dalam',
  },
  {
    id: 'flat',
    name: 'DAS Landai (Dataran)',
    description: 'Kemiringan < 2%, sungai panjang, respon lambat',
    value: 3.0,
    characteristics: 'Topografi datar, rawa/danau, vegetasi sangat lebat',
  },
];

export const AlphaParameterInput: React.FC<AlphaParameterInputProps> = ({
  onChange,
  error: externalError,
}) => {
  const [selectedId, setSelectedId] = useState<string>('');

  const selectedOption = ALPHA_OPTIONS.find((opt) => opt.id === selectedId);

  const handleChange = (id: string) => {
    setSelectedId(id);
    const option = ALPHA_OPTIONS.find((opt) => opt.id === id);
    if (option) {
      onChange(option.value);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      <SelectWithSearch
        options={ALPHA_OPTIONS.map(opt => ({ 
          value: opt.id, 
          label: `${opt.name} (α = ${opt.value})` 
        }))}
        value={selectedId}
        onChange={handleChange}
        placeholder="-- Pilih karakteristik DAS --"
      />

      {selectedOption && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-pupr-blue flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">{selectedOption.name}</p>
              <p className="text-xs text-emerald-700 mt-1">Parameter α = <span className="font-bold">{selectedOption.value}</span></p>
              <p className="text-xs text-pupr-blue mt-1">{selectedOption.description}</p>
              <p className="text-xs text-pupr-blue mt-1 italic">{selectedOption.characteristics}</p>
            </div>
          </div>
        </div>
      )}

      {externalError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{externalError}</p>
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-pupr-blue flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <span className="font-semibold">Parameter Alpha (α)</span> menunjukkan karakteristik DAS yang mempengaruhi bentuk hidrograf. Nilai lebih kecil = respon lebih cepat (puncak lebih tinggi). Sesuai <span className="font-semibold">SNI 2415:2016 Pasal 6.3</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlphaParameterInput;

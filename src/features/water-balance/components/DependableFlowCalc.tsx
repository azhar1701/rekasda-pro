import React, { useState, useEffect, useCallback } from 'react';
import { InputGroup } from '@/components/ui/forms/InputGroup';
import { Button } from '@/components/ui/forms/Button';

interface MonthlyRainfall {
  rainfall: number; // mm
  rainyDays: number;
}

interface Props {
  onUseData: (monthlyFlow: number[]) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const DependableFlowCalc: React.FC<Props> = ({ onUseData }) => {
  const [runoffCoef, setRunoffCoef] = useState(0.6);
  const [catchmentArea, setCatchmentArea] = useState(10); // km²
  const [monthlyData, setMonthlyData] = useState<MonthlyRainfall[]>(
    Array.from({ length: 12 }, () => ({ rainfall: 100, rainyDays: 10 }))
  );
  const [calculatedFlow, setCalculatedFlow] = useState<number[]>([]);

  // FIX BUG-4: Wrap calculateFlow in useCallback so it can be a stable dependency
  const calculateFlow = useCallback(() => {
    const flows = monthlyData.map((data) => {
      if (data.rainyDays === 0) return 0;

      // Calculate intensity (mm/hour) - simplified approach
      const intensity = data.rainfall / (data.rainyDays * 24); // mm/hour

      // Q = 0.278 * C * I * A (m³/s)
      const Q = 0.278 * runoffCoef * intensity * catchmentArea;

      return parseFloat(Q.toFixed(3));
    });

    setCalculatedFlow(flows);
  }, [monthlyData, runoffCoef, catchmentArea]);

  useEffect(() => {
    calculateFlow();
  }, [calculateFlow]);

  const handleDataChange = (index: number, field: 'rainfall' | 'rainyDays', value: number) => {
    const newData = [...monthlyData];
    newData[index] = { ...newData[index], [field]: value };
    setMonthlyData(newData);
  };

  const loadSampleData = () => {
    setMonthlyData([
      { rainfall: 350, rainyDays: 20 }, // Jan
      { rainfall: 320, rainyDays: 18 }, // Feb
      { rainfall: 280, rainyDays: 16 }, // Mar
      { rainfall: 200, rainyDays: 12 }, // Apr
      { rainfall: 150, rainyDays: 8 },  // Mei
      { rainfall: 100, rainyDays: 5 },  // Jun
      { rainfall: 80, rainyDays: 3 },   // Jul
      { rainfall: 70, rainyDays: 2 },   // Agu
      { rainfall: 90, rainyDays: 4 },   // Sep
      { rainfall: 140, rainyDays: 8 },  // Okt
      { rainfall: 220, rainyDays: 14 }, // Nov
      { rainfall: 300, rainyDays: 18 }  // Des
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <InputGroup
          label="Koefisien Limpasan (C)"
          value={runoffCoef}
          step="0.1"
          onChange={e => setRunoffCoef(parseFloat(e.target.value) || 0)}
          helpText="Nilai 0.1 - 0.9"
        />
        <InputGroup
          label="Luas DAS"
          unit="km²"
          value={catchmentArea}
          onChange={e => setCatchmentArea(parseFloat(e.target.value) || 0)}
          helpText="Luas daerah tangkapan"
        />
      </div>

      {/* Monthly Data Grid */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-bold text-slate-600 uppercase">Data Curah Hujan Bulanan</label>
          <button
            onClick={loadSampleData}
            className="text-xs font-bold text-pupr-blue hover:text-blue-700 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
          >
            Load Contoh
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MONTHS.map((month, index) => (
            <div key={month} className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase mb-2">{month}</div>
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <svg className="w-3 h-3 text-pupr-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    min="0"
                    id={`rainfall-${index}`}
                    name={`rainfall-${month}`}
                    aria-label={`Curah hujan bulan ${month}`}
                    value={monthlyData[index].rainfall}
                    onChange={e => handleDataChange(index, 'rainfall', parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-8 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">mm</span>
                </div>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="number"
                    min="0"
                    id={`rainyDays-${index}`}
                    name={`rainyDays-${month}`}
                    aria-label={`Hari hujan bulan ${month}`}
                    value={monthlyData[index].rainyDays}
                    onChange={e => handleDataChange(index, 'rainyDays', parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-10 py-1.5 text-xs border border-slate-200 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">hari</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="text-xs font-bold text-blue-700 uppercase mb-2">Hasil Estimasi Debit (m³/s)</div>
        <div className="grid grid-cols-6 gap-2 text-xs">
          {MONTHS.map((month, index) => (
            <div key={month} className="text-center">
              <div className="text-[10px] text-pupr-blue font-bold">{month}</div>
              <div className="font-bold text-blue-900">{calculatedFlow[index]?.toFixed(2) || '0.00'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Button
        fullWidth
        variant="primary"
        onClick={() => onUseData(calculatedFlow)}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        }
      >
        Gunakan Data Ini untuk Neraca Air
      </Button>
    </div>
  );
};

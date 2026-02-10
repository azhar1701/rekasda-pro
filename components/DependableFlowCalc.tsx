import React, { useState, useEffect } from 'react';
import { InputGroup } from './InputGroup';
import { Button } from './Button';

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
    Array(12).fill({ rainfall: 100, rainyDays: 10 })
  );
  const [calculatedFlow, setCalculatedFlow] = useState<number[]>([]);

  useEffect(() => {
    calculateFlow();
  }, [runoffCoef, catchmentArea, monthlyData]);

  const calculateFlow = () => {
    const flows = monthlyData.map((data) => {
      if (data.rainyDays === 0) return 0;
      
      // Calculate intensity (mm/hour) - simplified approach
      const intensity = data.rainfall / (data.rainyDays * 24); // mm/hour
      
      // Q = 0.278 * C * I * A (m³/s)
      const Q = 0.278 * runoffCoef * intensity * catchmentArea;
      
      return parseFloat(Q.toFixed(3));
    });
    
    setCalculatedFlow(flows);
  };

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
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Data Curah Hujan Bulanan</label>
            <div className="relative group">
              <svg className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 z-50">
                <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl">
                  <p className="leading-relaxed">
                    Masukkan data <span className="font-bold">Curah Hujan Rata-rata Bulanan</span> (R80 atau Rrat) dalam satuan milimeter (mm). 
                    Data ini biasanya didapat dari rata-rata pencatatan stasiun hujan minimal <span className="font-bold">10 tahun terakhir</span> untuk mendapatkan debit andalan yang akurat.
                  </p>
                  <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={loadSampleData}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Load Contoh
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MONTHS.map((month, index) => (
            <div key={month} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] font-black text-slate-500 uppercase mb-2">{month}</div>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Hujan (mm)"
                  value={monthlyData[index].rainfall}
                  onChange={e => handleDataChange(index, 'rainfall', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <input
                  type="number"
                  placeholder="Hari hujan"
                  value={monthlyData[index].rainyDays}
                  onChange={e => handleDataChange(index, 'rainyDays', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-xs font-bold text-blue-700 uppercase mb-2">Hasil Estimasi Debit (m³/s)</div>
        <div className="grid grid-cols-6 gap-2 text-xs">
          {MONTHS.map((month, index) => (
            <div key={month} className="text-center">
              <div className="text-[10px] text-blue-600 font-bold">{month}</div>
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

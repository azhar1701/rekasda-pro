import React, { useState, useEffect } from 'react';
import { WaterBalanceInputs, calculateWaterBalance, getWaterBalanceSummary, WaterBalanceResult } from '../services/waterBalanceEngine';
import { WaterBalanceChart } from './WaterBalanceChart';
import { InputGroup } from './InputGroup';
import { Card } from './ui/Card';
import { HelpTooltip } from './HelpTooltip';

export const WaterBalanceAnalysis: React.FC = () => {
  const [inputs, setInputs] = useState<WaterBalanceInputs>({
    population: 5000,
    agricultureArea: 100,
    domesticStandard: 100,
    irrigationDemand: 1.0,
    monthlySupply: [2.5, 2.3, 2.0, 1.8, 1.5, 1.2, 1.0, 0.9, 1.1, 1.4, 1.8, 2.2]
  });

  const [results, setResults] = useState<WaterBalanceResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const balanceResults = calculateWaterBalance(inputs);
    setResults(balanceResults);
    setSummary(getWaterBalanceSummary(balanceResults));
  }, [inputs]);

  const handleSupplyChange = (index: number, value: number) => {
    const newSupply = [...inputs.monthlySupply];
    newSupply[index] = value;
    setInputs({ ...inputs, monthlySupply: newSupply });
  };

  const loadPilotData = () => {
    setInputs({
      population: 8500,
      agricultureArea: 150,
      domesticStandard: 100,
      irrigationDemand: 1.2,
      monthlySupply: [3.2, 2.8, 2.5, 2.0, 1.6, 1.2, 0.9, 0.8, 1.0, 1.5, 2.1, 2.8]
    });
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pb-28">
      {/* LEFT COLUMN: INPUTS */}
      <div className="lg:col-span-5 space-y-6 lg:space-y-8 animate-slide-up">
        
        {/* Quick Action Mobile */}
        <div className="bg-white/95 backdrop-blur-md p-3 px-4 rounded-xl shadow-card border border-slate-200 flex justify-between items-center lg:hidden sticky top-20 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">Load Pilot Data</span>
          </div>
          <button onClick={loadPilotData} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-colors">Load</button>
        </div>

        {/* Parameter Kebutuhan Air */}
        <Card
          title="Parameter Kebutuhan Air"
          description="Data Populasi & Lahan"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                id="input-population"
                name="population"
                label="Jumlah Penduduk" 
                unit="jiwa" 
                value={inputs.population} 
                onChange={e => setInputs({...inputs, population: parseFloat(e.target.value) || 0})}
                helpText="Total populasi yang dilayani"
              />
              <InputGroup
                id="input-domestic-standard"
                name="domesticStandard"
                label="Standar Domestik" 
                unit="L/org/hari" 
                value={inputs.domesticStandard} 
                onChange={e => setInputs({...inputs, domesticStandard: parseFloat(e.target.value) || 0})}
                helpText="SNI 6728.1:2015 (60-120 L/capita/day)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                id="input-agriculture-area"
                name="agricultureArea"
                label="Luas Pertanian" 
                unit="Ha" 
                value={inputs.agricultureArea} 
                onChange={e => setInputs({...inputs, agricultureArea: parseFloat(e.target.value) || 0})}
                helpText="Luas lahan irigasi"
              />
              <InputGroup
                id="input-irrigation-demand"
                name="irrigationDemand"
                label="Kebutuhan Irigasi" 
                unit="L/s/Ha" 
                value={inputs.irrigationDemand} 
                onChange={e => setInputs({...inputs, irrigationDemand: parseFloat(e.target.value) || 0})}
                helpText="Kebutuhan air per hektar"
              />
            </div>
          </div>
        </Card>

        {/* Debit Andalan Bulanan */}
        <Card
          title="Debit Andalan Bulanan (Q80)"
          description="Ketersediaan Air 12 Bulan"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>}
        >
          <div className="grid grid-cols-3 gap-3">
            {MONTHS.map((month, index) => (
              <div key={month}>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{month}</label>
                <input
                  type="number"
                  step="0.1"
                  id={`supply-${index}`}
                  name={`supply-${month}`}
                  aria-label={`Debit andalan bulan ${month}`}
                  value={inputs.monthlySupply[index]}
                  onChange={e => handleSupplyChange(index, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN: RESULTS */}
      <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24">
        {results.length > 0 && (
          <div className="animate-fade-in space-y-6">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-black text-green-600 uppercase">Bulan Surplus</span>
                  <HelpTooltip content="Jumlah bulan dengan ketersediaan air berlebih" />
                </div>
                <p className="text-2xl font-black text-green-700">{summary?.surplusMonths}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-black text-red-600 uppercase">Bulan Defisit</span>
                  <HelpTooltip content="Jumlah bulan dengan kekurangan air" />
                </div>
                <p className="text-2xl font-black text-red-700">{summary?.deficitMonths}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-black text-blue-600 uppercase">Total Surplus</span>
                  <HelpTooltip content="Total kelebihan air sepanjang tahun" />
                </div>
                <p className="text-lg font-black text-blue-700">{summary?.totalSurplus} m³/s</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[9px] font-black text-orange-600 uppercase">Total Defisit</span>
                  <HelpTooltip content="Total kekurangan air sepanjang tahun" />
                </div>
                <p className="text-lg font-black text-orange-700">{summary?.totalDeficit} m³/s</p>
              </div>
            </div>

            {/* Chart */}
            <Card className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Grafik Neraca Air</h3>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Analisis Supply vs Demand</p>
                  </div>
                  {summary?.criticalMonth && (
                    <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <span className="text-[9px] font-black text-red-600 uppercase block">Bulan Kritis</span>
                      <span className="text-sm font-bold text-red-700">{summary.criticalMonth.month}</span>
                    </div>
                  )}
                </div>
                <WaterBalanceChart data={results} />
              </div>
            </Card>

            {/* Detailed Table */}
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Tabel Detail Neraca Air</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Bulan</th>
                        <th className="text-right py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Supply (m³/s)</th>
                        <th className="text-right py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Domestik (m³/s)</th>
                        <th className="text-right py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Pertanian (m³/s)</th>
                        <th className="text-right py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Total Demand (m³/s)</th>
                        <th className="text-right py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Neraca (m³/s)</th>
                        <th className="text-center py-3 px-2 text-[10px] font-black text-slate-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2 font-bold text-slate-700">{row.month}</td>
                          <td className="py-3 px-2 text-right font-semibold text-blue-600">{row.supply}</td>
                          <td className="py-3 px-2 text-right text-slate-600">{row.domesticDemand}</td>
                          <td className="py-3 px-2 text-right text-slate-600">{row.agricultureDemand}</td>
                          <td className="py-3 px-2 text-right font-semibold text-orange-600">{row.totalDemand}</td>
                          <td className={`py-3 px-2 text-right font-bold ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.balance >= 0 ? '+' : ''}{row.balance}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                              row.status === 'Surplus' ? 'bg-green-100 text-green-700' : 
                              row.status === 'Defisit' ? 'bg-red-100 text-red-700' : 
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Reference */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-600">
                <span className="font-bold">Referensi:</span> SNI 6728.1:2015 - Penyusunan Neraca Spasial Sumber Daya Air
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

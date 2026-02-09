import React, { useState, useEffect } from 'react';
import { WaterBalanceInputs, calculateWaterBalance, getWaterBalanceSummary, WaterBalanceResult } from '../services/waterBalanceEngine';
import { WaterBalanceChart } from './WaterBalanceChart';
import { DependableFlowCalc } from './DependableFlowCalc';
import { InputGroup } from './InputGroup';
import { HelpTooltip } from './HelpTooltip';

type InputTab = 'demand' | 'supply';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const WaterBalanceTab: React.FC = () => {
  const [activeInputTab, setActiveInputTab] = useState<InputTab>('demand');
  const [showDetailTable, setShowDetailTable] = useState(false);
  
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

  const handleUseCalculatedFlow = (flow: number[]) => {
    setInputs({ ...inputs, monthlySupply: flow });
    setActiveInputTab('demand');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-28">
      
      {/* LEFT COLUMN: INPUT & CONTROL (35%) */}
      <div className="lg:col-span-4 space-y-4 animate-slide-up">
        
        {/* Tab Switcher */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveInputTab('demand')}
              className={`py-3 px-4 rounded-lg text-xs font-bold uppercase transition-all ${
                activeInputTab === 'demand'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Kebutuhan
              </div>
            </button>
            <button
              onClick={() => setActiveInputTab('supply')}
              className={`py-3 px-4 rounded-lg text-xs font-bold uppercase transition-all ${
                activeInputTab === 'supply'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Ketersediaan
              </div>
            </button>
          </div>
        </div>

        {/* Input Content */}
        {activeInputTab === 'demand' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Parameter Kebutuhan Air</h3>
                <p className="text-[10px] text-slate-500 uppercase font-medium">Domestik & Pertanian</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  label="Populasi"
                  unit="jiwa"
                  value={inputs.population}
                  onChange={e => setInputs({ ...inputs, population: parseFloat(e.target.value) || 0 })}
                />
                <InputGroup
                  label="Standar"
                  unit="L/org/hr"
                  value={inputs.domesticStandard}
                  onChange={e => setInputs({ ...inputs, domesticStandard: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputGroup
                  label="Luas Irigasi"
                  unit="Ha"
                  value={inputs.agricultureArea}
                  onChange={e => setInputs({ ...inputs, agricultureArea: parseFloat(e.target.value) || 0 })}
                />
                <InputGroup
                  label="Kebutuhan"
                  unit="L/s/Ha"
                  value={inputs.irrigationDemand}
                  onChange={e => setInputs({ ...inputs, irrigationDemand: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Debit Andalan (Q80)</h3>
                <p className="text-[10px] text-slate-500 uppercase font-medium">Ketersediaan Air Bulanan</p>
              </div>
            </div>

            {/* Toggle between Calculator and Manual */}
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-bold text-blue-700 mb-2">Opsi Input:</div>
                <div className="space-y-2">
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700 list-none flex items-center gap-2">
                      <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Hitung dari Curah Hujan
                    </summary>
                    <div className="mt-3 pl-6">
                      <DependableFlowCalc onUseData={handleUseCalculatedFlow} />
                    </div>
                  </details>
                </div>
              </div>

              {/* Manual Input Grid */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Input Manual (m³/s)</label>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((month, index) => (
                    <div key={month}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{month}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={inputs.monthlySupply[index]}
                        onChange={e => handleSupplyChange(index, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reference Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs text-slate-600 font-medium">
              <span className="font-bold">Ref:</span> SNI 6728.1:2015
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: VISUALIZATION & RESULTS (65%) */}
      <div className="lg:col-span-8 space-y-4 animate-fade-in">
        
        {/* Hero Chart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grafik Neraca Air</h3>
              <p className="text-[10px] text-slate-500 uppercase font-medium">Analisis Supply vs Demand</p>
            </div>
            {summary?.criticalMonth && (
              <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <span className="text-[9px] font-black text-red-600 uppercase block">Bulan Kritis</span>
                <span className="text-sm font-bold text-red-700">{summary.criticalMonth.month}</span>
              </div>
            )}
          </div>
          <div className="h-[400px]">
            <WaterBalanceChart data={results} />
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[9px] font-black text-green-600 uppercase">Surplus</span>
            </div>
            <div className="text-2xl font-black text-green-700">{summary?.surplusMonths}</div>
            <div className="text-[10px] text-green-600 font-medium">Bulan</div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-[9px] font-black text-red-600 uppercase">Defisit</span>
            </div>
            <div className="text-2xl font-black text-red-700">{summary?.deficitMonths}</div>
            <div className="text-[10px] text-red-600 font-medium">Bulan</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-[9px] font-black text-blue-600 uppercase">Total Surplus</span>
            </div>
            <div className="text-lg font-black text-blue-700">{summary?.totalSurplus}</div>
            <div className="text-[10px] text-blue-600 font-medium">m³/s</div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              <span className="text-[9px] font-black text-orange-600 uppercase">Total Defisit</span>
            </div>
            <div className="text-lg font-black text-orange-700">{summary?.totalDeficit}</div>
            <div className="text-[10px] text-orange-600 font-medium">m³/s</div>
          </div>
        </div>

        {/* Collapsible Detail Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setShowDetailTable(!showDetailTable)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-xl"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-bold text-slate-900">Tabel Detail Neraca Air</span>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showDetailTable ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDetailTable && (
            <div className="p-4 border-t border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 px-2 text-[10px] font-black text-slate-500 uppercase">Bulan</th>
                    <th className="text-right py-2 px-2 text-[10px] font-black text-blue-600 uppercase">Supply</th>
                    <th className="text-right py-2 px-2 text-[10px] font-black text-slate-500 uppercase">Domestik</th>
                    <th className="text-right py-2 px-2 text-[10px] font-black text-slate-500 uppercase">Pertanian</th>
                    <th className="text-right py-2 px-2 text-[10px] font-black text-orange-600 uppercase">Total Demand</th>
                    <th className="text-right py-2 px-2 text-[10px] font-black text-slate-500 uppercase">Neraca</th>
                    <th className="text-center py-2 px-2 text-[10px] font-black text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-2 font-bold text-slate-700">{row.month}</td>
                      <td className="py-2 px-2 text-right font-semibold text-blue-600">{row.supply}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{row.domesticDemand}</td>
                      <td className="py-2 px-2 text-right text-slate-600">{row.agricultureDemand}</td>
                      <td className="py-2 px-2 text-right font-semibold text-orange-600">{row.totalDemand}</td>
                      <td className={`py-2 px-2 text-right font-bold ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.balance >= 0 ? '+' : ''}{row.balance}
                      </td>
                      <td className="py-2 px-2 text-center">
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
          )}
        </div>
      </div>
    </div>
  );
};

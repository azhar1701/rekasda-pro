import React, { useState, useCallback, useEffect } from 'react';
import { WaterBalanceChart } from './WaterBalanceChart';
import { PageHeader, PageContent, Section } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { CardLegacy as Card, CardContent } from '@/components/ui/CardNew';
import { InputGroup } from './InputGroup';
import { HelpTooltip } from './HelpTooltip';
import { supabase } from '@/lib/supabase';

interface WaterBalanceData {
  site: { channelName: string; regency: string; district: string; village: string };
  population: number;
  agricultureArea: number;
  domesticStandard: number;
  irrigationDemand: number;
  monthlySupply: number[];
}

interface Props {
  onSave?: (data: WaterBalanceData, results: any) => void;
  onConsultAI?: (data: WaterBalanceData, results: any) => void;
}

export const WaterBalanceAnalysis: React.FC<Props> = ({ onSave, onConsultAI }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const [data, setData] = useState<WaterBalanceData>({
    site: { channelName: 'DAS Analisa', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
    population: 50000,
    agricultureArea: 500,
    domesticStandard: 80,
    irrigationDemand: 0.5,
    monthlySupply: [150, 160, 180, 200, 220, 210, 180, 170, 160, 150, 140, 130]
  });
  
  const [results, setResults] = useState<any>(null);
  const [projectName, setProjectName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPilotData = () => {
    setData({
      site: { channelName: 'DAS Perumahan Soreang', regency: 'Kab. Bandung', district: 'Soreang', village: 'Soreang' },
      population: 75000,
      agricultureArea: 800,
      domesticStandard: 100,
      irrigationDemand: 1.2,
      monthlySupply: [200, 210, 240, 280, 300, 290, 260, 250, 230, 200, 180, 160]
    });
  };

  // Calculate water balance
  useEffect(() => {
    const domesticDemand = (data.population * data.domesticStandard) / (24 * 3600) / 1000; // L to m³/s
    const agricultureDemand = (data.agricultureArea * 2.5) / (365 * 24 * 3600); // 2.5 m³/ha/day
    const totalDemand = domesticDemand + agricultureDemand + data.irrigationDemand;
    
    const monthlyBalance = data.monthlySupply.map((supply) => ({
      supply,
      demand: totalDemand,
      balance: supply - totalDemand
    }));

    const avgBalance = monthlyBalance.reduce((sum, m) => sum + m.balance, 0) / 12;
    const minBalance = Math.min(...monthlyBalance.map(m => m.balance));
    const maxBalance = Math.max(...monthlyBalance.map(m => m.balance));

    setResults({
      domesticDemand: domesticDemand.toFixed(3),
      agricultureDemand: agricultureDemand.toFixed(3),
      irrigationDemand: data.irrigationDemand.toFixed(3),
      totalDemand: totalDemand.toFixed(3),
      monthlyBalance,
      avgBalance: avgBalance.toFixed(3),
      minBalance: minBalance.toFixed(3),
      maxBalance: maxBalance.toFixed(3),
      criticalMonths: monthlyBalance.filter(m => m.balance < 0)
    });
  }, [data]);

  const handleMonthlySupplyChange = (index: number, value: number) => {
    const newSupply = [...data.monthlySupply];
    newSupply[index] = value;
    setData(prev => ({ ...prev, monthlySupply: newSupply }));
  };

  const handleSiteChange = useCallback((site: any) => {
    setData(prev => ({ ...prev, site }));
  }, []);

  const saveToDatabase = async () => {
    if (!projectName.trim()) {
      alert('Masukkan nama proyek');
      return;
    }
    
    setSaving(true);
    try {
      if (!supabase) {
        alert('Database tidak tersedia');
        return;
      }
      
      const { error } = await supabase.from('water_balance_analysis').insert({
        project_name: projectName,
        data: JSON.stringify(data),
        results: JSON.stringify(results),
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      alert(`Analisis "${projectName}" berhasil disimpan!`);
      setProjectName('');
      onSave?.(data, results);
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Analisis Keseimbangan Air"
        subtitle="Evaluasi keseimbangan antara ketersediaan dan kebutuhan air bulanan"
        icon={<span className="text-2xl">💧</span>}
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - INPUTS (33%) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Section title="Tindakan Cepat">
              <div className="flex gap-2">
                <button
                  onClick={loadPilotData}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                  Load Pilot
                </button>
              </div>
            </Section>

            {/* Site Identity */}
            <Section title="Identitas Lokasi">
              <Card>
                <CardContent>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Nama DAS / Lokasi"
                      value={data.site.channelName}
                      onChange={(e) => handleSiteChange({...data.site, channelName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Kabupaten"
                      value={data.site.regency}
                      onChange={(e) => handleSiteChange({...data.site, regency: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Kecamatan"
                      value={data.site.district}
                      onChange={(e) => handleSiteChange({...data.site, district: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* Demand Parameters */}
            <Section title="Parameter Kebutuhan">
              <Card>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup
                      label="Populasi"
                      unit="jiwa"
                      value={data.population}
                      onChange={(e) => setData({...data, population: parseFloat(e.target.value) || 0})}
                      placeholder="50000"
                      helpText="Jumlah penduduk"
                    />
                    <InputGroup
                      label="Std Domestik"
                      unit="L/org/hr"
                      value={data.domesticStandard}
                      onChange={(e) => setData({...data, domesticStandard: parseFloat(e.target.value) || 0})}
                      placeholder="80"
                      helpText="Kebutuhan per orang"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup
                      label="Luas Pertanian"
                      unit="ha"
                      value={data.agricultureArea}
                      onChange={(e) => setData({...data, agricultureArea: parseFloat(e.target.value) || 0})}
                      placeholder="500"
                      helpText="Area pertanian"
                    />
                    <InputGroup
                      label="Irigasi"
                      unit="m³/s"
                      value={data.irrigationDemand}
                      onChange={(e) => setData({...data, irrigationDemand: parseFloat(e.target.value) || 0})}
                      placeholder="0.5"
                      helpText="Kebutuhan irigasi"
                    />
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* Save Section */}
            <Section title="Simpan Analisis">
              <Card>
                <CardContent className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama Proyek"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <Button
                    fullWidth
                    variant="primary"
                    onClick={saveToDatabase}
                    disabled={saving || !projectName.trim()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </CardContent>
              </Card>
            </Section>
          </div>

          {/* RIGHT COLUMN - VISUALIZATION & RESULTS (67%) */}
          <div className="lg:col-span-2 space-y-6">
            {results && (
              <div className="animate-fade-in space-y-6">
                {/* Chart */}
                <Card>
                  <CardContent className="pt-6">
                    <WaterBalanceChart data={results.monthlyBalance} />
                  </CardContent>
                </Card>

                {/* Summary Metrics */}
                <Card>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 md:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                    
                    <div className="relative z-10">
                      <h3 className="text-lg font-bold mb-6">Ringkasan Keseimbangan</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-black text-blue-100 uppercase">Rata-rata</span>
                            <HelpTooltip content="Rata-rata keseimbangan bulanan" />
                          </div>
                          <span className="text-2xl font-bold">{results.avgBalance}</span>
                          <span className="text-xs text-blue-100 block">m³/s</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-black text-blue-100 uppercase">Minimum</span>
                            <HelpTooltip content="Keseimbangan terendah" />
                          </div>
                          <span className={`text-2xl font-bold ${parseFloat(results.minBalance) < 0 ? 'text-red-300' : 'text-green-300'}`}>
                            {results.minBalance}
                          </span>
                          <span className="text-xs text-blue-100 block">m³/s</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-black text-blue-100 uppercase">Maksimum</span>
                            <HelpTooltip content="Keseimbangan tertinggi" />
                          </div>
                          <span className="text-2xl font-bold text-green-300">{results.maxBalance}</span>
                          <span className="text-xs text-blue-100 block">m³/s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Demand Breakdown */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Rincian Kebutuhan Air</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
                      {[
                        { label: 'Domestik', value: results.domesticDemand, unit: 'm³/s', color: 'bg-amber-50 border-amber-200' },
                        { label: 'Pertanian', value: results.agricultureDemand, unit: 'm³/s', color: 'bg-green-50 border-green-200' },
                        { label: 'Irigasi', value: results.irrigationDemand, unit: 'm³/s', color: 'bg-blue-50 border-blue-200' },
                        { label: 'Total', value: results.totalDemand, unit: 'm³/s', color: 'bg-slate-100 border-slate-300' }
                      ].map((item, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${item.color}`}>
                          <div className="text-xs font-bold text-slate-600 uppercase mb-2">{item.label}</div>
                          <div className="text-xl font-bold text-slate-800">{item.value}</div>
                          <div className="text-xs text-slate-500">{item.unit}</div>
                        </div>
                      ))}
                    </div>

                    {/* Critical months warning */}
                    {results.criticalMonths.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          Bulan Kritis Terdeteksi
                        </h4>
                        <p className="text-sm text-red-700">
                          Keseimbangan negatif pada: {results.criticalMonths.map((m: any) => months[data.monthlySupply.indexOf(m.supply)]).join(', ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Supply Inputs */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Ketersediaan Air Bulanan</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {months.map((month, index) => (
                        <div key={index}>
                          <label className="text-xs font-bold text-slate-600 block mb-2">{month}</label>
                          <input
                            type="number"
                            value={data.monthlySupply[index]}
                            onChange={(e) => handleMonthlySupplyChange(index, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button fullWidth variant="primary" onClick={() => onSave?.(data, results)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                    Simpan Hasil
                  </Button>
                  <Button variant="outline" onClick={() => onConsultAI?.(data, results)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Konsultasi AI
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
};

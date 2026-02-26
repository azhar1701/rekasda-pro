import React, { useEffect, useState, useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';
import { CloudRain, Plus, Upload, MapPin, Calendar, Activity, ChevronDown, X, Download } from 'lucide-react';
import { DataQualityDashboard } from '@/components/ui/DataQualityDashboard';
import { parseExcelData, exportHidrologiTemplate } from '@/utils/excelService';
export const MasterHidrologiTab: React.FC = () => {
    const {
        stasiunList,
        selectedStasiun,
        dataHujan,
        isLoading,
        fetchStasiun,
        addStasiun,
        addDataHujan,
        importDataHujanBatch,
        selectStasiun,
        fetchDataHujan,
        updateDataHujanManual
    } = useHydrologyStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showModalStasiun, setShowModalStasiun] = useState(false);
    const [showModalHujan, setShowModalHujan] = useState(false);
    const [formStasiun, setFormStasiun] = useState({
        nama_stasiun: '',
        koordinat_x: '',
        koordinat_y: '',
        elevasi: '',
        keterangan: ''
    });
    const [formHujan, setFormHujan] = useState({
        tanggal: '',
        curah_hujan: ''
    });

    useEffect(() => {
        fetchStasiun();
    }, [fetchStasiun]);

    useEffect(() => {
        if (dataHujan.length >= 10) {
            updateDataHujanManual(dataHujan);
        }
    }, [dataHujan, updateDataHujanManual]);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const year = parseInt(e.target.value, 10);
        setSelectedYear(year);
        if (selectedStasiun) {
            fetchDataHujan(selectedStasiun.id, year);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedStasiun) return;

        const confirmed = confirm(
            `Import data ke stasiun: ${selectedStasiun.nama_stasiun}\n\n` +
            `File: ${file.name}\n\n` +
            `Lanjutkan?`
        );
        
        if (!confirmed) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            const data = await file.arrayBuffer();
            const jsonData = await parseExcelData<{ Tanggal: string; 'Curah Hujan (mm)': number }>(data, 4);

            const dataList = jsonData
                .filter(row => row.Tanggal && row['Curah Hujan (mm)'] !== undefined)
                .map(row => ({
                    stasiun_id: selectedStasiun.id,
                    tanggal: row.Tanggal,
                    curah_hujan: row['Curah Hujan (mm)'] || 0
                }));

            if (dataList.length === 0) {
                alert('Tidak ada data valid di file Excel');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            await importDataHujanBatch(dataList);
            alert(`✅ Berhasil import ${dataList.length} data ke stasiun ${selectedStasiun.nama_stasiun}`);
        } catch (err) {
            console.error(err);
            alert('❌ Gagal import file. Pastikan format sesuai template.');
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadTemplate = async () => {
        if (!selectedStasiun) {
            alert('Pilih stasiun terlebih dahulu');
            return;
        }
        await exportHidrologiTemplate(selectedStasiun.nama_stasiun);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Master Data Hidrologi</h2>
                    <p className="text-sm text-slate-600 mt-1">Single Source of Truth untuk Data Curah Hujan</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={downloadTemplate} disabled={!selectedStasiun} variant="outline" className="rounded-xl font-bold bg-white/80 backdrop-blur border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                    </Button>
                    {selectedStasiun && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-xl font-bold bg-white/80 backdrop-blur border-teal-200 text-teal-700 hover:bg-teal-50">
                                <Upload className="w-4 h-4 mr-2" />
                                Import Excel
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setShowModalStasiun(true)} className="rounded-xl font-bold bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Stasiun
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                <div className="lg:col-span-4 flex flex-col overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl">
                    <div className="p-5 border-b border-slate-200/50 bg-white/40 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-teal-500" />
                            Daftar Stasiun
                        </h3>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{stasiunList.length} Total</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading && stasiunList.length === 0 ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                            </div>
                        ) : (
                            stasiunList.map((stasiun) => {
                                const isActive = selectedStasiun?.id === stasiun.id;
                                return (
                                    <div
                                        key={stasiun.id}
                                        onClick={() => selectStasiun(stasiun)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                            isActive
                                                ? 'bg-gradient-to-br from-teal-500 to-teal-600 border-teal-600 shadow-lg text-white'
                                                : 'bg-white/80 border-slate-200 hover:border-teal-300 hover:shadow-md text-slate-700'
                                        }`}
                                    >
                                        <h4 className={`font-bold text-[15px] ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                            {stasiun.nama_stasiun}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <div className={`text-xs px-2 py-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80">Elevasi</span>
                                                <span className="font-semibold font-mono">{stasiun.elevasi} m</span>
                                            </div>
                                            <div className={`text-xs px-2 py-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80">Koordinat</span>
                                                <span className="font-semibold font-mono truncate">
                                                    {stasiun.koordinat_y?.toFixed(2)}, {stasiun.koordinat_x?.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl">
                    {!selectedStasiun ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-24 h-24 mb-6 bg-white border border-teal-100 rounded-full shadow-sm flex items-center justify-center">
                                <Activity className="w-10 h-10 text-teal-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Stasiun Terpilih</h3>
                            <p className="text-sm text-slate-500 max-w-sm">
                                Silakan pilih salah satu stasiun hujan di panel sebelah kiri untuk melihat detail data curah hujan historis.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-slate-200/50 bg-white/40 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <CloudRain className="w-5 h-5 text-teal-500" />
                                        Data Curah Hujan
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Stasiun: <span className="font-bold text-slate-700">{selectedStasiun.nama_stasiun}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Tahun</span>
                                        <div className="relative">
                                            <select
                                                value={selectedYear}
                                                onChange={handleYearChange}
                                                className="appearance-none bg-transparent border-none text-sm font-bold text-slate-800 pr-6 pl-1 py-1 focus:ring-0 cursor-pointer outline-none"
                                            >
                                                {[2026, 2025, 2024, 2023, 2022].map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    </div>
                                    <Button onClick={() => setShowModalHujan(true)} size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700">
                                        <Plus className="w-4 h-4 mr-1" />
                                        Tambah Data
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-slate-50/30 p-4 sm:p-6">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-teal-600"></div>
                                    </div>
                                )}

                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                                <th className="py-3 px-4 w-16 text-center">No</th>
                                                <th className="py-3 px-4">Tanggal</th>
                                                <th className="py-3 px-4 text-right">Curah Hujan (mm)</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {dataHujan.length === 0 && !isLoading ? (
                                                <tr>
                                                    <td colSpan={4} className="py-12 text-center text-slate-500">
                                                        Tidak ada data curah hujan untuk tahun {selectedYear}.
                                                    </td>
                                                </tr>
                                            ) : (
                                                dataHujan.map((row, index) => {
                                                    let statusLabel = "Kering";
                                                    let statusColor = "bg-slate-100 text-slate-600";
                                                    if (row.curah_hujan > 0 && row.curah_hujan <= 20) {
                                                        statusLabel = "Ringan";
                                                        statusColor = "bg-blue-50 text-blue-600";
                                                    } else if (row.curah_hujan > 20 && row.curah_hujan <= 50) {
                                                        statusLabel = "Sedang";
                                                        statusColor = "bg-indigo-50 text-indigo-600";
                                                    } else if (row.curah_hujan > 50) {
                                                        statusLabel = "Lebat";
                                                        statusColor = "bg-rose-50 text-rose-600";
                                                    }

                                                    return (
                                                        <tr key={row.id} className="hover:bg-teal-50/30 transition-colors">
                                                            <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-xs">{index + 1}</td>
                                                            <td className="py-2.5 px-4 font-medium text-slate-700">
                                                                {new Date(row.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                                                                {row.curah_hujan.toFixed(1)}
                                                            </td>
                                                            <td className="py-2.5 px-4 text-center">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${statusColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {dataHujan.length >= 10 && (
                                <div className="p-4 border-t border-slate-200/50 bg-white/40">
                                    <DataQualityDashboard />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showModalStasiun && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Tambah Stasiun Baru</h3>
                            <button onClick={() => setShowModalStasiun(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await addStasiun({
                                    nama_stasiun: formStasiun.nama_stasiun,
                                    koordinat_x: formStasiun.koordinat_x ? parseFloat(formStasiun.koordinat_x) : null,
                                    koordinat_y: formStasiun.koordinat_y ? parseFloat(formStasiun.koordinat_y) : null,
                                    elevasi: formStasiun.elevasi ? parseFloat(formStasiun.elevasi) : null,
                                    keterangan: formStasiun.keterangan || null
                                });
                                setShowModalStasiun(false);
                                setFormStasiun({ nama_stasiun: '', koordinat_x: '', koordinat_y: '', elevasi: '', keterangan: '' });
                            } catch (err) {
                                console.error(err);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Stasiun *</label>
                                <input
                                    type="text"
                                    required
                                    value={formStasiun.nama_stasiun}
                                    onChange={(e) => setFormStasiun(prev => ({ ...prev, nama_stasiun: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Stasiun Cikampak"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formStasiun.koordinat_x}
                                        onChange={(e) => setFormStasiun(prev => ({ ...prev, koordinat_x: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="106.7562"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formStasiun.koordinat_y}
                                        onChange={(e) => setFormStasiun(prev => ({ ...prev, koordinat_y: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="-6.5872"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Elevasi (m)</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formStasiun.elevasi}
                                    onChange={(e) => setFormStasiun(prev => ({ ...prev, elevasi: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="250"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan</label>
                                <textarea
                                    value={formStasiun.keterangan}
                                    onChange={(e) => setFormStasiun(prev => ({ ...prev, keterangan: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Tipe Manual. Terawat baik."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" onClick={() => setShowModalStasiun(false)} variant="outline" className="flex-1 rounded-xl">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700">
                                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModalHujan && selectedStasiun && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Tambah Data Curah Hujan</h3>
                            <button onClick={() => setShowModalHujan(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await addDataHujan({
                                    stasiun_id: selectedStasiun.id,
                                    tanggal: formHujan.tanggal,
                                    curah_hujan: parseFloat(formHujan.curah_hujan)
                                });
                                setShowModalHujan(false);
                                setFormHujan({ tanggal: '', curah_hujan: '' });
                            } catch (err) {
                                console.error(err);
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal *</label>
                                <input
                                    type="date"
                                    required
                                    value={formHujan.tanggal}
                                    onChange={(e) => setFormHujan(prev => ({ ...prev, tanggal: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Curah Hujan (mm) *</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formHujan.curah_hujan}
                                    onChange={(e) => setFormHujan(prev => ({ ...prev, curah_hujan: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                                <p className="text-xs text-teal-700">
                                    <span className="font-bold">Stasiun:</span> {selectedStasiun.nama_stasiun}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" onClick={() => setShowModalHujan(false)} variant="outline" className="flex-1 rounded-xl">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700">
                                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

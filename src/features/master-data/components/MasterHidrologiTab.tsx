import React, { useEffect, useState, useRef } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Button } from '@/components/ui/Button';
import { CloudRain, Plus, Upload, MapPin, Calendar, Activity, ChevronDown, X, Download, Sparkles, AlertCircle } from 'lucide-react';

import { DataQualityDashboard } from '@/components/ui/DataQualityDashboard';
import { parseExcelData, exportHidrologiTemplate } from '@/utils/excelService';
import { Satellite, Wand2 } from 'lucide-react';
import { fetchSatelliteRainfall } from '@/services/satelliteRainfallService';
import { infillMissingData } from '@/lib/utils/spatialMath';

const DailyRainfallMatrix: React.FC<{ data: any[], year: number }> = ({ data, year }) => {
    const matrix: (number | null)[][] = Array.from({ length: 31 }, () => Array(12).fill(null));
    
    data.forEach(row => {
        const [yyyy, mm, dd] = row.tanggal.split('-');
        const rowYear = parseInt(yyyy, 10);
        if (rowYear === year) {
            const month = parseInt(mm, 10) - 1;
            const day = parseInt(dd, 10) - 1;
            matrix[day][month] = row.curah_hujan;
        }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nop', 'Des'];

    let maxRainfall = 0;
    data.forEach(row => {
        const [yyyy] = row.tanggal.split('-');
        const rowYear = parseInt(yyyy, 10);
        if (rowYear === year && row.curah_hujan > maxRainfall) {
            maxRainfall = row.curah_hujan;
        }
    });

    const getCellClass = (val: number | null) => {
        if (val === null) return 'text-slate-300';
        if (val < 0) return 'text-red-500 font-bold bg-red-50';
        if (val === 0) return 'text-slate-300';
        if (val > 0 && val < 50) return 'text-slate-700';
        if (val >= 50 && val < 300) return 'bg-blue-100 text-pupr-blue font-bold';
        if (val >= 300) return 'bg-red-100 text-red-700 font-bold';
        return '';
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto border border-slate-300 rounded-md shadow-sm bg-white">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800">
                            <th className="py-2 px-2 border-r border-slate-300 font-bold text-center w-12 sticky left-0 bg-slate-100 z-10">Tgl</th>
                            {months.map((m, i) => (
                                <th key={i} className="py-2 px-2 border-r border-slate-300 font-bold text-center min-w-[60px]">{m}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, dayIndex) => (
                            <tr key={dayIndex} className="border-b border-slate-200 even:bg-slate-50 hover:bg-slate-100 transition-colors">
                                <td className="py-1.5 px-2 border-r border-slate-300 font-bold text-slate-600 text-center sticky left-0 bg-inherit z-10">
                                    {dayIndex + 1}
                                </td>
                                {row.map((val, monthIndex) => {
                                    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                                    const isValidDay = dayIndex + 1 <= daysInMonth;
                                    
                                    if (!isValidDay) {
                                        return <td key={monthIndex} className="py-1.5 px-2 border-r border-slate-200 bg-slate-100"></td>;
                                    }

                                    return (
                                        <td key={monthIndex} className={`py-1.5 border-r border-slate-200 tabular-nums text-right pr-2 ${getCellClass(val)}`}>
                                            {val !== null ? val.toFixed(1) : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-white border border-slate-300 rounded-md p-4 shadow-sm flex justify-between items-center">
                <span className="font-bold text-slate-700">Rekapitulasi Hujan Maksimum Tahunan</span>
                <span className="text-lg font-bold text-pupr-blue tabular-nums">{maxRainfall.toFixed(1)} mm</span>
            </div>
        </div>
    );
};

export const MasterHidrologiTab: React.FC = () => {
    const {
        stasiunList,
        selectedStasiun,
        dataHujan,
        isLoading,
        error,
        fetchStasiun,
        addStasiun,
        addDataHujan,
        importDataHujanBatch,
        selectStasiun,
        updateDataHujanManual,
        seedInitialStations
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
    const [isFetchingSatellite, setIsFetchingSatellite] = useState(false);
    const [isInfilling, setIsInfilling] = useState(false);

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

    const handleFetchSatelliteData = async () => {
        if (!selectedStasiun || selectedStasiun.koordinat_x === null || selectedStasiun.koordinat_y === null) {
            alert('Stasiun tidak memiliki koordinat (X, Y). Silakan lengkapi data stasiun terlebih dahulu.');
            return;
        }

        setIsFetchingSatellite(true);
        try {
            const satelliteData = await fetchSatelliteRainfall(
                selectedStasiun.koordinat_y,
                selectedStasiun.koordinat_x,
                selectedYear,
                selectedYear
            );

            const mappedData = satelliteData.map(d => ({
                ...d,
                stasiun_id: selectedStasiun.id
            }));

            await importDataHujanBatch(mappedData);
            alert(`✅ Berhasil menarik ${mappedData.length} data satelit untuk tahun ${selectedYear}`);
        } catch (error) {
            console.error('Error fetching satellite data:', error);
            alert('❌ Gagal mengambil data satelit. Silakan coba lagi.');
        } finally {
            setIsFetchingSatellite(false);
        }
    };

    const handleInfillData = async () => {
        if (!selectedStasiun) return;
        setIsInfilling(true);
        
        try {
            const allData = dataHujan; 
            await new Promise(resolve => setTimeout(resolve, 500));

            const filledData = dataHujan.map(item => {
                const value = typeof item.curah_hujan === 'number' ? item.curah_hujan : parseFloat(String(item.curah_hujan)) || 0;
                if (value === 0) {
                    const infilledValue = infillMissingData(
                        selectedStasiun,
                        stasiunList,
                        allData,
                        item.tanggal,
                        'idw'
                    );
                    return { ...item, curah_hujan: infilledValue > 0 ? parseFloat(infilledValue.toFixed(1)) : 0 };
                }
                return item;
            });

            updateDataHujanManual(filledData);
            alert('✅ Berhasil mengisi data kosong menggunakan metode IDW/Normal Ratio');
        } catch (error) {
            console.error('Error infilling data:', error);
            alert('❌ Gagal mengisi data kosong.');
        } finally {
            setIsInfilling(false);
        }
    };


    const annualMaximums = React.useMemo(() => {
        if (!dataHujan || dataHujan.length === 0) return [];
        const maxByYear: Record<number, number> = {};
        dataHujan.forEach(row => {
            const [yyyy] = row.tanggal.split('-');
            const y = parseInt(yyyy, 10);
            if (!maxByYear[y] || row.curah_hujan > maxByYear[y]) {
                maxByYear[y] = row.curah_hujan;
            }
        });
        return Object.entries(maxByYear)
            .map(([y, val]) => ({ tahun: parseInt(y, 10), curah_hujan: val }))
            .sort((a, b) => b.tahun - a.tahun);
    }, [dataHujan]);

    const handleHubungkanDistribusi = () => {
        if (annualMaximums.length < 10) {
            alert('Minimal butuh 10 tahun data untuk Analisis Frekuensi Distribusi Statistik.');
        } else {
            alert(`✅ ${annualMaximums.length} data maksimum tahunan siap dihubungkan ke Mesin Distribusi Statistik.`);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-sm">Terjadi Kesalahan</h4>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Master Data Hidrologi</h2>
                    <p className="text-sm text-slate-600 mt-1">Single Source of Truth untuk Data Curah Hujan</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={downloadTemplate} disabled={!selectedStasiun} variant="outline" className="rounded-md font-bold bg-white/80 backdrop-blur border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed">
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
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-md font-bold bg-white/80 backdrop-blur border-teal-200 text-teal-700 hover:bg-teal-50">
                                <Upload className="w-4 h-4 mr-2" />
                                Import Excel
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setShowModalStasiun(true)} className="rounded-md font-bold bg-pupr-blue hover:bg-teal-700 shadow-sm shadow-teal-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Stasiun
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                <div className="lg:col-span-4 flex flex-col overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-md shadow-sm">
                    <div className="p-5 border-b border-slate-200/50 bg-white/40 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-pupr-blue" />
                            Daftar Stasiun
                        </h3>
                        <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">{stasiunList.length} Total</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading && stasiunList.length === 0 ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-pulse bg-slate-200 rounded-md h-8 w-8 border-b-2 border-teal-600"></div>
                            </div>
                        ) : (
                            stasiunList.map((stasiun) => {
                                const isActive = selectedStasiun?.id === stasiun.id;
                                return (
                                    <div
                                        key={stasiun.id}
                                        onClick={() => selectStasiun(stasiun)}
                                        className={`p-4 rounded-md border cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                                            isActive
                                                ? 'bg-pupr-blue text-white border-teal-600 shadow-sm scale-[1.02]'
                                                : 'bg-white/80 border-slate-200 hover:border-teal-300 hover:shadow-md text-slate-700'
                                        }`}
                                    >
                                        <h4 className={`font-bold text-[15px] ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                            {stasiun.nama_stasiun}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <div className={`text-xs px-2 py-1.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
                                                <span className="block text-[9px] uppercase tracking-wider mb-0.5 opacity-80">Elevasi</span>
                                                <span className="font-semibold font-mono">{stasiun.elevasi} m</span>
                                            </div>
                                            <div className={`text-xs px-2 py-1.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>
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

                <div className="lg:col-span-8 flex flex-col overflow-hidden bg-white/60 backdrop-blur-xl border border-white/60 rounded-md shadow-sm">
                    {!selectedStasiun ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-24 h-24 mb-6 bg-white border border-teal-100 rounded-md shadow-sm flex items-center justify-center">
                                <Activity className="w-10 h-10 text-pupr-blue" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Stasiun Terpilih</h3>
                            <p className="text-sm text-slate-500 max-w-sm mb-6">
                                Silakan pilih salah satu stasiun hujan di panel sebelah kiri atau muat stasiun pilot untuk mulai mengelola data.
                            </p>
                            {stasiunList.length === 0 && (
                                <Button 
                                    onClick={async () => {
                                        await seedInitialStations();
                                        alert('✅ Berhasil memuat daftar stasiun pilot Citanduy.');
                                    }} 
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Muat Stasiun Pilot
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="p-5 border-b border-slate-200/50 bg-white/40 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <CloudRain className="w-5 h-5 text-pupr-blue" />
                                        Data Curah Hujan
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Stasiun: <span className="font-bold text-slate-700">{selectedStasiun.nama_stasiun}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
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

                                    <Button onClick={handleFetchSatelliteData} disabled={isFetchingSatellite || !selectedStasiun || selectedStasiun.koordinat_x === null} size="sm" variant="outline" className="rounded-md border-slate-300 text-slate-700 hover:bg-slate-50">
                                        <Satellite className={`w-4 h-4 mr-1 ${isFetchingSatellite ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">{isFetchingSatellite ? 'Menarik...' : 'Tarik Satelit'}</span>
                                    </Button>
                                    <Button onClick={handleInfillData} disabled={isInfilling || !selectedStasiun} size="sm" variant="outline" className="rounded-md border-slate-300 text-slate-700 hover:bg-slate-50">
                                        <Wand2 className={`w-4 h-4 mr-1 ${isInfilling ? 'animate-pulse' : ''}`} />
                                        <span className="hidden sm:inline">{isInfilling ? 'Memproses...' : 'Isi Kosong'}</span>
                                    </Button>
                                    <Button onClick={() => setShowModalHujan(true)} size="sm" className="rounded-md bg-pupr-blue hover:bg-teal-700">
                                        <Plus className="w-4 h-4 mr-1" />
                                        <span className="hidden sm:inline">Tambah Data</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-slate-50/30 p-4 sm:p-6">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                                        <div className="animate-pulse bg-slate-200 rounded-md h-10 w-10 border-4 border-slate-200 border-t-teal-600"></div>
                                    </div>
                                )}

                                <DailyRainfallMatrix data={dataHujan} year={selectedYear} />

                                {annualMaximums.length > 0 && (
                                    <div className="mt-8 bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Rekapitulasi Hujan Maksimum Tahunan</h4>
                                            <Button onClick={handleHubungkanDistribusi} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs h-8">
                                                <Activity className="w-3 h-3 mr-1" />
                                                Hubungkan ke Distribusi Statistik
                                            </Button>
                                        </div>
                                        <div className="p-0 overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-200">
                                                        {annualMaximums.map(m => (
                                                            <th key={m.tahun} className="py-2 px-3 border-r border-slate-200 text-center text-xs font-bold text-slate-600">{m.tahun}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        {annualMaximums.map(m => (
                                                            <td key={m.tahun} className="py-3 px-3 border-r border-slate-200 text-center font-bold text-pupr-blue tabular-nums">
                                                                {m.curah_hujan.toFixed(1)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
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
                    <div className="bg-white rounded-md shadow-sm max-w-md w-full p-6">
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
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="250"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan</label>
                                <textarea
                                    value={formStasiun.keterangan}
                                    onChange={(e) => setFormStasiun(prev => ({ ...prev, keterangan: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Tipe Manual. Terawat baik."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" onClick={() => setShowModalStasiun(false)} variant="outline" className="flex-1 rounded-md">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 rounded-md bg-pupr-blue hover:bg-teal-700">
                                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModalHujan && selectedStasiun && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-md shadow-sm max-w-md w-full p-6">
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
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                                <p className="text-xs text-teal-700">
                                    <span className="font-bold">Stasiun:</span> {selectedStasiun.nama_stasiun}
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" onClick={() => setShowModalHujan(false)} variant="outline" className="flex-1 rounded-md">
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isLoading} className="flex-1 rounded-md bg-pupr-blue hover:bg-teal-700">
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

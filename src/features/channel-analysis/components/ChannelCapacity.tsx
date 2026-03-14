import { useState, useEffect } from 'react';

interface ChannelParams {
 b: number; // Lebar dasar (m)
 h: number; // Tinggi jagaan (m)
 m: number; // Kemiringan tebing
 S: number; // Kemiringan saluran
 n: number; // Kekasaran Manning
}

interface HydraulicResults {
 A: number; // Luas basah
 P: number; // Keliling basah
 R: number; // Jari-jari hidrolis
 T: number; // Lebar atas
 Q: number; // Debit kapasitas
 V: number; // Kecepatan aliran
 Fr: number; // Froude number
}

export default function ChannelCapacity() {
 const [params, setParams] = useState<ChannelParams>({
 b: 2.0,
 h: 1.5,
 m: 1.5,
 S: 0.001,
 n: 0.025,
 });

 const [showManningTable, setShowManningTable] = useState(false);
 const [results, setResults] = useState<HydraulicResults | null>(null);
 const [error, setError] = useState<string>('');

 useEffect(() => {
 calculateHydraulics();
 }, [params]);

 const calculateHydraulics = () => {
 try {
 const { b, h, m, S, n } = params;

 if (b <= 0 || h <= 0 || m < 0 || S <= 0 || n <= 0) {
 setError('Semua parameter harus bernilai positif');
 setResults(null);
 return;
 }

 // Perhitungan hidrolis
 const A = (b + m * h) * h; // Luas basah
 const P = b + 2 * h * Math.sqrt(1 + m * m); // Keliling basah
 const R = A / P; // Jari-jari hidrolis
 const T = b + 2 * m * h; // Lebar atas
 const Q = (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S); // Manning
 const V = Q / A; // Kecepatan
 const Fr = V / Math.sqrt(9.81 * (A / T)); // Froude number

 setResults({ A, P, R, T, Q, V, Fr });
 setError('');
 } catch (err) {
 setError('Terjadi kesalahan dalam perhitungan');
 setResults(null);
 }
 };

 const updateParam = (key: keyof ChannelParams, value: string | number) => {
 const numValue = typeof value === 'string' ? parseFloat(value) : value;
 if (!isNaN(numValue)) {
 setParams((prev) => ({ ...prev, [key]: numValue }));
 }
 };

 const renderChannelSVG = () => {
 const { b, h, m } = params;
 const scale = 40;
 const offsetY = 20;

 const width = 400;
 const height = 300;

 const baseWidth = b * scale;
 const channelHeight = h * scale;
 const slopeWidth = m * h * scale;

 const bottomY = height - offsetY - 40;
 const topY = bottomY - channelHeight;

 const centerX = width / 2;
 const leftBottomX = centerX - baseWidth / 2;
 const rightBottomX = centerX + baseWidth / 2;
 const leftTopX = leftBottomX - slopeWidth;
 const rightTopX = rightBottomX + slopeWidth;

 return (
 <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
 {/* Ground */}
 <line x1="0" y1={bottomY} x2={width} y2={bottomY} stroke="#475569" strokeWidth="2" />

 {/* Channel trapezoid */}
 <polygon
 points={`${leftBottomX},${bottomY} ${rightBottomX},${bottomY} ${rightTopX},${topY} ${leftTopX},${topY}`}
 fill="#60a5fa"
 fillOpacity="0.5"
 stroke="#1e293b"
 strokeWidth="3"
 />

 {/* Water fill */}
 <polygon
 points={`${leftBottomX},${bottomY} ${rightBottomX},${bottomY} ${rightTopX},${topY} ${leftTopX},${topY}`}
 fill="#3b82f6"
 fillOpacity="0.3"
 />

 {/* Dimension labels */}
 <text x={centerX} y={bottomY + 30} textAnchor="middle" fontSize="14" fill="#334155">
 b = {b.toFixed(2)} m
 </text>
 <text x={leftTopX - 30} y={(topY + bottomY) / 2} fontSize="14" fill="#334155">
 h = {h.toFixed(2)} m
 </text>
 <text x={leftTopX - 30} y={topY - 10} fontSize="12" fill="#64748b">
 m = {m.toFixed(2)}
 </text>
 </svg>
 );
 };

 return (
 <div className="flex gap-0 min-h-screen bg-slate-50 dark:bg-slate-800">
 {/* LEFT PANEL - Input Parameters */}
 <div className="w-[30%] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 sticky top-0 h-screen overflow-y-auto">
 <div className="p-6">
 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6">Parameter Saluran</h2>

 {/* Section A: Geometri */}
 <div className="mb-8">
 <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
 Geometri
 </h3>

 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 Lebar Dasar (b)
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 step="0.1"
 value={params.b}
 onChange={(e) => updateParam('b', e.target.value)}
 className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 />
 <span className="text-sm text-slate-500 w-8">m</span>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 Tinggi Jagaan (h)
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 step="0.1"
 value={params.h}
 onChange={(e) => updateParam('h', e.target.value)}
 className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 />
 <span className="text-sm text-slate-500 w-8">m</span>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 Kemiringan Tebing (m)
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 step="0.1"
 value={params.m}
 onChange={(e) => updateParam('m', e.target.value)}
 className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 />
 <span className="text-sm text-slate-500 w-8">-</span>
 </div>
 </div>
 </div>
 </div>

 {/* Section B: Hidrolika */}
 <div>
 <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-4">
 Hidrolika
 </h3>

 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 Kemiringan Saluran (S)
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 step="0.0001"
 value={params.S}
 onChange={(e) => updateParam('S', e.target.value)}
 className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 />
 <span className="text-sm text-slate-500 w-8">-</span>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
 Kekasaran Manning (n)
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 step="0.001"
 value={params.n}
 onChange={(e) => updateParam('n', e.target.value)}
 className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 />
 <span className="text-sm text-slate-500 w-8">-</span>
 </div>
 </div>

 <button
 onClick={() => setShowManningTable(!showManningTable)}
 className="flex items-center gap-2 text-sm text-pupr-blue hover:text-pupr-blue font-medium"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 Bantu Saya Pilih 'n'
 </button>

 {showManningTable && (
 <div className="mt-4 p-4 bg-pupr-surface border border-pupr-border rounded-sm text-sm">
 <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Nilai n Manning</h4>
 <ul className="space-y-1 text-slate-700 dark:text-slate-300">
 <li>• Beton: 0.012 - 0.018</li>
 <li>• Pasangan Batu: 0.020 - 0.030</li>
 <li>• Tanah Bersih: 0.022 - 0.033</li>
 <li>• Tanah Berumput: 0.030 - 0.050</li>
 </ul>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* RIGHT PANEL - Visualization & Results */}
 <div className="w-[70%] p-8">
 {/* Zone 1: Visualisasi Penampang */}
 <div className="bg-slate-100 rounded-sm p-8 mb-8 h-80 flex items-center justify-center">
 {renderChannelSVG()}
 </div>

 {/* Error Alert */}
 {error && (
 <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm flex items-start gap-3">
 <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <div>
 <h4 className="font-semibold text-red-800">Peringatan</h4>
 <p className="text-sm text-red-700">{error}</p>
 </div>
 </div>
 )}

 {/* Zone 2: KPIs */}
 {results && (
 <>
 <div className="grid grid-cols-3 gap-6 mb-8">
 <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-700 ">
 <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Debit Kapasitas</div>
 <div className="text-3xl font-bold text-pupr-blue">{results.Q.toFixed(3)}</div>
 <div className="text-sm text-slate-500 mt-1">m³/s</div>
 </div>

 <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-700 ">
 <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Kecepatan Aliran</div>
 <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">{results.V.toFixed(3)}</div>
 <div className="text-sm text-slate-500 mt-1">m/s</div>
 </div>

 <div className="bg-white dark:bg-slate-900 rounded-sm p-6 border border-slate-200 dark:border-slate-700 ">
 <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Status Aliran</div>
 <div className={`text-2xl font-bold ${results.Fr < 1 ? 'text-green-600' : 'text-orange-600'}`}>
 {results.Fr < 1 ? 'Subkritis' : 'Superkritis'}
 </div>
 <div className="text-sm text-slate-500 mt-1">Fr = {results.Fr.toFixed(3)}</div>
 </div>
 </div>

 {/* Zone 3: Tabel Detail Hidrolis */}
 <div className="bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
 <h3 className="font-semibold text-slate-800 dark:text-slate-200">Detail Parameter Hidrolis</h3>
 </div>
 <table className="w-full">
 <thead className="bg-slate-50 dark:bg-slate-800">
 <tr>
 <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Parameter</th>
 <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Simbol</th>
 <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Nilai</th>
 <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Satuan</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 <tr className="hover:bg-slate-50 dark:bg-slate-800">
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">Luas Basah</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono tabular-nums tracking-tight">A</td>
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 text-right font-medium tabular-nums tracking-tight">{results.A.toFixed(3)}</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 tabular-nums tracking-tight">m²</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:bg-slate-800">
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">Keliling Basah</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono tabular-nums tracking-tight">P</td>
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 text-right font-medium tabular-nums tracking-tight">{results.P.toFixed(3)}</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 tabular-nums tracking-tight">m</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:bg-slate-800">
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">Jari-jari Hidrolis</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono tabular-nums tracking-tight">R</td>
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 text-right font-medium tabular-nums tracking-tight">{results.R.toFixed(3)}</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 tabular-nums tracking-tight">m</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:bg-slate-800">
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 tabular-nums tracking-tight">Lebar Atas</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-mono tabular-nums tracking-tight">T</td>
 <td className="px-6 py-4 text-sm text-slate-800 dark:text-slate-200 text-right font-medium tabular-nums tracking-tight">{results.T.toFixed(3)}</td>
 <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 tabular-nums tracking-tight">m</td>
 </tr>
 </tbody>
 </table>
 </div>
 </>
 )}
 </div>
 </div>
 );
}

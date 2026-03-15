import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
 rationalPilotData, 
 haspersPilotData,
 weduwenPilotData,
 melchiorPilotData,
 nakayasuPilotData,
 gamma1PilotData,
 snyderPilotData,
 PilotDataRational,
 PilotDataModifiedRational,
 PilotDataNakayasu,
 PilotDataGamma1,
 PilotDataSnyder
} from '@/data/floodPilotData';

interface PilotDataLoaderProps {
 method: 'RATIONAL' | 'HASPERS' | 'WEDUWEN' | 'MELCHIOR' | 'NAKAYASU' | 'GAMMA1' | 'SNYDER';
 onLoadRational?: (data: PilotDataRational) => void;
 onLoadModifiedRational?: (data: PilotDataModifiedRational) => void;
 onLoadNakayasu?: (data: PilotDataNakayasu) => void;
 onLoadGamma1?: (data: PilotDataGamma1) => void;
 onLoadSnyder?: (data: PilotDataSnyder) => void;
}

export const PilotDataLoader: React.FC<PilotDataLoaderProps> = ({
 method,
 onLoadRational,
 onLoadModifiedRational,
 onLoadNakayasu,
 onLoadGamma1,
 onLoadSnyder
}) => {
 const [isOpen, setIsOpen] = useState(false);
 const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

 const getPilotData = () => {
 switch (method) {
 case 'RATIONAL': return rationalPilotData;
 case 'HASPERS': return haspersPilotData;
 case 'WEDUWEN': return weduwenPilotData;
 case 'MELCHIOR': return melchiorPilotData;
 case 'NAKAYASU': return nakayasuPilotData;
 case 'GAMMA1': return gamma1PilotData;
 case 'SNYDER': return snyderPilotData;
 default: return [];
 }
 };

 const pilotData = getPilotData();

 const getMethodLabel = () => {
 switch (method) {
 case 'RATIONAL': return 'Metode Rasional';
 case 'HASPERS': return 'Metode Haspers & Osugi';
 case 'WEDUWEN': return 'Metode der Weduwen';
 case 'MELCHIOR': return 'Metode Melchior';
 case 'NAKAYASU': return 'HSS Nakayasu';
 case 'GAMMA1': return 'HSS Gamma I';
 case 'SNYDER': return 'HSS Snyder';
 default: return '';
 }
 };

 const handleLoad = () => {
 if (selectedIndex === null) return;

 if (method === 'RATIONAL' && onLoadRational) {
 onLoadRational(rationalPilotData[selectedIndex]);
 } else if (['HASPERS', 'WEDUWEN', 'MELCHIOR'].includes(method) && onLoadModifiedRational) {
 const data = getPilotData()[selectedIndex] as PilotDataModifiedRational;
 onLoadModifiedRational(data);
 } else if (method === 'NAKAYASU' && onLoadNakayasu) {
 onLoadNakayasu(nakayasuPilotData[selectedIndex]);
 } else if (method === 'GAMMA1' && onLoadGamma1) {
 onLoadGamma1(gamma1PilotData[selectedIndex]);
 } else if (method === 'SNYDER' && onLoadSnyder) {
 onLoadSnyder(snyderPilotData[selectedIndex]);
 }

 setIsOpen(false);
 setSelectedIndex(null);
 };

 return (
 <>
 {/* Trigger Button */}
 <button
 onClick={() => setIsOpen(true)}
 className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-sm hover:from-purple-600 hover:to-purple-700 transition-all hover: flex items-center justify-center gap-2 font-bold text-xs"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
 </svg>
 Muat Data Pilot
 </button>

 {/* Modal - Rendered via Portal */}
 {isOpen && ReactDOM.createPortal(
 <>
 {/* Backdrop */}
 <div 
 className="fixed inset-0 bg-slate-900 z-[9999]" 
 onClick={() => setIsOpen(false)}
 />
 
 {/* Modal Content */}
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 pointer-events-none">
 <div className="bg-white dark:bg-slate-900 rounded-sm max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto">
 {/* Header */}
 <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-5 flex items-center justify-between flex-shrink-0">
 <div>
 <h2 className="text-xl font-extrabold text-white">Data Pilot - {getMethodLabel()}</h2>
 <p className="text-purple-100 text-xs mt-1">Pilih data pilot untuk dimuat ke dalam form</p>
 </div>
 <button
 onClick={() => setIsOpen(false)}
 className="text-white hover:bg-white dark:bg-slate-900 rounded-sm p-2 transition-colors flex-shrink-0"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-8">
 <div className="space-y-3">
 {pilotData.map((data, index) => (
 <div
 key={index}
 onClick={() => setSelectedIndex(index)}
 className={`border-2 rounded-sm p-4 cursor-pointer transition-all ${
 selectedIndex === index
 ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
 : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-slate-50 dark:bg-slate-800'
 }`}
 >
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{data.name}</h3>
 <p className="text-xs text-slate-600 dark:text-slate-500 mb-2">{data.description}</p>
 <div className="flex items-center gap-1.5 text-xs text-slate-500">
 <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
 </svg>
 <span className="font-medium">{data.location.channelName}</span>
 <span>•</span>
 <span>{data.location.desa}</span>
 </div>
 </div>
 {selectedIndex === index && (
 <div className="ml-3 bg-purple-600 text-white rounded-sm p-1.5">
 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 )}
 </div>
 <div className="grid grid-cols-4 gap-2">
 {method === 'RATIONAL' ? (
 <>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">C</div>
 <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.C}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
 <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.A}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">tc (min)</div>
 <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.tc}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">I (mm/h)</div>
 <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.I}</div>
 </div>
 </>
 ) : ['HASPERS', 'WEDUWEN', 'MELCHIOR'].includes(method) ? (
 <>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
 <div className="text-xs font-bold text-pupr-blue">{(data as PilotDataModifiedRational).inputs.A}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">L (km)</div>
 <div className="text-xs font-bold text-pupr-blue">{(data as PilotDataModifiedRational).inputs.L}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">S (%)</div>
 <div className="text-xs font-bold text-pupr-blue">{(data as PilotDataModifiedRational).inputs.S}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">I (mm/h)</div>
 <div className="text-xs font-bold text-pupr-blue">{(data as PilotDataModifiedRational).inputs.I}</div>
 </div>
 </>
 ) : method === 'NAKAYASU' ? (
 <>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.A}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">L (km)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.L}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">Ro (mm)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.Ro}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">α</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.Alpha}</div>
 </div>
 </>
 ) : method === 'GAMMA1' ? (
 <>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataGamma1).inputs.A}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">L (km)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataGamma1).inputs.L}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">Ro (mm)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataGamma1).inputs.Ro}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">SF</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataGamma1).inputs.SF}</div>
 </div>
 </>
 ) : method === 'SNYDER' ? (
 <>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataSnyder).inputs.A}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">L (km)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataSnyder).inputs.L}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">Lc (km)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataSnyder).inputs.Lc}</div>
 </div>
 <div className="bg-white dark:bg-slate-900 rounded-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700">
 <div className="text-[10px] text-slate-500 mb-0.5">Ro (mm)</div>
 <div className="text-xs font-bold text-teal-600">{(data as PilotDataSnyder).inputs.Ro}</div>
 </div>
 </>
 ) : null}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Footer */}
 <div className="border-t border-slate-200 dark:border-slate-700 px-8 py-5 bg-slate-50 dark:bg-slate-800 flex items-center justify-between flex-shrink-0">
 <div className="text-xs text-slate-600 dark:text-slate-500">
 {selectedIndex !== null ? (
 <span className="font-semibold text-purple-600">
 ✓ {pilotData[selectedIndex].name}
 </span>
 ) : (
 <span>Pilih salah satu data pilot</span>
 )}
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setIsOpen(false)}
 className="px-4 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-slate-100 transition-colors font-bold text-xs"
 >
 Batal
 </button>
 <button
 onClick={handleLoad}
 disabled={selectedIndex === null}
 className="px-4 py-2 bg-purple-600 text-white rounded-sm hover:bg-purple-700 transition-colors font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 Muat Data
 </button>
 </div>
 </div>
 </div>
 </div>
 </>,
 document.body
 )}
 </>
 );
};

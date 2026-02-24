import React, { useEffect, useRef, useState } from 'react';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { Database, CheckCircle, ChevronDown, MapPin } from 'lucide-react';

export const MasterDataSelector: React.FC = () => {
    const { stasiunList, selectedStasiun, selectStasiun, fetchStasiun } = useHydrologyStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch if empty
    useEffect(() => {
        if (stasiunList.length === 0) {
            fetchStasiun();
        }
    }, [stasiunList.length, fetchStasiun]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (stasiun: any) => {
        selectStasiun(stasiun);
        setIsOpen(false);
    };

    return (
        <div className="w-full relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Sumber Master Data
            </label>
            <div
                className={`w-full bg-white border ${isOpen ? 'border-teal-400 ring-4 ring-teal-500/10' : 'border-slate-200'} rounded-xl cursor-copy transition-all p-3 flex items-center justify-between group shadow-sm hover:border-teal-300 hover:shadow`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedStasiun ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 shrink-0">
                            <MapPin className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 leading-tight">{selectedStasiun.nama_stasiun}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    <CheckCircle className="w-2.5 h-2.5" /> Data Aktif
                                </span>
                                <span className="text-xs text-slate-400 font-medium truncate">
                                    Elevasi {selectedStasiun.elevasi} m
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                            <Database className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="font-medium text-sm text-slate-500">Pilih Stasiun Pengamatan...</p>
                    </div>
                )}

                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-teal-500' : 'group-hover:text-slate-600'}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 z-[9999] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
                    {stasiunList.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">Memuat stasiun...</div>
                    ) : (
                        <ul className="py-2">
                            {stasiunList.map((stasiun) => (
                                <li
                                    key={stasiun.id}
                                    className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between
                                        ${selectedStasiun?.id === stasiun.id ? 'bg-teal-50/50' : 'hover:bg-slate-50'}
                                    `}
                                    onClick={() => handleSelect(stasiun)}
                                >
                                    <div>
                                        <p className={`font-bold text-sm ${selectedStasiun?.id === stasiun.id ? 'text-teal-700' : 'text-slate-700'}`}>
                                            {stasiun.nama_stasiun}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{stasiun.keterangan || 'Data hujan tersedia'}</p>
                                    </div>
                                    {selectedStasiun?.id === stasiun.id && (
                                        <CheckCircle className="w-5 h-5 text-teal-500" />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

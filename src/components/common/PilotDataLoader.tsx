import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  rationalPilotData, 
  nakayasuPilotData,
  PilotDataRational,
  PilotDataNakayasu
} from '@/data/floodPilotData';

interface PilotDataLoaderProps {
  method: 'RATIONAL' | 'NAKAYASU';
  onLoadRational?: (data: PilotDataRational) => void;
  onLoadNakayasu?: (data: PilotDataNakayasu) => void;
}

export const PilotDataLoader: React.FC<PilotDataLoaderProps> = ({
  method,
  onLoadRational,
  onLoadNakayasu
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const pilotData = method === 'RATIONAL' ? rationalPilotData : nakayasuPilotData;

  const handleLoad = () => {
    if (selectedIndex === null) return;

    if (method === 'RATIONAL' && onLoadRational) {
      onLoadRational(rationalPilotData[selectedIndex]);
    } else if (method === 'NAKAYASU' && onLoadNakayasu) {
      onLoadNakayasu(nakayasuPilotData[selectedIndex]);
    }

    setIsOpen(false);
    setSelectedIndex(null);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold text-xs"
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
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white">Data Pilot - {method === 'RATIONAL' ? 'Metode Rasional' : 'HSS Nakayasu'}</h2>
                  <p className="text-purple-100 text-xs mt-1">Pilih data pilot untuk dimuat ke dalam form</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-xl p-2 transition-colors flex-shrink-0"
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
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedIndex === index
                        ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-sm mb-1">{data.name}</h3>
                        <p className="text-xs text-slate-600 mb-2">{data.description}</p>
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
                        <div className="ml-3 bg-purple-600 text-white rounded-full p-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {method === 'RATIONAL' ? (
                        <>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">C</div>
                            <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.C}</div>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
                            <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.A}</div>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">tc (min)</div>
                            <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.tc}</div>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">I (mm/h)</div>
                            <div className="text-xs font-bold text-emerald-600">{(data as PilotDataRational).inputs.I}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">A (km²)</div>
                            <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.A}</div>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">L (km)</div>
                            <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.L}</div>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">Ro (mm)</div>
                            <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.Ro}</div>
                          </div>
                          <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-0.5">α</div>
                            <div className="text-xs font-bold text-teal-600">{(data as PilotDataNakayasu).inputs.Alpha}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-8 py-5 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="text-xs text-slate-600">
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
                  className="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={handleLoad}
                  disabled={selectedIndex === null}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

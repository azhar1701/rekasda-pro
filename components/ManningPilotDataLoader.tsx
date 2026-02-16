import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { manningPilotData, PilotDataManning } from '../data/manningPilotData';

interface ManningPilotDataLoaderProps {
  onLoad: (data: PilotDataManning) => void;
}

export const ManningPilotDataLoader: React.FC<ManningPilotDataLoaderProps> = ({ onLoad }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLoad = () => {
    if (selectedIndex === null) return;
    onLoad(manningPilotData[selectedIndex]);
    setIsOpen(false);
    setSelectedIndex(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold text-xs"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        Muat Data Pilot
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999]" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-8 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white">Data Pilot - Saluran Manning</h2>
                  <p className="text-teal-100 text-xs mt-1">Pilih data pilot untuk dimuat ke dalam form</p>
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

              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-3">
                  {manningPilotData.map((data, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedIndex === index
                          ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-200'
                          : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-sm mb-1">{data.name}</h3>
                          <p className="text-xs text-slate-600 mb-2">{data.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="font-medium">{data.location.channelName}</span>
                            <span>•</span>
                            <span>{data.location.desa}</span>
                          </div>
                        </div>
                        {selectedIndex === index && (
                          <div className="ml-3 bg-teal-600 text-white rounded-full p-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">n</div>
                          <div className="text-xs font-bold text-teal-600">{data.inputs.roughness}</div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">S</div>
                          <div className="text-xs font-bold text-teal-600">{data.inputs.slope}</div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">b (m)</div>
                          <div className="text-xs font-bold text-teal-600">{data.inputs.width}</div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">h (m)</div>
                          <div className="text-xs font-bold text-teal-600">{data.inputs.depth}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 px-8 py-5 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-slate-600">
                  {selectedIndex !== null ? (
                    <span className="font-semibold text-teal-600">
                      ✓ {manningPilotData[selectedIndex].name}
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
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

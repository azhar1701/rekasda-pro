import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { waterBalancePilotData, PilotDataWaterBalance } from '@/data/waterBalancePilotData';

interface WaterBalancePilotDataLoaderProps {
  onLoad: (data: PilotDataWaterBalance) => void;
}

export const WaterBalancePilotDataLoader: React.FC<WaterBalancePilotDataLoaderProps> = ({ onLoad }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLoad = () => {
    if (selectedIndex === null) return;
    onLoad(waterBalancePilotData[selectedIndex]);
    setIsOpen(false);
    setSelectedIndex(null);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold text-xs"
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
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white">Data Pilot - Neraca Air</h2>
                  <p className="text-blue-100 text-xs mt-1">Pilih data pilot untuk dimuat ke dalam form</p>
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
                  {waterBalancePilotData.map((data, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedIndex === index
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-sm mb-1">{data.name}</h3>
                          <p className="text-xs text-slate-600 mb-2">{data.description}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="font-medium">{data.location.channelName}</span>
                            <span>•</span>
                            <span>{data.location.desa}</span>
                          </div>
                        </div>
                        {selectedIndex === index && (
                          <div className="ml-3 bg-blue-600 text-white rounded-full p-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">Penduduk</div>
                          <div className="text-xs font-bold text-blue-600">{(data.inputs.population/1000).toFixed(1)}k</div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">Irigasi</div>
                          <div className="text-xs font-bold text-blue-600">{data.inputs.agricultureArea}Ha</div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">Standar</div>
                          <div className="text-xs font-bold text-blue-600">{data.inputs.domesticStandard}L</div>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-0.5">Demand</div>
                          <div className="text-xs font-bold text-blue-600">{data.inputs.irrigationDemand}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 px-8 py-5 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-slate-600">
                  {selectedIndex !== null ? (
                    <span className="font-semibold text-blue-600">
                      ✓ {waterBalancePilotData[selectedIndex].name}
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

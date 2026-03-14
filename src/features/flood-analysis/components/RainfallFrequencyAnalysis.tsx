import React, { useState } from 'react';
import { FrequencyAnalysisModal } from '@/components/modals/FrequencyAnalysisModal';

interface RainfallFrequencyAnalysisProps {
 onSelectValue: (returnPeriod: number, value: number) => void;
 onModalStateChange?: (isOpen: boolean) => void;
}

export const RainfallFrequencyAnalysis: React.FC<RainfallFrequencyAnalysisProps> = ({ onSelectValue, onModalStateChange }) => {
 const [isModalOpen, setIsModalOpen] = useState(false);

 const handleOpenModal = () => {
 setIsModalOpen(true);
 onModalStateChange?.(true);
 };

 const handleCloseModal = () => {
 setIsModalOpen(false);
 onModalStateChange?.(false);
 };

 return (
 <>
 <button
 onClick={handleOpenModal}
 className="w-full py-3 bg-pupr-blue hover:bg-teal-700 text-white font-semibold rounded-sm transition-colors flex items-center justify-center gap-2"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
 </svg>
 Analisis Frekuensi Hujan
 </button>

 <FrequencyAnalysisModal
 isOpen={isModalOpen}
 onClose={handleCloseModal}
 onSelectValue={onSelectValue}
 />
 </>
 );
};

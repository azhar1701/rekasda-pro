import React from 'react';
import { ManningInputs, CalculationType } from '@/types/types';
import { ChannelWorkstation } from './rebuild/ChannelWorkstation';

interface Props {
  onSave?: (type: CalculationType, inputs: ManningInputs, outputs: any) => void;
  onConsultAI?: (inputs: ManningInputs, outputs: any) => void;
}

/**
 * ManningCalculator - Entry point for Channel Analysis
 * Refactored to use the high-density ChannelWorkstation
 */
export const ManningCalculator: React.FC<Props> = ({ onSave, onConsultAI }) => {
  return (
    <div className="h-full">
      <ChannelWorkstation onSave={onSave} onConsultAI={onConsultAI} />
    </div>
  );
};

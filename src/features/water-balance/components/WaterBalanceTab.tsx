import React from 'react';
import { WaterBalanceRebuild } from './rebuild/WaterBalanceRebuild';

interface Props {
  onConsultAI?: () => void;
}

export const WaterBalanceTab: React.FC<Props> = ({ onConsultAI }) => {
  return (
    <div className="h-full">
      <WaterBalanceRebuild onConsultAI={onConsultAI} />
    </div>
  );
};

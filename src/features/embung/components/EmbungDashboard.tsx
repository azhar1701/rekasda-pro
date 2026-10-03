import React from 'react';
import { EmbungRebuild } from './rebuild/EmbungRebuild';

interface EmbungDashboardProps {
    onConsultAI?: (type: string, data: any, result: any) => void;
    onSave?: (type: any, inputs: any, outputs: any) => void;
}

export const EmbungDashboard: React.FC<EmbungDashboardProps> = ({ onConsultAI, onSave }) => {
    return <EmbungRebuild onConsultAI={onConsultAI} onSave={onSave} />;
};

export default EmbungDashboard;

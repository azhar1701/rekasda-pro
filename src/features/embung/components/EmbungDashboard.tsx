import React from 'react';
import { EmbungRebuild } from './rebuild/EmbungRebuild';

interface EmbungDashboardProps {
    onConsultAI?: (type: string, data: any, result: any) => void;
}

export const EmbungDashboard: React.FC<EmbungDashboardProps> = () => {
    return <EmbungRebuild />;
};

export default EmbungDashboard;

import React, { useState } from 'react';
import { TrendingUp, Activity, CloudRain } from 'lucide-react';
import { PeakDischargeCalculator } from './PeakDischargeCalculator';
import { HydrographCalculator } from './HydrographCalculator';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Tabs, TabsContent } from "@/components/ui/tabs";

interface FloodAnalysisTabProps {
  onSave: (type: any, inputs: any, outputs: any) => void;
  onConsultAI: () => void;
}

type FloodMode = 'peak' | 'hydrograph';

export const FloodAnalysisTab: React.FC<FloodAnalysisTabProps> = ({ onSave, onConsultAI }) => {
  const [mode, setMode] = useState<FloodMode>('peak');

  return (
    <ModuleLayout
      title="Analisis Debit Banjir Rencana"
      description="Perhitungan debit puncak dengan metode empiris & hidrograf satuan sintetik • SNI 2415:2016"
      icon={<CloudRain className="w-6 h-6" />}
      iconColorClass="bg-blue-50 text-blue-600"
    >
      <Tabs defaultValue="peak" value={mode} onValueChange={(v) => setMode(v as FloodMode)} className="flex-1 w-full flex flex-col h-full relative">
        <SegmentedControl
          items={[
            { value: 'peak', label: 'Debit Puncak (Metode Empiris)', icon: <TrendingUp className="w-4 h-4" /> },
            { value: 'hydrograph', label: 'Hidrograf Banjir (Metode HSS)', icon: <Activity className="w-4 h-4" /> }
          ]}
        />

        <div className="flex-1 min-h-0 pt-2 relative">
          <TabsContent value="peak" className="m-0 h-full w-full data-[state=active]:flex flex-col outline-none">
            <PeakDischargeCalculator onSave={onSave} onConsultAI={onConsultAI} />
          </TabsContent>
          <TabsContent value="hydrograph" className="m-0 h-full w-full data-[state=active]:flex flex-col outline-none">
            <HydrographCalculator onSave={onSave} onConsultAI={onConsultAI} />
          </TabsContent>
        </div>
      </Tabs>
    </ModuleLayout>
  );
};

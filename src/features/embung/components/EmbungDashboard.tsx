import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapacityAnalysisTab } from './CapacityAnalysisTab';
import { RoutingAnalysisTab } from './RoutingAnalysisTab';
import { OperationPatternTab } from './OperationPatternTab';
import { SedimentationTab } from './SedimentationTab';
import { Droplets, Activity, Spline, Waves, Database } from 'lucide-react';
import { EmbungProvider } from '../hooks/useEmbungStore';
import { ModuleLayout } from '@/components/layout/ModuleLayout';

interface EmbungDashboardProps {
    onConsultAI?: (type: string, data: any, result: any) => void;
}

export const EmbungDashboard: React.FC<EmbungDashboardProps> = ({ onConsultAI }) => {

    return (
        <EmbungProvider>
            <ModuleLayout
                title="Manajemen Situ & Embung"
                description="Desain & Analisis berdasarkan Standar Perencanaan Embung"
                icon={<Droplets className="w-6 h-6" />}
                iconColorClass="bg-blue-50 text-pupr-blue"
            >
                <div className="flex-1 overflow-hidden flex flex-col h-full min-h-[80vh]">
                    <Tabs defaultValue="capacity" className="w-full h-full flex flex-col">
                        {/* Navigation Pills */}
                        <TabsList className="w-full justify-start p-1 bg-neutral-100 rounded-md mb-6 flex-wrap h-auto gap-1">
                            <TabsTrigger
                                value="capacity"
                                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm font-semibold text-neutral-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Spline className="w-4 h-4" />
                                    <span>Kapasitas (Rippl)</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="routing"
                                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm font-semibold text-neutral-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    <span>Penelusuran Banjir</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="operation"
                                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm font-semibold text-neutral-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Waves className="w-4 h-4" />
                                    <span>Pola Operasi</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="sediment"
                                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-primary-600 data-[state=active]:shadow-sm font-semibold text-neutral-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4" />
                                    <span>Sedimentasi</span>
                                </div>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab Contents - Scrollable internally */}
                        <div className="flex-1 overflow-y-auto pr-1 pb-4">
                            <TabsContent value="capacity" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <CapacityAnalysisTab onConsultAI={(data, result) => onConsultAI?.('Kapasitas Waduk (Metode Rippl)', data, result)} />
                            </TabsContent>

                            <TabsContent value="routing" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <RoutingAnalysisTab onConsultAI={(data, result) => onConsultAI?.('Penelusuran Banjir (Routing)', data, result)} />
                            </TabsContent>

                            <TabsContent value="operation" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <OperationPatternTab onConsultAI={(data, result) => onConsultAI?.('Pola Operasi Waduk', data, result)} />
                            </TabsContent>

                            <TabsContent value="sediment" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <SedimentationTab onConsultAI={(data, result) => onConsultAI?.('Analisis Laju Sedimen', data, result)} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </ModuleLayout>
        </EmbungProvider>
    );
};

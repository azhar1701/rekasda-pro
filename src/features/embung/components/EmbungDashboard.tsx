import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CapacityAnalysisTab } from './CapacityAnalysisTab';
import { RoutingAnalysisTab } from './RoutingAnalysisTab';
import { OperationPatternTab } from './OperationPatternTab';
import { SedimentationTab } from './SedimentationTab';
import { Droplets, Activity, Spline, Waves, Database } from 'lucide-react';
import { EmbungProvider } from '../hooks/useEmbungStore';

export const EmbungDashboard = () => {

    return (
        <EmbungProvider>
            <div className="w-full h-full flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[85vh]">
                {/* Dashboard Header */}
                <div className="px-6 py-5 border-b border-slate-200 bg-white shadow-sm z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0">
                            <Droplets className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Situ & Embung</h1>
                            <p className="text-sm text-slate-500 font-medium">Desain & Analisis berdasarkan Standar Perencanaan Embung</p>
                        </div>
                    </div>
                </div>

                {/* Internal Scrollable Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6">
                    <Tabs defaultValue="capacity" className="w-full h-full flex flex-col">
                        {/* Navigation Pills (Pill-shaped Segmented Control) */}
                        <TabsList className="w-full justify-start p-1 bg-slate-200/50 rounded-xl mb-6 flex-wrap h-auto gap-1">
                            <TabsTrigger
                                value="capacity"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold text-slate-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Spline className="w-4 h-4" />
                                    <span>Kapasitas (Rippl)</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="routing"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold text-slate-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    <span>Penelusuran Banjir</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="operation"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold text-slate-600 px-4 py-2.5 transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Waves className="w-4 h-4" />
                                    <span>Pola Operasi</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="sediment"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold text-slate-600 px-4 py-2.5 transition-all"
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
                                <CapacityAnalysisTab />
                            </TabsContent>

                            <TabsContent value="routing" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <RoutingAnalysisTab />
                            </TabsContent>

                            <TabsContent value="operation" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <OperationPatternTab />
                            </TabsContent>

                            <TabsContent value="sediment" className="h-full m-0 data-[state=active]:flex flex-col outline-none">
                                <SedimentationTab />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </EmbungProvider>
    );
};

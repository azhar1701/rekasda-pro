import re

with open('src/features/embung/components/EmbungDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace imports
content = content.replace('import { EmbungProvider } from \'../hooks/useEmbungStore\';', 
'''import { EmbungProvider } from '../hooks/useEmbungStore';
import { ModuleLayout } from '@/components/layout/ModuleLayout';''')

old_return = """    return (
        <EmbungProvider>
            <div className="w-full h-full flex flex-col bg-neutral-50 rounded-md border border-neutral-200 overflow-hidden min-h-[85vh]">
                {/* Dashboard Header */}
                <div className="px-6 py-5 border-b border-neutral-200 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-md shrink-0">
                            <Droplets className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900">Manajemen Situ & Embung</h1>
                            <p className="text-sm text-neutral-500 font-medium">Desain & Analisis berdasarkan Standar Perencanaan Embung</p>
                        </div>
                    </div>
                </div>

                {/* Internal Scrollable Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col p-6">"""

new_return = """    return (
        <EmbungProvider>
            <ModuleLayout
                title="Manajemen Situ & Embung"
                description="Desain & Analisis berdasarkan Standar Perencanaan Embung"
                icon={<Droplets className="w-6 h-6" />}
                iconColorClass="bg-blue-50 text-pupr-blue"
            >
                <div className="flex-1 overflow-hidden flex flex-col h-full min-h-[80vh]">"""

content = content.replace(old_return, new_return)
content = content.replace("</div>\n            </div>\n        </EmbungProvider>", "</div>\n            </ModuleLayout>\n        </EmbungProvider>")

with open('src/features/embung/components/EmbungDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

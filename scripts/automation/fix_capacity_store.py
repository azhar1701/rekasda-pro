import re

with open("src/features/embung/components/CapacityAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add useHydrologyStore import
if "import { useHydrologyStore }" not in content:
    content = content.replace("import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';", 
"""import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useEffect } from 'react';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';""")

# Inject store logic
old_comp_start = """export const CapacityAnalysisTab: React.FC<CapacityAnalysisTabProps> = ({ onConsultAI }) => {
    const [data, setData] = useState<MonthlyData[]>(INITIAL_DATA);"""

new_comp_start = """export const CapacityAnalysisTab: React.FC<CapacityAnalysisTabProps> = ({ onConsultAI }) => {
    const { neracaFinal, isNeracaDirty } = useHydrologyStore();
    
    // Auto populate from Neraca Air if available
    const [data, setData] = useState<MonthlyData[]>(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            return neracaFinal.map((r, i) => ({
                id: String(i + 1),
                month: r.month,
                inflow: Number(r.ketersediaan.toFixed(2)),
                outflow: Number(r.totalKebutuhan.toFixed(2))
            }));
        }
        return INITIAL_DATA;
    });

    useEffect(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            setData(neracaFinal.map((r, i) => ({
                id: String(i + 1),
                month: r.month,
                inflow: Number(r.ketersediaan.toFixed(2)),
                outflow: Number(r.totalKebutuhan.toFixed(2))
            })));
        }
    }, [neracaFinal]);"""

content = content.replace(old_comp_start, new_comp_start)

# Disable inputs if auto-filled
old_inputs = """    const tableData = data.map((row) => ({
        month: <span className="font-bold text-slate-700">{row.month}</span>,
        inflow: (
            <Input
                type="number"
                value={row.inflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
            />
        ),
        outflow: (
            <Input
                type="number"
                value={row.outflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInputChange(row.id, 'outflow', e.target.value)}
            />
        )
    }));"""

new_inputs = """    const isAutoFilled = Boolean(neracaFinal && neracaFinal.length === 12);

    const tableData = data.map((row) => ({
        month: <span className="font-bold text-slate-700">{row.month}</span>,
        inflow: (
            <Input
                type="number"
                value={row.inflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInputChange(row.id, 'inflow', e.target.value)}
                readOnly={isAutoFilled}
            />
        ),
        outflow: (
            <Input
                type="number"
                value={row.outflow}
                className="h-8 text-right text-sm font-medium tabular-nums tracking-tight border-slate-200"
                onChange={(e) => handleInputChange(row.id, 'outflow', e.target.value)}
                readOnly={isAutoFilled}
            />
        )
    }));"""

content = content.replace(old_inputs, new_inputs)

# Inject warning banner
content = content.replace('<div className="flex flex-col h-full gap-6">',
                          '<div className="flex flex-col h-full gap-6">\n            {isAutoFilled && isNeracaDirty && <DependencyWarningBanner module="neraca" />}\n')

with open("src/features/embung/components/CapacityAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

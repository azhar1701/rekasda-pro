import re

with open("src/features/embung/components/OperationPatternTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "import { useHydrologyStore }" not in content:
    content = content.replace("import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';", 
"""import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useEffect } from 'react';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';""")

# Inject store logic
old_comp_start = """export const OperationPatternTab: React.FC<OperationPatternTabProps> = ({ onConsultAI }) => {
    const [inputs, setInputs] = useState(DEFAULT_INPUTS);"""

new_comp_start = """export const OperationPatternTab: React.FC<OperationPatternTabProps> = ({ onConsultAI }) => {
    const { neracaFinal, isNeracaDirty } = useHydrologyStore();
    
    // Auto populate from Neraca Air if available
    const [inputs, setInputs] = useState(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            return DEFAULT_INPUTS.map((def, i) => ({
                ...def,
                inflow: Number(neracaFinal[i].ketersediaan.toFixed(2)),
                demand: Number(neracaFinal[i].totalKebutuhan.toFixed(2))
            }));
        }
        return DEFAULT_INPUTS;
    });

    useEffect(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            setInputs(prev => prev.map((p, i) => ({
                ...p,
                inflow: Number(neracaFinal[i].ketersediaan.toFixed(2)),
                demand: Number(neracaFinal[i].totalKebutuhan.toFixed(2))
            })));
        }
    }, [neracaFinal]);"""

content = content.replace(old_comp_start, new_comp_start)

# Disable inputs if auto-filled
old_inputs = """    const tableData = inputs.map((row) => ({
        month: <span className="font-bold text-slate-700">{row.month}</span>,
        inflow: <Input type="number" value={row.inflow} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'inflow', e.target.value)} />,
        demand: <Input type="number" value={row.demand} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'demand', e.target.value)} />,
        evap: <Input type="number" value={row.evap} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'evap', e.target.value)} />,
        rain: <Input type="number" value={row.rain} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'rain', e.target.value)} />
    }));"""

new_inputs = """    const isAutoFilled = Boolean(neracaFinal && neracaFinal.length === 12);

    const tableData = inputs.map((row) => ({
        month: <span className="font-bold text-slate-700">{row.month}</span>,
        inflow: <Input type="number" value={row.inflow} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'inflow', e.target.value)} readOnly={isAutoFilled} />,
        demand: <Input type="number" value={row.demand} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'demand', e.target.value)} readOnly={isAutoFilled} />,
        evap: <Input type="number" value={row.evap} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'evap', e.target.value)} />,
        rain: <Input type="number" value={row.rain} className="h-8 text-right tabular-nums border-slate-200" onChange={e => handleInputChange(row.id, 'rain', e.target.value)} />
    }));"""

content = content.replace(old_inputs, new_inputs)

# Inject warning banner
content = content.replace('<div className="flex flex-col h-full gap-6">',
                          '<div className="flex flex-col h-full gap-6">\n            {isAutoFilled && isNeracaDirty && <DependencyWarningBanner module="neraca" />}\n')

with open("src/features/embung/components/OperationPatternTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

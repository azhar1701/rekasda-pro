with open("src/features/embung/components/SedimentationTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add useHydrologyStore import
if "import { useHydrologyStore }" not in content:
    content = content.replace("import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';", 
"""import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useEffect } from 'react';""")

# Inject store logic
old_comp_start = """export const SedimentationTab: React.FC<SedimentationTabProps> = ({ onConsultAI }) => {
    const [params, setParams] = useState(DEFAULT_PARAMS);"""

new_comp_start = """export const SedimentationTab: React.FC<SedimentationTabProps> = ({ onConsultAI }) => {
    const { luasDas, hasilEmbung, setHasilEmbung } = useHydrologyStore();
    
    const [params, setParams] = useState({
        ...DEFAULT_PARAMS,
        catchmentArea: luasDas ? parseFloat(luasDas) : DEFAULT_PARAMS.catchmentArea
    });

    // Auto-update if luasDas changes in the store
    useEffect(() => {
        if (luasDas) {
            setParams(prev => ({ ...prev, catchmentArea: parseFloat(luasDas) }));
        }
    }, [luasDas]);"""

content = content.replace(old_comp_start, new_comp_start)

# Save result to store
old_calc_result = """                const r = calculateSedimentYield(params, mappedSamples);
                setResult(r);
                toast.success('Kalkulasi laju sedimentasi selesai');"""

new_calc_result = """                const r = calculateSedimentYield(params, mappedSamples);
                setResult(r);
                
                // Set to global store for reports
                // Defaulting sediment lifespan loosely based on Dead Storage capacity from Operation Pattern.
                // For now, we will save the calculated volume into the store context 
                // so the report can say e.g. "x m3/tahun"
                setHasilEmbung({
                    isAman: hasilEmbung?.isAman ?? true,
                    reduksiPuncak: hasilEmbung?.reduksiPuncak ?? 0,
                    umurSedimen: Math.round(1000000 / (r.totalSedimentVolume || 1)) // Mock estimate: assume 1M m3 dead storage
                });
                
                toast.success('Kalkulasi laju sedimentasi selesai');"""

content = content.replace(old_calc_result, new_calc_result)

with open("src/features/embung/components/SedimentationTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

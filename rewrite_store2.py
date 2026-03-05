import re

# FIX CAPACITY ANALYSIS
with open("src/features/embung/components/CapacityAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import { useEffect } from 'react';", "")
content = content.replace("const handleInputChange = (id: string, field: keyof MonthlyData, value: string) => {", 
"""const { neracaFinal, isNeracaDirty } = useHydrologyStore();
    const isAutoFilled = Boolean(neracaFinal && neracaFinal.length === 12);

    useEffect(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            setData(neracaFinal.map((r: any, i: number) => ({
                id: String(i + 1),
                month: r.month,
                inflow: Number(r.ketersediaan.toFixed(2)),
                outflow: Number(r.totalKebutuhan.toFixed(2))
            })));
        }
    }, [neracaFinal]);

    const handleInputChange = (id: string, field: keyof MonthlyData, value: string) => {""")

content = content.replace('<div className="flex flex-col h-full gap-6">',
                          '<div className="flex flex-col h-full gap-6">\n            {isAutoFilled && isNeracaDirty && <DependencyWarningBanner module="neraca" />}\n')

content = content.replace("readOnly={isAutoFilled}", "disabled={isAutoFilled}")

with open("src/features/embung/components/CapacityAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)


# FIX OPERATION PATTERN
with open("src/features/embung/components/OperationPatternTab.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

content2 = content2.replace("import { useEffect } from 'react';", "")
content2 = content2.replace("const handleInputChange = (id: string, field: string, value: string) => {",
"""const { neracaFinal, isNeracaDirty } = useHydrologyStore();
    const isAutoFilled = Boolean(neracaFinal && neracaFinal.length === 12);

    useEffect(() => {
        if (neracaFinal && neracaFinal.length === 12) {
            setInputs(prev => prev.map((p, i) => ({
                ...p,
                inflow: Number(neracaFinal[i].ketersediaan.toFixed(2)),
                demand: Number(neracaFinal[i].totalKebutuhan.toFixed(2))
            })));
        }
    }, [neracaFinal]);

    const handleInputChange = (id: string, field: string, value: string) => {""")

content2 = content2.replace('<div className="flex flex-col h-full gap-6">',
                          '<div className="flex flex-col h-full gap-6">\n            {isAutoFilled && isNeracaDirty && <DependencyWarningBanner module="neraca" />}\n')
                          
content2 = content2.replace("readOnly={isAutoFilled}", "disabled={isAutoFilled}")

with open("src/features/embung/components/OperationPatternTab.tsx", "w", encoding="utf-8") as f:
    f.write(content2)

# Fix unused vars in Routing
with open("src/features/embung/components/RoutingAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content3 = f.read()

content3 = content3.replace("const { hasilBanjir, isBanjirDirty, setHasilEmbung, hasilEmbung } = useHydrologyStore();", "const { hasilBanjir, isBanjirDirty, setHasilEmbung } = useHydrologyStore();")
content3 = content3.replace("umurSedimen: hasilEmbung?.umurSedimen ?? 0", "umurSedimen: 0")

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content3)

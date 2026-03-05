# Fix CapacityAnalysisTab
with open("src/features/embung/components/CapacityAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "import { useHydrologyStore }" not in content:
    content = content.replace("import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';", 
"""import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';
import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useEffect } from 'react';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';""")

content = content.replace("neracaFinal.map((r, i)", "neracaFinal.map((r: any, i: number)")

with open("src/features/embung/components/CapacityAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix OperationPatternTab
with open("src/features/embung/components/OperationPatternTab.tsx", "r", encoding="utf-8") as f:
    content2 = f.read()

content2 = content2.replace("neracaFinal.map((r, i)", "neracaFinal.map((r: any, i: number)")

with open("src/features/embung/components/OperationPatternTab.tsx", "w", encoding="utf-8") as f:
    f.write(content2)

# Fix RoutingAnalysisTab
with open("src/features/embung/components/RoutingAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content3 = f.read()

content3 = content3.replace("const { hasilBanjir, isBanjirDirty } = useHydrologyStore();", "const { hasilBanjir, isBanjirDirty, setHasilEmbung, hasilEmbung } = useHydrologyStore();")

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content3)

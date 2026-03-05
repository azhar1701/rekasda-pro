import re

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const { hasilBanjir, isBanjirDirty } = useHydrologyStore();", "const { hasilBanjir, isBanjirDirty, setHasilEmbung, hasilEmbung } = useHydrologyStore();")
content = content.replace(
"""                setHasilEmbung({
                    isAman: s.peakOutflow <= s.peakInflow,
                    reduksiPuncak: s.attenuation,
                    umurSedimen: 50 // mock
                });""",
"""                setHasilEmbung({
                    isAman: s.peakOutflow <= s.peakInflow,
                    reduksiPuncak: s.attenuation,
                    umurSedimen: hasilEmbung?.umurSedimen || 0
                });""")

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

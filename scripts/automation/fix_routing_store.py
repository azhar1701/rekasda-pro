import re

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make sure it's extracted from store
content = content.replace("const { hasilBanjir, isBanjirDirty } = useHydrologyStore();", "const { hasilBanjir, isBanjirDirty, setHasilEmbung, hasilEmbung } = useHydrologyStore();")

# Inject into calculate result
old_success = """                setSummary(s);
                toast.success(`Routing selesai. Puncak debit tereduksi sebesar ${result.attenuationPercent.toFixed(1)}%`);"""

new_success = """                setSummary(s);
                
                // Save to store
                setHasilEmbung({
                    isAman: s.peakOutflow <= s.peakInflow,
                    reduksiPuncak: s.attenuation,
                    umurSedimen: hasilEmbung?.umurSedimen ?? 0
                });

                toast.success(`Routing selesai. Puncak debit tereduksi sebesar ${result.attenuationPercent.toFixed(1)}%`);"""

content = content.replace(old_success, new_success)

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

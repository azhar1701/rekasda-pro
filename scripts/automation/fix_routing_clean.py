with open("src/features/embung/components/RoutingAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

bad_block = """                setResultData(chartData);
                setSummary(s); setHasilEmbung({ isAman: s.peakOutflow <= s.peakInflow, reduksiPuncak: s.attenuation, umurSedimen: hasilEmbung?.umurSedimen || 0 }); //
                    const s = { peakInflow: Number(routingResult.peakInflow.toFixed(2)),
                    peakOutflow: Number(routingResult.peakOutflow.toFixed(2)),
                    attenuation: Number((routingResult.attenuationRatio).toFixed(1))
                };"""

good_block = """                setResultData(chartData);
                
                const s = { 
                    peakInflow: Number(routingResult.peakInflow.toFixed(2)),
                    peakOutflow: Number(routingResult.peakOutflow.toFixed(2)),
                    attenuation: Number((routingResult.attenuationRatio).toFixed(1))
                };
                
                setSummary(s); 
                setHasilEmbung({ 
                    isAman: s.peakOutflow <= s.peakInflow, 
                    reduksiPuncak: s.attenuation, 
                    umurSedimen: hasilEmbung?.umurSedimen || 0 
                });"""

content = content.replace(bad_block, good_block)

with open("src/features/embung/components/RoutingAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

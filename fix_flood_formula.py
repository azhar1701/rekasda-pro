import re

with open('src/features/flood-analysis/components/ModulBanjirRencana.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_str = "import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';\n"
if "FormulaAccordion" not in content:
    content = content.replace("import { ProjectContextBanner }", import_str + "import { ProjectContextBanner }")

# Add FormulaAccordion after ProjectContextBanner
old_str = """                            {/* Project Banner (SSOT) */}
                            <ProjectContextBanner />

                            {/* Master Data Selector */}"""

new_str = """                            {/* Project Banner (SSOT) */}
                            <ProjectContextBanner />

                            <div className="mb-2">
                                <FormulaAccordion 
                                    title="Analisis Banjir Rancangan"
                                    subtitle="Metode Rasional & Hidrograf Satuan Sintetis (HSS)"
                                    theme="purple"
                                    formulas={[
                                        { label: "Metode Rasional", math: "Q_p = 0.278 \\cdot C \\cdot I \\cdot A" },
                                        { label: "Intensitas Hujan (Mononobe)", math: "I = \\frac{R_{24}}{24} \\left(\\frac{24}{t_c}\\right)^{2/3}" },
                                        { label: "Waktu Konsentrasi (Kirpich)", math: "t_c = \\left(\\frac{0.87 \\cdot L^2}{1000 \\cdot S}\\right)^{0.385}" },
                                        { label: "HSS Nakayasu", math: "Q_p = \\frac{C \\cdot A \\cdot R_o}{3.6 \\cdot (0.3 \\cdot T_p + T_{0.3})}" }
                                    ]}
                                    parameters={[
                                        { symbol: "Q_p", description: "Debit puncak banjir rancangan", unit: "m³/s" },
                                        { symbol: "C", description: "Koefisien pengaliran / limpasan", unit: "-" },
                                        { symbol: "I", description: "Intensitas curah hujan", unit: "mm/jam" },
                                        { symbol: "A", description: "Luas Daerah Aliran Sungai (DAS)", unit: "km²" },
                                        { symbol: "t_c", description: "Waktu konsentrasi", unit: "jam" },
                                        { symbol: "R_{24}", description: "Curah hujan rancangan 24 jam", unit: "mm" },
                                        { symbol: "L", description: "Panjang sungai utama", unit: "km" },
                                        { symbol: "S", description: "Kemiringan sungai", unit: "m/m" }
                                    ]}
                                    reference="SNI 2415:2016 (Tata Cara Perhitungan Debit Banjir Rencana)"
                                />
                            </div>

                            {/* Master Data Selector */}"""

content = content.replace(old_str, new_str)

with open('src/features/flood-analysis/components/ModulBanjirRencana.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

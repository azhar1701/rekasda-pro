import re

with open('src/features/water-balance/components/WaterBalanceTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace import
content = content.replace("import { WaterBalanceFormulaDisplay } from '@/components/ui/data-display/WaterBalanceFormulaDisplay';", "import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';")

# Replace Usage string matching
old_str = """              {/* Formula Display */}
              <Collapsible title="Rumus Neraca Air" defaultOpen={false}>
                <WaterBalanceFormulaDisplay />
              </Collapsible>"""

new_str = """              {/* Formula Display */}
              <div className="mb-4">
                <FormulaAccordion 
                  title="Neraca Air"
                  subtitle="SNI 6738:2015 & SNI 19-6728.1-2002"
                  theme="emerald"
                  formulas={[
                    { label: "Persamaan Neraca Air", math: "Neraca = Q_{andalan} - (D_{irigasi} + D_{domestik} + D_{lingkungan})" },
                    { label: "Debit Andalan (Mock)", math: "Q = \\frac{A \\cdot R}{C}" },
                    { label: "Kebutuhan Irigasi", math: "NFR = ET_c + P + WL - R_e" }
                  ]}
                  parameters={[
                    { symbol: "Q_{andalan}", description: "Ketersediaan air andalan (probabilitas 80%)", unit: "m³/s" },
                    { symbol: "D_{irigasi}", description: "Kebutuhan air irigasi", unit: "m³/s" },
                    { symbol: "D_{domestik}", description: "Kebutuhan air baku & domestik", unit: "m³/s" },
                    { symbol: "D_{lingkungan}", description: "Kebutuhan pemeliharaan sungai", unit: "m³/s" },
                    { symbol: "ET_c", description: "Evapotranspirasi tanaman", unit: "mm/hari" },
                    { symbol: "R_e", description: "Curah hujan efektif", unit: "mm/hari" }
                  ]}
                  reference="Pedoman Perhitungan Ketersediaan Air (F.J. Mock) dan Kebutuhan Air Irigasi"
                />
              </div>"""

content = content.replace(old_str, new_str)

with open('src/features/water-balance/components/WaterBalanceTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

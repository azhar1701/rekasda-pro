with open('src/features/channel-analysis/components/ManningCalculator.tsx', 'r') as f:
    content = f.read()

# Replace import
content = content.replace("import { ManningFormulaDisplay } from '@/components/ui/data-display/ManningFormulaDisplay';", "import { FormulaAccordion } from '@/components/ui/data-display/FormulaAccordion';")

# Replace Usage string matching
old_str = """            {/* Formula Display */}
            <Collapsible title="Rumus Manning" defaultOpen={false}>
              <ManningFormulaDisplay />
            </Collapsible>"""

new_str = """            {/* Formula Display */}
            <div className="mb-4">
              <FormulaAccordion 
                title="Persamaan Manning"
                subtitle="Perhitungan Kapasitas Saluran Terbuka"
                theme="blue"
                formulas={[
                  { label: "Rumus Utama (Debit)", math: "Q = \\frac{1}{n} \\cdot A \\cdot R^{2/3} \\cdot S^{1/2}" },
                  { label: "Kecepatan Aliran", math: "V = \\frac{Q}{A}" },
                  { label: "Jari-jari Hidrolis", math: "R = \\frac{A}{P}" },
                  { label: "Bilangan Froude", math: "Fr = \\frac{V}{\\sqrt{g \\cdot D}}" }
                ]}
                parameters={[
                  { symbol: "Q", description: "Debit aliran rancangan", unit: "m³/s" },
                  { symbol: "V", description: "Kecepatan aliran", unit: "m/s" },
                  { symbol: "n", description: "Koefisien kekasaran Manning", unit: "-" },
                  { symbol: "A", description: "Luas penampang basah", unit: "m²" },
                  { symbol: "R", description: "Jari-jari hidrolis", unit: "m" },
                  { symbol: "P", description: "Keliling penampang basah", unit: "m" },
                  { symbol: "S", description: "Kemiringan dasar saluran", unit: "m/m" },
                  { symbol: "Fr", description: "Bilangan Froude (Fr < 1 Subkritis)", unit: "-" }
                ]}
                reference="SNI 03-3424-1994 (Tata Cara Perencanaan Drainase Permukaan Jalan)"
              />
            </div>"""

content = content.replace(old_str, new_str)

with open('src/features/channel-analysis/components/ManningCalculator.tsx', 'w') as f:
    f.write(content)

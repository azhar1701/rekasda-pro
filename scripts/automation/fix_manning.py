import re

with open('src/features/channel-analysis/components/ManningCalculator.tsx', 'r') as f:
    content = f.read()

# 1. Remove import
content = re.sub(r"import \{ ManningPilotDataLoader \} from '\./ManningPilotDataLoader';\n", "", content)

# 2. Remove loadMessage state
content = re.sub(r"  const \[loadMessage, setLoadMessage\] = useState<string \| null>\(null\);\n", "", content)

# 3. Remove handleLoadPilotData function
content = re.sub(r"  const handleLoadPilotData = \([^)]*\) => \{[\s\S]*?^\s*};\n", "", content, flags=re.MULTILINE | re.DOTALL)

# 4. Remove Collapsible component wrapping Pilot DataLoader
content = re.sub(r"\s*\{\/\* Data Pilot Loader \*\/\}\n\s*<Collapsible title=\"Data Pilot & Konfigurasi\" defaultOpen=\{true\}>\n\s*<div className=\"bg-slate-50\/50 p-4 border-b border-slate-100\">\n\s*<ManningPilotDataLoader onLoad=\{handleLoadPilotData\} />\n\s*</div>\n\s*</Collapsible>", "", content, flags=re.MULTILINE)

# 5. Remove toast loadMessage
content = re.sub(r"\s*\{\/\* Toast Messages positioning adjusted for Fixed Shell \*\/\}\n\s*\{loadMessage && \([\s\S]*?^\s*\)\}\n", "\n        {/* Toast Messages positioning adjusted for Fixed Shell */}\n", content, flags=re.MULTILINE | re.DOTALL)


with open('src/features/channel-analysis/components/ManningCalculator.tsx', 'w') as f:
    f.write(content)

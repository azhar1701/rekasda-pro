import re

# Fix Manning
with open('src/features/channel-analysis/components/ManningCalculator.tsx', 'r') as f:
    manning = f.read()

manning = re.sub(r"\s*\{\/\* Data Pilot Loader \*\/\}\n\s*<Collapsible title=\"Data Pilot & Konfigurasi\" defaultOpen=\{true\}>\n\s*<div className=\"space-y-4\">\n\s*<ManningPilotDataLoader onLoad=\{handleLoadPilotData\} \/>\n\s*</div>\n\s*<\/Collapsible>\n", "", manning)
with open('src/features/channel-analysis/components/ManningCalculator.tsx', 'w') as f:
    f.write(manning)


# Fix Water Balance
with open('src/features/water-balance/components/WaterBalanceTab.tsx', 'r') as f:
    water = f.read()

water = re.sub(r"\s*\{\/\* Data Pilot Loader \*\/\}\n\s*<Collapsible title=\"Data Pilot & Konfigurasi\" defaultOpen=\{true\}>\n\s*<div className=\"space-y-4\">\n\s*<WaterBalancePilotDataLoader onLoad=\{handleLoadPilotData\} \/>\n\s*</div>\n\s*<\/Collapsible>\n", "", water)
with open('src/features/water-balance/components/WaterBalanceTab.tsx', 'w') as f:
    f.write(water)

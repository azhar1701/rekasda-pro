import re

# FIX CAPACITY ANALYSIS
with open("src/features/embung/components/CapacityAnalysisTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

imports = """import { useHydrologyStore } from '@/stores/useHydrologyStore';
import { useEffect } from 'react';
import { DependencyWarningBanner } from '@/components/ui/DependencyWarningBanner';"""

if "import { useHydrologyStore }" not in content:
    content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';")
    content = content.replace("import type { MonthlyData, SequentPeakResult } from '../types/embung.types';", 
        f"import type {{ MonthlyData, SequentPeakResult }} from '../types/embung.types';\n{imports}")

with open("src/features/embung/components/CapacityAnalysisTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)


# FIX OPERATION PATTERN
with open("src/features/embung/components/OperationPatternTab.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "import { useHydrologyStore }" not in content:
    content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';")
    content = content.replace("import { HydroValidationError } from '@/features/embung/types/embung.types';", 
        f"import {{ HydroValidationError }} from '@/features/embung/types/embung.types';\n{imports}")

with open("src/features/embung/components/OperationPatternTab.tsx", "w", encoding="utf-8") as f:
    f.write(content)

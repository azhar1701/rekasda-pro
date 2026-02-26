# Gold Standard Batch Refactoring Script
# Run this in PowerShell from project root

$files = @(
    "src\features\embung\components\EmbungDashboard.tsx",
    "src\features\embung\components\CapacityAnalysisTab.tsx",
    "src\features\embung\components\RoutingAnalysisTab.tsx",
    "src\features\embung\components\OperationPatternTab.tsx",
    "src\features\embung\components\SedimentationTab.tsx",
    "src\features\master-data\components\MasterDataDashboard.tsx",
    "src\features\master-data\components\MasterDataPage.tsx",
    "src\features\flood-analysis\components\FloodAnalysisTab.tsx",
    "src\features\flood-analysis\components\ModulAnalisisFrekuensi.tsx",
    "src\features\history\components\AllDataTab.tsx",
    "src\features\water-balance\components\WaterBalanceTab.tsx"
)

Write-Host "🎨 Starting Gold Standard Batch Refactoring..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # 1. Remove glassmorphism
        $content = $content -replace 'backdrop-blur', ''
        $content = $content -replace 'bg-slate-50/80', 'bg-white'
        $content = $content -replace '/80', ''
        $content = $content -replace '/50', ''
        
        # 2. Fix rounded corners
        $content = $content -replace 'rounded-3xl', 'rounded-xl'
        $content = $content -replace 'rounded-2xl', 'rounded-xl'
        
        # 3. Update colors: slate -> neutral
        $content = $content -replace 'border-slate-', 'border-neutral-'
        $content = $content -replace 'text-slate-', 'text-neutral-'
        $content = $content -replace 'bg-slate-', 'bg-neutral-'
        
        # 4. Update semantic colors
        $content = $content -replace 'bg-teal-50', 'bg-primary-50'
        $content = $content -replace 'text-teal-600', 'text-primary-600'
        $content = $content -replace 'text-teal-700', 'text-primary-600'
        
        # 5. Remove shadow-sm
        $content = $content -replace ' shadow-sm', ''
        
        # Save
        Set-Content $file -Value $content -NoNewline
        
        Write-Host "   ✅ Done" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Batch refactoring complete!" -ForegroundColor Green

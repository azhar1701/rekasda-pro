@echo off
echo Starting Gold Standard Batch Refactoring...
echo.

powershell -Command "$files = @('src\features\embung\components\EmbungDashboard.tsx', 'src\features\master-data\components\MasterDataDashboard.tsx'); foreach ($file in $files) { if (Test-Path $file) { $content = Get-Content $file -Raw; $content = $content -replace 'backdrop-blur', ''; $content = $content -replace '/80', ''; $content = $content -replace '/50', ''; $content = $content -replace 'rounded-3xl', 'rounded-xl'; $content = $content -replace 'rounded-2xl', 'rounded-xl'; $content = $content -replace 'border-slate-', 'border-neutral-'; $content = $content -replace 'text-slate-', 'text-neutral-'; $content = $content -replace 'bg-slate-', 'bg-neutral-'; $content = $content -replace ' shadow-sm', ''; Set-Content $file -Value $content -NoNewline; Write-Host \"Processed: $file\" } }"

echo.
echo Batch refactoring complete!
echo.
pause

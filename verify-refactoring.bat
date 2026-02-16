@echo off
echo ========================================
echo Production-Grade Refactoring Verification
echo ========================================
echo.

echo [1/4] Checking TypeScript compilation...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo [FAIL] TypeScript compilation failed
    exit /b 1
) else (
    echo [PASS] TypeScript compilation successful
)
echo.

echo [2/4] Checking build...
call npm run build
if %errorlevel% neq 0 (
    echo [FAIL] Build failed
    exit /b 1
) else (
    echo [PASS] Build successful
)
echo.

echo [3/4] Verifying folder structure...
if exist "src\features" (
    echo [PASS] src\features exists
) else (
    echo [FAIL] src\features missing
    exit /b 1
)

if exist "src\lib" (
    echo [PASS] src\lib exists
) else (
    echo [FAIL] src\lib missing
    exit /b 1
)

if exist "src\types" (
    echo [PASS] src\types exists
) else (
    echo [FAIL] src\types missing
    exit /b 1
)

if exist "src\hooks" (
    echo [PASS] src\hooks exists
) else (
    echo [FAIL] src\hooks missing
    exit /b 1
)
echo.

echo [4/4] Verifying key files...
if exist "src\features\flood-analysis\components\HydrographChart.tsx" (
    echo [PASS] HydrographChart.tsx exists
) else (
    echo [FAIL] HydrographChart.tsx missing
    exit /b 1
)

if exist "src\lib\utils\formatting.ts" (
    echo [PASS] formatting.ts exists
) else (
    echo [FAIL] formatting.ts missing
    exit /b 1
)

if exist "tsconfig.json" (
    echo [PASS] tsconfig.json exists
) else (
    echo [FAIL] tsconfig.json missing
    exit /b 1
)
echo.

echo ========================================
echo [SUCCESS] All verifications passed!
echo ========================================
echo.
echo Your codebase is production-ready!
echo.
echo Next steps:
echo 1. Review QUICK_START.md
echo 2. Check GOLDEN_SAMPLE.tsx
echo 3. Start building features!
echo.
pause

@echo off
echo Checking build configuration and files...
echo.

echo 1. Checking if CSV file exists in public directory:
if exist "public\docs\diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv" (
    echo ✓ CSV file found in public/docs/
    for %%A in ("public\docs\diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv") do echo   File size: %%~zA bytes
) else (
    echo ✗ CSV file NOT found in public/docs/
)
echo.

echo 2. Building the project...
call npm run build
echo.

echo 3. Checking if CSV file exists in dist directory after build:
if exist "dist\docs\diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv" (
    echo ✓ CSV file found in dist/docs/
    for %%A in ("dist\docs\diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv") do echo   File size: %%~zA bytes
) else (
    echo ✗ CSV file NOT found in dist/docs/ - This will cause the deployment issue!
)
echo.

echo 4. Listing dist directory structure:
if exist "dist" (
    echo dist/ directory contents:
    dir /s /b dist
) else (
    echo dist/ directory not found
)
echo.

echo 5. Debug instructions:
echo - If CSV file is missing from dist/, the build process is not copying public files correctly
echo - Access /debug-location.html on your deployed site to test file accessibility
echo - Check browser console for detailed error messages
echo.

pause
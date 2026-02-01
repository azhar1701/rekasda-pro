#!/bin/bash

echo "Checking build configuration and files..."
echo

echo "1. Checking if CSV file exists in public directory:"
if [ -f "public/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv" ]; then
    echo "✓ CSV file found in public/docs/"
    echo "  File size: $(wc -c < public/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv) bytes"
else
    echo "✗ CSV file NOT found in public/docs/"
fi
echo

echo "2. Building the project..."
npm run build
echo

echo "3. Checking if CSV file exists in dist directory after build:"
if [ -f "dist/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv" ]; then
    echo "✓ CSV file found in dist/docs/"
    echo "  File size: $(wc -c < dist/docs/diskominfo-od_kode_wilayah_dan_nama_wilayah_desa_kelurahan_data.csv) bytes"
else
    echo "✗ CSV file NOT found in dist/docs/ - This will cause the deployment issue!"
fi
echo

echo "4. Listing dist directory structure:"
if [ -d "dist" ]; then
    echo "dist/ directory contents:"
    find dist -type f | head -20
    echo "..."
else
    echo "dist/ directory not found"
fi
echo

echo "5. Debug instructions:"
echo "- If CSV file is missing from dist/, the build process is not copying public files correctly"
echo "- Access /debug-location.html on your deployed site to test file accessibility"
echo "- Check browser console for detailed error messages"
echo
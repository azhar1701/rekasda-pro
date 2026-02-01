@echo off
echo Starting RekaSDA Pro Application...
echo.

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Checking environment file...
if not exist ".env.local" (
    echo WARNING: .env.local file not found.
    echo Creating template .env.local file...
    copy .env .env.local
    echo.
    echo Please edit .env.local and add your API keys:
    echo - VITE_API_KEY=your_gemini_api_key_here
    echo - VITE_SUPABASE_URL=your_supabase_url_here  
    echo - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
    echo.
    echo Press any key to continue with default values...
    pause >nul
)

echo.
echo Starting development server...
echo Open http://localhost:3000 in your browser
echo Press Ctrl+C to stop the server
echo.

npm run dev
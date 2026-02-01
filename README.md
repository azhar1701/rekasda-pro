<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DHfEoxkh6x4GCOK3YRIAgkG6gJpWMaVK

## Quick Start

**Prerequisites:** Node.js

### Option 1: Use Startup Script (Recommended)
```bash
# On Windows
start.bat

# On Mac/Linux  
chmod +x start.sh && ./start.sh
```

### Option 2: Manual Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

## Troubleshooting Blank Page

If you see a blank page on startup:

1. **Check Browser Console** - Press F12 and look for errors
2. **Verify Environment File** - Make sure `.env.local` exists with valid API keys
3. **Clear Browser Cache** - Hard refresh with Ctrl+F5
4. **Check Node.js Version** - Requires Node.js 16+ 
5. **Reinstall Dependencies** - Delete `node_modules` and run `npm install`

## Environment Variables

Create `.env.local` file with:
```
VITE_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Common Issues

- **Blank Page**: Usually caused by missing `.env.local` file or React version mismatch
- **Build Errors**: Check that all dependencies are installed correctly
- **Database Connection**: App works offline if Supabase credentials are not provided

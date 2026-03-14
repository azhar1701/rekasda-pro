@echo off
REM Auto Commit and Push Batch Script for RekaSDA Pro
REM Usage: auto-commit-push.bat [commit-message]

setlocal enabledelayedexpansion

echo 🔍 Checking git status...
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git status failed. Are you in a git repository?
    exit /b 1
)

REM Check if there are any changes
git status --porcelain | findstr . >nul
if %errorlevel% neq 0 (
    echo ✅ No changes to commit. Repository is clean.
    exit /b 0
)

echo 📝 Staging all changes...
git add .

REM Set default commit message if not provided
if "%~1"=="" (
    set "COMMIT_MSG=auto: update project files"
) else (
    set "COMMIT_MSG=%~1"
)

echo 💾 Committing changes with message: !COMMIT_MSG!
git commit -m "!COMMIT_MSG!"

if %errorlevel% equ 0 (
    echo 🚀 Pushing to remote...

    REM Get current branch name
    for /f %%i in ('git branch --show-current') do set BRANCH=%%i

    git push origin !BRANCH!

    if %errorlevel% equ 0 (
        echo ✅ Successfully committed and pushed!
        echo 📋 Commit details:
        git log --oneline -1
    ) else (
        echo ❌ Push failed. Please check your connection and try again.
        exit /b 1
    )
) else (
    echo ❌ Commit failed. Please check your changes.
    exit /b 1
)
@echo off
title BetterBudget Updater
echo ============================================
echo        BetterBudget - Update Script
echo ============================================
echo.

echo [1/4] Pulling latest changes from GitHub...
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Git pull failed. Check your internet connection or resolve merge conflicts.
    pause
    exit /b 1
)
echo.

echo [2/4] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed for frontend.
    pause
    exit /b 1
)
echo.

echo [3/4] Installing backend dependencies...
cd backend
call npm install
cd ..
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed for backend.
    pause
    exit /b 1
)
echo.

echo [4/4] Building frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Build failed, but you can still run in dev mode with "npm run dev".
)
echo.

echo ============================================
echo        Update complete!
echo.
echo   To start the app, run: npm run dev
echo ============================================
pause

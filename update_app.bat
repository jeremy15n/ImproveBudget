@echo off
title BetterBudget Updater
setlocal enabledelayedexpansion

:: Change to the directory where this script lives (the repo root)
cd /d "%~dp0"

echo ============================================
echo        BetterBudget - Update Script
echo ============================================
echo.

:: Check if this is a git repository
if exist ".git" (
    echo [1/4] Pulling latest changes from GitHub...
    git pull origin main
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Git pull failed. Check your internet connection or resolve merge conflicts.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [1/4] Downloading latest version from GitHub...
    echo.

    :: Save current database before updating
    if exist "backend\data\budget.db" (
        echo       Backing up your database...
        copy /y "backend\data\budget.db" "%TEMP%\betterbudget_backup.db" >nul
        echo       Backup saved to %TEMP%\betterbudget_backup.db
    )

    :: Download latest ZIP using PowerShell (available on all modern Windows)
    powershell -Command "try { Invoke-WebRequest -Uri 'https://github.com/jeremy15n/BetterBudget/archive/refs/heads/main.zip' -OutFile '%TEMP%\BetterBudget-update.zip' } catch { exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Download failed. Check your internet connection.
        pause
        exit /b 1
    )

    :: Extract to temp directory
    echo       Extracting update...
    powershell -Command "try { Expand-Archive -Path '%TEMP%\BetterBudget-update.zip' -DestinationPath '%TEMP%\BetterBudget-extract' -Force } catch { exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Extraction failed.
        pause
        exit /b 1
    )

    :: Copy new files over current directory (preserves backend/data/)
    echo       Applying update...
    xcopy /s /e /y "%TEMP%\BetterBudget-extract\BetterBudget-main\*" "%~dp0" >nul

    :: Restore database if it was backed up
    if exist "%TEMP%\betterbudget_backup.db" (
        if not exist "backend\data" mkdir "backend\data"
        copy /y "%TEMP%\betterbudget_backup.db" "backend\data\budget.db" >nul
        echo       Database restored.
    )

    :: Clean up temp files
    del /q "%TEMP%\BetterBudget-update.zip" 2>nul
    rmdir /s /q "%TEMP%\BetterBudget-extract" 2>nul

    echo       Download complete!
    echo.
)

echo [2/4] Installing frontend dependencies...
call npm install
if !ERRORLEVEL! NEQ 0 (
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
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo ERROR: npm install failed for backend.
    pause
    exit /b 1
)
echo.

echo [4/4] Building frontend...
call npm run build
if !ERRORLEVEL! NEQ 0 (
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

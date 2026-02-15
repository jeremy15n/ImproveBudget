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
    echo [1/3] Pulling latest changes from GitHub...
    git pull origin main
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Git pull failed. Check your internet connection or resolve merge conflicts.
        pause
        exit /b 1
    )
    echo.
) else (
    echo [1/3] Downloading latest version from GitHub...
    echo.

    :: Save current database before updating
    if exist "backend\data\budget.db" (
        echo       Backing up your database...
        copy /y "backend\data\budget.db" "%TEMP%\betterbudget_backup.db" >nul
        echo       Backup saved.
    )

    :: Download latest ZIP using PowerShell with TLS 1.2
    echo       Downloading...
    powershell -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { Invoke-WebRequest -Uri 'https://github.com/jeremy15n/BetterBudget/archive/refs/heads/main.zip' -OutFile '%TEMP%\BetterBudget-update.zip' -UseBasicParsing } catch { Write-Host ('       Download error: ' + $_.Exception.Message); exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Download failed. Check your internet connection.
        echo       You can also manually download from GitHub and extract over this folder.
        pause
        exit /b 1
    )

    :: Extract to temp directory
    echo       Extracting...
    if exist "%TEMP%\BetterBudget-extract" rmdir /s /q "%TEMP%\BetterBudget-extract"
    powershell -ExecutionPolicy Bypass -Command "try { Expand-Archive -Path '%TEMP%\BetterBudget-update.zip' -DestinationPath '%TEMP%\BetterBudget-extract' -Force } catch { Write-Host ('       Extract error: ' + $_.Exception.Message); exit 1 }"
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo ERROR: Extraction failed.
        pause
        exit /b 1
    )

    :: Copy new files over current directory
    echo       Applying update...
    xcopy /s /e /y "%TEMP%\BetterBudget-extract\BetterBudget-main\*" "%~dp0" >nul

    :: Restore database
    if exist "%TEMP%\betterbudget_backup.db" (
        if not exist "backend\data" mkdir "backend\data"
        copy /y "%TEMP%\betterbudget_backup.db" "backend\data\budget.db" >nul
        echo       Database restored.
    )

    :: Clean up temp files
    del /q "%TEMP%\BetterBudget-update.zip" 2>nul
    rmdir /s /q "%TEMP%\BetterBudget-extract" 2>nul

    echo       Update downloaded successfully!
    echo.
)

echo [2/3] Installing dependencies...
call npm install
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo ERROR: npm install failed for frontend.
    pause
    exit /b 1
)
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

echo [3/3] Building frontend...
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo NOTE: Build failed, but you can still run in dev mode.
)
echo.

echo ============================================
echo        Update complete!
echo.
echo   To start the app, run: npm run dev
echo ============================================
pause

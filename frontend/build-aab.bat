@echo off
REM CeylonRoam Android AAB Build Script (for Play Store)
REM This script builds a release AAB (Android App Bundle)

echo =========================================
echo CeylonRoam Android AAB Build Script
echo =========================================
echo.

REM Step 1: Build the web app
echo Step 1: Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)
echo Web build complete!
echo.

REM Step 2: Sync with Capacitor
echo Step 2: Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo Capacitor sync complete!
echo.

REM Step 3: Build the AAB
echo Step 3: Building Android App Bundle...
cd android
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo ERROR: Android build failed!
    echo.
    echo NOTE: Release builds require signing configuration.
    echo For testing, use build-apk.bat instead.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo =========================================
echo BUILD SUCCESSFUL!
echo =========================================
echo.
echo Your AAB is ready at:
echo frontend\android\app\build\outputs\bundle\release\app-release.aab
echo.
echo This AAB is ready for Google Play Store upload.
echo.
pause

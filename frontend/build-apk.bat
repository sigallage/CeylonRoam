@echo off
REM CeylonRoam Android APK Build Script
REM This script builds a debug APK for testing on Android devices

echo =========================================
echo CeylonRoam Android APK Build Script
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

REM Step 3: Build the APK
echo Step 3: Building Android APK...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ERROR: Android build failed!
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
echo Your APK is ready at:
echo frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo To install on your phone:
echo 1. Enable Developer Options and USB Debugging on your phone
echo 2. Connect your phone via USB
echo 3. Run: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Or copy the APK to your phone and install it directly.
echo.
pause

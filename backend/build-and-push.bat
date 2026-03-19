@echo off
REM CeylonRoam - Build and Push All Docker Images
REM This script builds all microservices and pushes them to Docker Hub

setlocal enabledelayedexpansion

echo ============================================
echo CeylonRoam Docker Build and Push Script
echo ============================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is running. Good!
echo.

REM Prompt for Docker Hub username
set /p DOCKER_USERNAME="Enter your Docker Hub username: "

if "%DOCKER_USERNAME%"=="" (
    echo ERROR: Docker Hub username cannot be empty!
    pause
    exit /b 1
)

echo.
echo Docker Hub username: %DOCKER_USERNAME%
echo.

REM Login to Docker Hub
echo Step 1: Logging in to Docker Hub...
docker login
if errorlevel 1 (
    echo ERROR: Docker login failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo Building Docker Images...
echo ============================================
echo.

REM Build Auth Service
echo [1/4] Building Auth Service...
docker build -t %DOCKER_USERNAME%/ceylonroam-auth:latest ./authService
if errorlevel 1 (
    echo ERROR: Failed to build Auth Service!
    pause
    exit /b 1
)
echo ✓ Auth Service built successfully
echo.

REM Build Itinerary Generator
echo [2/4] Building Itinerary Generator...
docker build -t %DOCKER_USERNAME%/ceylonroam-itinerary:latest ./itineraryGenerator
if errorlevel 1 (
    echo ERROR: Failed to build Itinerary Generator!
    pause
    exit /b 1
)
echo ✓ Itinerary Generator built successfully
echo.

REM Build Route Optimizer
echo [3/4] Building Route Optimizer...
docker build -t %DOCKER_USERNAME%/ceylonroam-route-optimizer:latest ./routeOptimizer
if errorlevel 1 (
    echo ERROR: Failed to build Route Optimizer!
    pause
    exit /b 1
)
echo ✓ Route Optimizer built successfully
echo.

REM Build Voice Translation
echo [4/4] Building Voice Translation...
docker build -t %DOCKER_USERNAME%/ceylonroam-voice-translation:latest ./voiceTranslation
if errorlevel 1 (
    echo ERROR: Failed to build Voice Translation!
    pause
    exit /b 1
)
echo ✓ Voice Translation built successfully
echo.

echo ============================================
echo Pushing Images to Docker Hub...
echo ============================================
echo.

REM Push Auth Service
echo [1/4] Pushing Auth Service...
docker push %DOCKER_USERNAME%/ceylonroam-auth:latest
if errorlevel 1 (
    echo ERROR: Failed to push Auth Service!
    pause
    exit /b 1
)
echo ✓ Auth Service pushed successfully
echo.

REM Push Itinerary Generator
echo [2/4] Pushing Itinerary Generator...
docker push %DOCKER_USERNAME%/ceylonroam-itinerary:latest
if errorlevel 1 (
    echo ERROR: Failed to push Itinerary Generator!
    pause
    exit /b 1
)
echo ✓ Itinerary Generator pushed successfully
echo.

REM Push Route Optimizer
echo [3/4] Pushing Route Optimizer...
docker push %DOCKER_USERNAME%/ceylonroam-route-optimizer:latest
if errorlevel 1 (
    echo ERROR: Failed to push Route Optimizer!
    pause
    exit /b 1
)
echo ✓ Route Optimizer pushed successfully
echo.

REM Push Voice Translation
echo [4/4] Pushing Voice Translation...
docker push %DOCKER_USERNAME%/ceylonroam-voice-translation:latest
if errorlevel 1 (
    echo ERROR: Failed to push Voice Translation!
    pause
    exit /b 1
)
echo ✓ Voice Translation pushed successfully
echo.

echo ============================================
echo ✓ ALL DONE!
echo ============================================
echo.
echo All microservices have been built and pushed to Docker Hub!
echo.
echo Your images:
echo   - %DOCKER_USERNAME%/ceylonroam-auth:latest
echo   - %DOCKER_USERNAME%/ceylonroam-itinerary:latest
echo   - %DOCKER_USERNAME%/ceylonroam-route-optimizer:latest
echo   - %DOCKER_USERNAME%/ceylonroam-voice-translation:latest
echo.
echo Next step: Deploy to AWS EC2 using the FREE_AWS_DEPLOYMENT.md guide
echo.
pause

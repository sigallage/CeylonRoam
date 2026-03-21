@echo off
REM AWS ECS Deployment Script for CeylonRoam Backend (Windows)
REM Prerequisites: AWS CLI configured, Docker Desktop running

setlocal enabledelayedexpansion

REM Resolve paths (this script lives in backend\aws)
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "BACKEND_DIR=%%~fI"

echo =========================================
echo CeylonRoam AWS ECS Deployment Script
echo =========================================

REM Configuration
set AWS_REGION=us-east-1
set CLUSTER_NAME=ceylonroam-cluster

REM Get AWS Account ID
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i

echo AWS Region: %AWS_REGION%
echo AWS Account: %AWS_ACCOUNT_ID%
echo.

REM Step 1: Create ECR Repositories
echo Step 1: Creating ECR repositories...
aws ecr create-repository --repository-name ceylonroam-auth --region %AWS_REGION% 2>nul || echo ceylonroam-auth repository already exists
aws ecr create-repository --repository-name ceylonroam-itinerary --region %AWS_REGION% 2>nul || echo ceylonroam-itinerary repository already exists
aws ecr create-repository --repository-name ceylonroam-route-optimizer --region %AWS_REGION% 2>nul || echo ceylonroam-route-optimizer repository already exists
aws ecr create-repository --repository-name ceylonroam-voice-translation --region %AWS_REGION% 2>nul || echo ceylonroam-voice-translation repository already exists

REM Step 2: Login to ECR
echo.
echo Step 2: Logging in to ECR...
for /f "tokens=*" %%i in ('aws ecr get-login-password --region %AWS_REGION%') do set ECR_PASSWORD=%%i
echo %ECR_PASSWORD% | docker login --username AWS --password-stdin %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com

REM Step 3: Build and Push Docker Images
echo.
echo Step 3: Building and pushing Docker images...

echo Building auth service...
pushd "%BACKEND_DIR%\authService"
docker build -t ceylonroam-auth .
docker tag ceylonroam-auth:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-auth:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-auth:latest
popd

echo Building itinerary service...
pushd "%BACKEND_DIR%\itineraryGenerator"
docker build -t ceylonroam-itinerary .
docker tag ceylonroam-itinerary:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-itinerary:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-itinerary:latest
popd

echo Building route optimizer service...
pushd "%BACKEND_DIR%\routeOptimizer"
docker build -t ceylonroam-route-optimizer .
docker tag ceylonroam-route-optimizer:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-route-optimizer:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-route-optimizer:latest
popd

echo Building voice translation service...
pushd "%BACKEND_DIR%\voiceTranslation"
docker build -t ceylonroam-voice-translation .
docker tag ceylonroam-voice-translation:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-voice-translation:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-voice-translation:latest
popd

REM Step 4: Create CloudWatch Log Groups
echo.
echo Step 4: Creating CloudWatch log groups...
aws logs create-log-group --log-group-name /ecs/ceylonroam-auth --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-itinerary --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-route-optimizer --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-voice-translation --region %AWS_REGION% 2>nul || echo Log group already exists

REM Step 5: Ensure ECS task execution role exists
echo.
echo Step 5: Ensuring ecsTaskExecutionRole exists...
aws iam get-role --role-name ecsTaskExecutionRole 1>nul 2>nul
if errorlevel 1 (
	echo Creating IAM role ecsTaskExecutionRole...
	set "TMP_DIR=%TEMP%\ceylonroam-ecs-%RANDOM%"
	mkdir "%TMP_DIR%" >nul 2>&1
	powershell -NoProfile -Command "$trustObj = @{ Version = '2012-10-17'; Statement = @(@{ Effect = 'Allow'; Principal = @{ Service = 'ecs-tasks.amazonaws.com' }; Action = 'sts:AssumeRole' }) }; $trustJson = ($trustObj | ConvertTo-Json -Depth 5); [System.IO.File]::WriteAllText('%TEMP%\ceylonroam-ecs-trust.json', $trustJson, [System.Text.Encoding]::ASCII)" 1>nul
	aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://"%TEMP%\ceylonroam-ecs-trust.json" 1>nul
	aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 1>nul
	aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite 1>nul
) else (
	echo IAM role ecsTaskExecutionRole already exists
)

REM Step 6: Register/Update ECS task definitions
echo.
echo Step 6: Registering ECS task definitions...

REM Resolve Secrets Manager ARNs (ECS only treats ARNs as Secrets Manager; bare names are treated as SSM parameters)
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/mongodb_uri --query ARN --output text') do set MONGODB_URI_SECRET_ARN=%%i
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/google_maps_api_key --query ARN --output text') do set GOOGLE_MAPS_API_KEY_SECRET_ARN=%%i
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/openrouter_api_key --query ARN --output text') do set OPENROUTER_API_KEY_SECRET_ARN=%%i
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/session_secret --query ARN --output text') do set SESSION_SECRET_SECRET_ARN=%%i
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/jwt_secret --query ARN --output text') do set JWT_SECRET_SECRET_ARN=%%i
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/email_user --query ARN --output text') do set EMAIL_USER_SECRET_ARN=%%i
for /f "tokens=*" %%i in ('aws secretsmanager describe-secret --region %AWS_REGION% --secret-id ceylonroam/email_password --query ARN --output text') do set EMAIL_PASSWORD_SECRET_ARN=%%i

if "%MONGODB_URI_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/mongodb_uri
	exit /b 1
)
if "%SESSION_SECRET_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/session_secret
	exit /b 1
)
if "%JWT_SECRET_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/jwt_secret
	echo Make sure you created the secret in AWS Secrets Manager in region %AWS_REGION%.
	exit /b 1
)
if "%GOOGLE_MAPS_API_KEY_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/google_maps_api_key
	exit /b 1
)
if "%OPENROUTER_API_KEY_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/openrouter_api_key
	exit /b 1
)
if "%EMAIL_USER_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/email_user
	echo OTP emails will not send without EMAIL_USER/EMAIL_PASSWORD.
	exit /b 1
)
if "%EMAIL_PASSWORD_SECRET_ARN%"=="" (
	echo ERROR: Could not resolve Secrets Manager ARN for ceylonroam/email_password
	echo OTP emails will not send without EMAIL_USER/EMAIL_PASSWORD.
	exit /b 1
)

set "AWS_DIR=%BACKEND_DIR%\aws"
set "TASK_TMP_DIR=%TEMP%\ceylonroam-ecs-tasks-%RANDOM%"
mkdir "%TASK_TMP_DIR%" >nul 2>&1

for %%F in ("%AWS_DIR%\ecs-task-auth.json" "%AWS_DIR%\ecs-task-itinerary.json" "%AWS_DIR%\ecs-task-route-optimizer.json" "%AWS_DIR%\ecs-task-voice-translation.json") do (
	powershell -NoProfile -Command "$c = Get-Content -Raw -LiteralPath '%%~fF'; $c = $c -replace '<AWS_ACCOUNT_ID>', '%AWS_ACCOUNT_ID%'; $c = $c -replace '<REGION>', '%AWS_REGION%'; $c = $c -replace 'ceylonroam/mongodb_uri', '%MONGODB_URI_SECRET_ARN%'; $c = $c -replace 'ceylonroam/google_maps_api_key', '%GOOGLE_MAPS_API_KEY_SECRET_ARN%'; $c = $c -replace 'ceylonroam/openrouter_api_key', '%OPENROUTER_API_KEY_SECRET_ARN%'; $c = $c -replace 'ceylonroam/session_secret', '%SESSION_SECRET_SECRET_ARN%'; $c = $c -replace 'ceylonroam/jwt_secret', '%JWT_SECRET_SECRET_ARN%'; $c = $c -replace 'ceylonroam/email_user', '%EMAIL_USER_SECRET_ARN%'; $c = $c -replace 'ceylonroam/email_password', '%EMAIL_PASSWORD_SECRET_ARN%'; $utf8NoBom = New-Object System.Text.UTF8Encoding($false); [System.IO.File]::WriteAllText('%TASK_TMP_DIR%\%%~nxF', $c, $utf8NoBom)" 1>nul
	aws ecs register-task-definition --cli-input-json file://"%TASK_TMP_DIR%\%%~nxF" --region %AWS_REGION%
)

REM Step 6b: Update existing ECS services to the latest task definitions
echo.
echo Step 6b: Updating ECS services (if they already exist)...

call :UpdateService auth-service ceylonroam-auth-service
call :UpdateService itinerary-service ceylonroam-itinerary-service
call :UpdateService route-optimizer-service ceylonroam-route-optimizer-service
call :UpdateService voice-translation-service ceylonroam-voice-translation-service

REM Step 7: Create ECS cluster (if not exists)
echo.
echo Step 7: Creating ECS cluster (if needed)...
aws ecs create-cluster --cluster-name %CLUSTER_NAME% --region %AWS_REGION% 2>nul || echo Cluster already exists

echo.
echo =========================================
echo Images pushed and task defs registered!
echo =========================================
echo.
echo Next Steps:
echo 1. Go to AWS Console to complete the setup
echo 2. Set up AWS Secrets Manager
echo 3. Create ECS services
echo 4. Set up Application Load Balancer
echo.
echo For detailed instructions, see AWS_DEPLOYMENT_GUIDE.md
echo.

pause

goto :eof

:UpdateService
set "SERVICE_NAME=%~1"
set "TASK_FAMILY=%~2"

REM If service doesn't exist, update-service fails. We treat that as informational.
aws ecs update-service --region %AWS_REGION% --cluster %CLUSTER_NAME% --service %SERVICE_NAME% --task-definition %TASK_FAMILY% --force-new-deployment 1>nul 2>nul
if errorlevel 1 (
	echo - Skipping %SERVICE_NAME% (service not found or not ready yet)
) else (
	echo - Updated %SERVICE_NAME% -> %TASK_FAMILY% (forced new deployment)
)

exit /b 0

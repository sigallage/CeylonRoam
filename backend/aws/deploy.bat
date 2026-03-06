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

REM Step 4: Create CloudWatch Log Groups
echo.
echo Step 4: Creating CloudWatch log groups...
aws logs create-log-group --log-group-name /ecs/ceylonroam-auth --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-itinerary --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-route-optimizer --region %AWS_REGION% 2>nul || echo Log group already exists

REM Step 5: Ensure ECS task execution role exists
echo.
echo Step 5: Ensuring ecsTaskExecutionRole exists...
aws iam get-role --role-name ecsTaskExecutionRole 1>nul 2>nul
if errorlevel 1 (
	echo Creating IAM role ecsTaskExecutionRole...
	set "TMP_DIR=%TEMP%\ceylonroam-ecs-%RANDOM%"
	mkdir "%TMP_DIR%" >nul 2>&1
	powershell -NoProfile -Command "$trust = '{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Principal\": {\"Service\": \"ecs-tasks.amazonaws.com\"},\n    \"Action\": \"sts:AssumeRole\"\n  }]\n}'; Set-Content -NoNewline -Encoding ASCII -LiteralPath '%TEMP%\ceylonroam-ecs-trust.json' -Value $trust" 1>nul
	aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://"%TEMP%\ceylonroam-ecs-trust.json" 1>nul
	aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy 1>nul
	aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite 1>nul
) else (
	echo IAM role ecsTaskExecutionRole already exists
)

REM Step 6: Register/Update ECS task definitions
echo.
echo Step 6: Registering ECS task definitions...

set "AWS_DIR=%BACKEND_DIR%\aws"
set "TASK_TMP_DIR=%TEMP%\ceylonroam-ecs-tasks-%RANDOM%"
mkdir "%TASK_TMP_DIR%" >nul 2>&1

for %%F in ("%AWS_DIR%\ecs-task-auth.json" "%AWS_DIR%\ecs-task-itinerary.json" "%AWS_DIR%\ecs-task-route-optimizer.json") do (
	powershell -NoProfile -Command "$c = Get-Content -Raw -LiteralPath '%%~fF'; $c = $c -replace '<AWS_ACCOUNT_ID>', '%AWS_ACCOUNT_ID%'; $c = $c -replace '<REGION>', '%AWS_REGION%'; Set-Content -NoNewline -Encoding UTF8 -LiteralPath '%TASK_TMP_DIR%\%%~nxF' -Value $c" 1>nul
	aws ecs register-task-definition --cli-input-json file://"%TASK_TMP_DIR%\%%~nxF" --region %AWS_REGION%
)

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

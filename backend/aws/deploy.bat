@echo off
REM AWS ECS Deployment Script for CeylonRoam Backend (Windows)
REM Prerequisites: AWS CLI configured, Docker Desktop running

setlocal enabledelayedexpansion

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
cd authSignup
docker build -t ceylonroam-auth .
docker tag ceylonroam-auth:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-auth:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-auth:latest
cd ..

echo Building itinerary service...
cd itineraryGenerator
docker build -t ceylonroam-itinerary .
docker tag ceylonroam-itinerary:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-itinerary:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-itinerary:latest
cd ..

echo Building route optimizer service...
cd routeOptimizer
docker build -t ceylonroam-route-optimizer .
docker tag ceylonroam-route-optimizer:latest %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-route-optimizer:latest
docker push %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/ceylonroam-route-optimizer:latest
cd ..

REM Step 4: Create CloudWatch Log Groups
echo.
echo Step 4: Creating CloudWatch log groups...
aws logs create-log-group --log-group-name /ecs/ceylonroam-auth --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-itinerary --region %AWS_REGION% 2>nul || echo Log group already exists
aws logs create-log-group --log-group-name /ecs/ceylonroam-route-optimizer --region %AWS_REGION% 2>nul || echo Log group already exists

echo.
echo =========================================
echo Docker images pushed successfully!
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

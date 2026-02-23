#!/bin/bash
# AWS ECS Deployment Script for CeylonRoam Backend
# Prerequisites: AWS CLI configured, Docker installed

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME="ceylonroam-cluster"

echo "========================================="
echo "CeylonRoam AWS ECS Deployment Script"
echo "========================================="
echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Create ECR Repositories
echo "Step 1: Creating ECR repositories..."
aws ecr create-repository --repository-name ceylonroam-auth --region $AWS_REGION 2>/dev/null || echo "ceylonroam-auth repository already exists"
aws ecr create-repository --repository-name ceylonroam-itinerary --region $AWS_REGION 2>/dev/null || echo "ceylonroam-itinerary repository already exists"
aws ecr create-repository --repository-name ceylonroam-route-optimizer --region $AWS_REGION 2>/dev/null || echo "ceylonroam-route-optimizer repository already exists"

# Step 2: Build and Push Docker Images
echo ""
echo "Step 2: Building and pushing Docker images..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push auth service
echo "Building auth service..."
cd authSignup
docker build -t ceylonroam-auth .
docker tag ceylonroam-auth:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-auth:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-auth:latest
cd ..

# Build and push itinerary service
echo "Building itinerary service..."
cd itineraryGenerator
docker build -t ceylonroam-itinerary .
docker tag ceylonroam-itinerary:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-itinerary:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-itinerary:latest
cd ..

# Build and push route optimizer service
echo "Building route optimizer service..."
cd routeOptimizer
docker build -t ceylonroam-route-optimizer .
docker tag ceylonroam-route-optimizer:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-route-optimizer:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-route-optimizer:latest
cd ..

# Step 3: Create CloudWatch Log Groups
echo ""
echo "Step 3: Creating CloudWatch log groups..."
aws logs create-log-group --log-group-name /ecs/ceylonroam-auth --region $AWS_REGION 2>/dev/null || echo "Log group already exists"
aws logs create-log-group --log-group-name /ecs/ceylonroam-itinerary --region $AWS_REGION 2>/dev/null || echo "Log group already exists"
aws logs create-log-group --log-group-name /ecs/ceylonroam-route-optimizer --region $AWS_REGION 2>/dev/null || echo "Log group already exists"

# Step 4: Update Task Definitions
echo ""
echo "Step 4: Updating ECS task definitions..."
cd aws

# Replace placeholders in task definitions
for file in ecs-task-*.json; do
    sed -i "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" $file
    sed -i "s/<REGION>/$AWS_REGION/g" $file
done

# Register task definitions
aws ecs register-task-definition --cli-input-json file://ecs-task-auth.json --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://ecs-task-itinerary.json --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://ecs-task-route-optimizer.json --region $AWS_REGION

cd ..

# Step 5: Create ECS Cluster (if not exists)
echo ""
echo "Step 5: Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $AWS_REGION 2>/dev/null || echo "Cluster already exists"

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Set up AWS Secrets Manager for sensitive environment variables"
echo "2. Create ECS services for each task definition"
echo "3. Set up Application Load Balancer"
echo "4. Configure target groups and listeners"
echo "5. Update your frontend to use the ALB endpoint"
echo ""
echo "For detailed instructions, see AWS_DEPLOYMENT_GUIDE.md"

#!/bin/bash
# AWS ECS Deployment Script for CeylonRoam Backend
# Prerequisites: AWS CLI configured, Docker installed

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME="ceylonroam-cluster"

# Resolve paths (this script lives in backend/aws)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

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
aws ecr create-repository --repository-name ceylonroam-voice-translation --region $AWS_REGION 2>/dev/null || echo "ceylonroam-voice-translation repository already exists"

# Step 2: Build and Push Docker Images
echo ""
echo "Step 2: Building and pushing Docker images..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push auth service
echo "Building auth service..."
cd "$BACKEND_DIR/authService"
docker build -t ceylonroam-auth .
docker tag ceylonroam-auth:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-auth:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-auth:latest


# Build and push itinerary service
echo "Building itinerary service..."
cd "$BACKEND_DIR/itineraryGenerator"
docker build -t ceylonroam-itinerary .
docker tag ceylonroam-itinerary:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-itinerary:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-itinerary:latest


# Build and push route optimizer service
echo "Building route optimizer service..."
cd "$BACKEND_DIR/routeOptimizer"
docker build -t ceylonroam-route-optimizer .
docker tag ceylonroam-route-optimizer:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-route-optimizer:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-route-optimizer:latest


# Build and push voice translation service
echo "Building voice translation service..."
cd "$BACKEND_DIR/voiceTranslation"
docker build -t ceylonroam-voice-translation .
docker tag ceylonroam-voice-translation:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-voice-translation:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/ceylonroam-voice-translation:latest

# Step 3: Create CloudWatch Log Groups
echo ""
echo "Step 3: Creating CloudWatch log groups..."
aws logs create-log-group --log-group-name /ecs/ceylonroam-auth --region $AWS_REGION 2>/dev/null || echo "Log group already exists"
aws logs create-log-group --log-group-name /ecs/ceylonroam-itinerary --region $AWS_REGION 2>/dev/null || echo "Log group already exists"
aws logs create-log-group --log-group-name /ecs/ceylonroam-route-optimizer --region $AWS_REGION 2>/dev/null || echo "Log group already exists"
aws logs create-log-group --log-group-name /ecs/ceylonroam-voice-translation --region $AWS_REGION 2>/dev/null || echo "Log group already exists"

# Step 3.5: Ensure ECS task execution role exists
echo ""
echo "Step 3.5: Ensuring ecsTaskExecutionRole exists..."
if ! aws iam get-role --role-name ecsTaskExecutionRole >/dev/null 2>&1; then
    cat > /tmp/ceylonroam-ecs-trust.json <<'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": { "Service": "ecs-tasks.amazonaws.com" },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file:///tmp/ceylonroam-ecs-trust.json >/dev/null
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy >/dev/null
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite >/dev/null
    echo "Created ecsTaskExecutionRole"
else
    echo "ecsTaskExecutionRole already exists"
fi

# Step 4: Update Task Definitions
echo ""
echo "Step 4: Updating ECS task definitions..."
TASK_SRC_DIR="$BACKEND_DIR/aws"
TASK_TMP_DIR="$(mktemp -d)"

for file in "$TASK_SRC_DIR"/ecs-task-*.json; do
    out="$TASK_TMP_DIR/$(basename "$file")"
    sed "s/<AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g; s/<REGION>/$AWS_REGION/g" "$file" > "$out"
done

aws ecs register-task-definition --cli-input-json file://"$TASK_TMP_DIR/ecs-task-auth.json" --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://"$TASK_TMP_DIR/ecs-task-itinerary.json" --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://"$TASK_TMP_DIR/ecs-task-route-optimizer.json" --region $AWS_REGION
aws ecs register-task-definition --cli-input-json file://"$TASK_TMP_DIR/ecs-task-voice-translation.json" --region $AWS_REGION

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

# CeylonRoam Backend - AWS Deployment Guide

This guide covers deploying the CeylonRoam backend services to AWS. We provide three deployment options:

1. **AWS ECS with Fargate** (Recommended) - Containerized, scalable, managed
2. **AWS Elastic Beanstalk** - Easiest setup, good for getting started
3. **AWS EC2** - Manual setup, full control

## Architecture Overview

Your backend consists of four microservices:
- **Auth Service** (Node.js/Express) - Port 5001 - Handles authentication
- **Itinerary Generator** (Python/FastAPI) - Port 8001 - Generates travel itineraries
- **Route Optimizer** (Python/FastAPI) - Port 8002 - Optimizes travel routes
- **Voice Translation** (Python/FastAPI) - Port 8003 - Speech-to-text + translation

## Prerequisites

Before starting, ensure you have:

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Docker Desktop** installed and running
4. **Git** (for version control)
5. **MongoDB Connection String** (MongoDB Atlas recommended for production)
6. **API Keys**:
   - Google Maps API Key
   - OpenRouter API Key (optional)

### Install AWS CLI (if not installed)

**Windows:**
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verify installation:**
```bash
aws --version
```

**Configure AWS CLI:**
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

---

## Option 1: AWS ECS with Fargate (Recommended)

**Best for:** Production deployments, scalability, containerized applications

### Cost Estimate
- **Fargate vCPU**: ~$0.04 per vCPU hour
- **Fargate Memory**: ~$0.004 per GB hour
- **Application Load Balancer**: ~$16/month + data transfer
- **Estimated Total**: ~$50-100/month (varies with usage)

### Step-by-Step Deployment

#### 1. Set Up MongoDB (Using MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (or paid for production)
3. Create a database user
4. Whitelist AWS IP ranges (or allow all: 0.0.0.0/0)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/ceylonroam`

#### 2. Store Secrets in AWS Secrets Manager

```bash
# Navigate to backend directory
cd backend

# Create secrets for sensitive data
aws secretsmanager create-secret \
    --name ceylonroam/mongodb_uri \
    --secret-string "mongodb+srv://username:password@cluster.mongodb.net/ceylonroam" \
    --region us-east-1

aws secretsmanager create-secret \
    --name ceylonroam/google_maps_api_key \
    --secret-string "YOUR_GOOGLE_MAPS_API_KEY" \
    --region us-east-1

aws secretsmanager create-secret \
    --name ceylonroam/openrouter_api_key \
    --secret-string "YOUR_OPENROUTER_API_KEY" \
    --region us-east-1
```

#### 3. Run Deployment Script

**Windows:**
```powershell
cd backend\aws
.\deploy.bat
```

**Linux/Mac:**
```bash
cd backend/aws
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Create ECR repositories
- Build and push Docker images
- Create CloudWatch log groups
- Register ECS task definitions

#### 4. Create VPC and Networking (AWS Console)

1. Go to **VPC Console**
2. Create VPC with:
   - IPv4 CIDR: 10.0.0.0/16
   - 2 public subnets in different AZs
   - Internet Gateway
   - Route table with route to Internet Gateway

Or use default VPC (easier for testing).

#### 5. Create Application Load Balancer

1. Go to **EC2 Console** → **Load Balancers**
2. Click **Create Load Balancer** → **Application Load Balancer**
3. Configure:
   - Name: `ceylonroam-alb`
   - Scheme: Internet-facing
   - IP type: IPv4
   - Select your VPC
   - Select 2 public subnets

4. Configure Security Group:
   - Allow HTTP (80) from anywhere
   - Allow HTTPS (443) from anywhere

5. Create Target Groups (one for each service):
   - **ceylonroam-auth-tg**: Port 5001, health check: /health
   - **ceylonroam-itinerary-tg**: Port 8001, health check: /health
   - **ceylonroam-route-optimizer-tg**: Port 8002, health check: /health
   - **ceylonroam-voice-translation-tg**: Port 8003, health check: /health

6. Configure Listeners (simplest approach)

Your services currently listen on different ports (5001/8001/8002/8003) but they don't have distinct URL prefixes (they all use `/api/...`).

The simplest ALB setup is **port-based listeners** (no path rewriting required):

- HTTP:80 → Forward to `ceylonroam-auth-tg`
- HTTP:8001 → Forward to `ceylonroam-itinerary-tg`
- HTTP:8002 → Forward to `ceylonroam-route-optimizer-tg`
- HTTP:8003 → Forward to `ceylonroam-voice-translation-tg`

If you want everything on only 80/443 later, you can switch to:
- API Gateway (with route mapping / path rewriting), or
- Update each service to mount under a unique prefix (e.g., `/auth`, `/itinerary`, `/route`, `/voice`).

#### 6. Create ECS Cluster

1. Go to **ECS Console**
2. Click **Clusters** → **Create Cluster**
3. Configure:
   - Cluster name: `ceylonroam-cluster`
   - Infrastructure: AWS Fargate
4. Click **Create**

#### 7. Create ECS Services

For each service (repeat 4 times):

1. In your cluster, click **Services** → **Create**
2. Configure:
   - **Launch type**: Fargate
   - **Task Definition**: Select the registered task definition
   - **Service name**: `ceylonroam-auth-service` (or itinerary/route-optimizer/voice-translation)
   - **Number of tasks**: 1 (increase for production)
   
3. **Networking**:
   - Select your VPC
   - Select 2 public subnets
   - Security group: Allow inbound on service port from ALB security group
   - Auto-assign public IP: Enabled

4. **Load Balancing**:
   - Load balancer type: Application Load Balancer
   - Load balancer: ceylonroam-alb
   - Target group: Select corresponding target group

5. Click **Create**

#### 8. Update Frontend Configuration

Update your frontend to use the ALB DNS name:

```javascript
// In your frontend .env or config
VITE_API_BASE_URL=http://ceylonroam-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com
```

#### 9. Testing

Test each endpoint:
```bash
# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --names ceylonroam-alb --query 'LoadBalancers[0].DNSName' --output text)

# Auth
curl http://$ALB_DNS/health

# Itinerary
curl http://$ALB_DNS:8001/health

# Route optimizer
curl http://$ALB_DNS:8002/health

# Voice translation
curl http://$ALB_DNS:8003/health
```

---

## Option 2: AWS Elastic Beanstalk (Easier Setup)

**Best for:** Quick deployment, less configuration, single-service apps

### Deployment Steps

#### 1. Create Elastic Beanstalk Application

**For Auth Service (Node.js):**
```bash
cd backend/authSignup

# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init -p node.js-18 ceylonroam-auth --region us-east-1

# Create environment
eb create ceylonroam-auth-env

# Set environment variables
eb setenv MONGODB_URI="your_mongodb_uri" PORT=5001

# Deploy
eb deploy

# Open in browser
eb open
```

**For Python Services:**
```bash
cd backend/itineraryGenerator

eb init -p python-3.11 ceylonroam-itinerary --region us-east-1
eb create ceylonroam-itinerary-env
eb setenv OPENROUTER_API_KEY="your_key"
eb deploy
```

Repeat for route optimizer service.

---

## Option 3: AWS EC2 (Manual Setup)

**Best for:** Maximum control, custom configurations

### Steps

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.medium (or t3.small for testing)
   - Security Group: Allow ports 22 (SSH), 80, 443, 5001, 8001, 8002, 8003

2. **SSH into instance:**
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

3. **Install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3.11 python3-pip

# Install Docker (optional, for containerized deployment)
curl -fsSL get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

4. **Clone repository:**
```bash
git clone https://github.com/yourusername/ceylonroam.git
cd ceylonroam/backend
```

5. **Set up environment variables:**
```bash
# Create .env file
cat > .env << EOF
MONGODB_URI=your_mongodb_uri
GOOGLE_MAPS_API_KEY=your_google_key
OPENROUTER_API_KEY=your_openrouter_key
EOF
```

6. **Deploy with Docker Compose:**
```bash
docker-compose up -d
```

Or deploy each service individually without Docker.

7. **Set up Nginx reverse proxy:**
```bash
sudo apt install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/ceylonroam
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/auth {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/itinerary {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /api/route {
        proxy_pass http://localhost:8002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ceylonroam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Security Best Practices

1. **Use HTTPS:** Configure SSL/TLS certificates (AWS Certificate Manager or Let's Encrypt)
2. **Restrict Security Groups:** Only allow necessary ports
3. **Use IAM Roles:** Don't hardcode AWS credentials
4. **Secrets Management:** Use AWS Secrets Manager or Parameter Store
5. **Enable CloudWatch Logs:** Monitor application logs
6. **Regular Updates:** Keep dependencies and OS updated
7. **Database Security:** 
   - Use MongoDB Atlas with IP whitelisting
   - Enable authentication
   - Use strong passwords

---

## Monitoring and Logging

### CloudWatch Logs
All services are configured to send logs to CloudWatch:
- `/ecs/ceylonroam-auth`
- `/ecs/ceylonroam-itinerary`
- `/ecs/ceylonroam-route-optimizer`

### View Logs
```bash
# Via AWS CLI
aws logs tail /ecs/ceylonroam-auth --follow

# Via AWS Console
# CloudWatch → Log groups → Select log group
```

### Set Up Alarms
1. Go to CloudWatch → Alarms
2. Create alarms for:
   - High CPU usage (>80%)
   - High memory usage (>80%)
   - HTTP 5xx errors
   - Health check failures

---

## Scaling

### Auto Scaling (ECS)
1. Go to ECS → Services → Select service
2. Update Service → Auto Scaling
3. Configure:
   - Minimum tasks: 1
   - Maximum tasks: 10
   - Target tracking: CPU 70%

### Manual Scaling
```bash
aws ecs update-service \
    --cluster ceylonroam-cluster \
    --service ceylonroam-auth-service \
    --desired-count 3
```

---

## Costs Optimization

1. **Use Fargate Spot:** 70% cheaper, good for non-critical workloads
2. **Right-size resources:** Start small, scale as needed
3. **Use CloudWatch Logs retention:** Set to 7 days
4. **Delete unused resources:** Load balancers, snapshots, etc.
5. **Use Reserved Instances:** For predictable workloads (EC2)

---

## CI/CD Pipeline (Advanced)

Use GitHub Actions for automated deployments:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker images
        run: |
          cd backend/authSignup
          docker build -t ${{ steps.login-ecr.outputs.registry }}/ceylonroam-auth:${{ github.sha }} .
          docker push ${{ steps.login-ecr.outputs.registry }}/ceylonroam-auth:${{ github.sha }}
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster ceylonroam-cluster \
            --service ceylonroam-auth-service \
            --force-new-deployment
```

---

## Troubleshooting

### Service Won't Start
1. Check CloudWatch logs for errors
2. Verify environment variables in Secrets Manager
3. Check security group rules
4. Verify task definition configuration

### Can't Connect to Database
1. Check MongoDB connection string
2. Verify IP whitelist in MongoDB Atlas
3. Test connection from ECS task:
   ```bash
   # Execute into running container
   aws ecs execute-command \
       --cluster ceylonroam-cluster \
       --task TASK_ID \
       --container auth-service \
       --interactive \
       --command "/bin/sh"
   ```

### High Costs
1. Review CloudWatch billing metrics
2. Check for unused resources
3. Review task CPU/memory allocation
4. Consider Fargate Spot
5. Set up budget alerts

---

## Next Steps

1. ✅ Set up custom domain name (Route 53)
2. ✅ Configure HTTPS with SSL certificate
3. ✅ Set up CloudWatch alarms
4. ✅ Implement CI/CD pipeline
5. ✅ Configure auto-scaling
6. ✅ Set up backup strategy
7. ✅ Implement rate limiting
8. ✅ Add API Gateway for better API management

---

## Support & Resources

- **AWS Documentation:** https://docs.aws.amazon.com/ecs/
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Docker Documentation:** https://docs.docker.com/
- **FastAPI Deployment:** https://fastapi.tiangolo.com/deployment/

---

## Quick Reference Commands

```bash
# View running services
aws ecs list-services --cluster ceylonroam-cluster

# View service details
aws ecs describe-services --cluster ceylonroam-cluster --services ceylonroam-auth-service

# View logs
aws logs tail /ecs/ceylonroam-auth --follow

# Update service (force new deployment)
aws ecs update-service --cluster ceylonroam-cluster --service ceylonroam-auth-service --force-new-deployment

# Scale service
aws ecs update-service --cluster ceylonroam-cluster --service ceylonroam-auth-service --desired-count 3

# Stop all services
aws ecs update-service --cluster ceylonroam-cluster --service ceylonroam-auth-service --desired-count 0
```

---

**Good luck with your deployment! 🚀**

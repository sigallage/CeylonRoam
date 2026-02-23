# CeylonRoam Backend - Quick Start AWS Deployment

This is a simplified guide to get your backend running on AWS in **under 30 minutes**.

## What You'll Deploy

- 3 microservices running on AWS Fargate (containerized)
- Application Load Balancer for routing
- MongoDB Atlas for database
- CloudWatch for logging

**Estimated Monthly Cost:** $50-100 USD

---

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed (`aws --version` to check)
- [ ] AWS CLI configured (`aws configure`)
- [ ] Docker Desktop installed and running
- [ ] MongoDB Atlas account (free tier works)
- [ ] Google Maps API Key

---

## Step 1: Set Up MongoDB (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user (remember username & password)
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/ceylonroam`

---

## Step 2: Store Secrets in AWS (2 minutes)

Open terminal and run:

```bash
# Replace with your actual values
aws secretsmanager create-secret \
    --name ceylonroam/mongodb_uri \
    --secret-string "mongodb+srv://user:password@cluster.mongodb.net/ceylonroam" \
    --region us-east-1

aws secretsmanager create-secret \
    --name ceylonroam/google_maps_api_key \
    --secret-string "YOUR_GOOGLE_MAPS_KEY" \
    --region us-east-1

aws secretsmanager create-secret \
    --name ceylonroam/openrouter_api_key \
    --secret-string "YOUR_OPENROUTER_KEY_OR_LEAVE_EMPTY" \
    --region us-east-1
```

---

## Step 3: Build and Push Docker Images (10 minutes)

**Windows:**
```powershell
cd backend\aws
.\deploy.bat
```

**Mac/Linux:**
```bash
cd backend/aws
chmod +x deploy.sh
./deploy.sh
```

Wait for all images to build and push to AWS ECR.

---

## Step 4: Create Infrastructure in AWS Console

### A. Create ECS Cluster (1 minute)

1. Search for "ECS" in AWS Console
2. **Clusters** → **Create Cluster**
3. Name: `ceylonroam-cluster`
4. Infrastructure: **AWS Fargate**
5. **Create**

### B. Create Application Load Balancer (3 minutes)

1. Search for "EC2" → **Load Balancers**
2. **Create Load Balancer** → **Application Load Balancer**
3. Name: `ceylonroam-alb`
4. Scheme: **Internet-facing**
5. Network: Select **default VPC** and **all availability zones**
6. Security Group: Create new, allow **HTTP (80)** from anywhere
7. **Create** (skip target group for now)

### C. Create Target Groups (2 minutes)

In EC2 Console → **Target Groups**, create 3 groups:

1. **ceylonroam-auth-tg**
   - Target type: IP
   - Protocol: HTTP, Port: 5001
   - VPC: default
   - Health check path: `/health`

2. **ceylonroam-itinerary-tg**
   - Target type: IP
   - Protocol: HTTP, Port: 8000
   - Health check path: `/health`

3. **ceylonroam-route-tg**
   - Target type: IP
   - Protocol: HTTP, Port: 8001
   - Health check path: `/health`

### D. Configure Load Balancer Listeners (2 minutes)

1. Go to your ALB → **Listeners** tab
2. Edit **HTTP:80** listener
3. Add rules:
   - Default action → Forward to `ceylonroam-auth-tg`
   - Add rule: Path is `/api/itinerary*` → Forward to `ceylonroam-itinerary-tg`
   - Add rule: Path is `/api/route*` → Forward to `ceylonroam-route-tg`
4. **Save**

### E. Create IAM Role for ECS Tasks (2 minutes)

1. Go to **IAM** → **Roles** → **Create Role**
2. Trusted entity: **Elastic Container Service**
3. Use case: **Elastic Container Service Task**
4. Add permissions:
   - `AmazonECSTaskExecutionRolePolicy`
   - `SecretsManagerReadWrite` (or create custom policy for specific secrets)
5. Name: `ecsTaskExecutionRole`
6. **Create**

### F. Update Task Definitions (IMPORTANT)

Before creating services, we need to add the execution role:

1. Go to **ECS** → **Task Definitions**
2. For each task definition:
   - Select it → **Create new revision**
   - Under **Task execution IAM role**: Select `ecsTaskExecutionRole`
   - **Create**

### G. Create ECS Services (5 minutes)

Repeat for each of the 3 services:

1. **ECS** → **Clusters** → **ceylonroam-cluster**
2. **Services** → **Create**

**Service 1: Auth Service**
- Launch type: **Fargate**
- Task definition: `ceylonroam-auth-service` (latest)
- Service name: `auth-service`
- Desired tasks: **1**
- Networking:
  - VPC: default
  - Subnets: Select all
  - Security group: Create new, allow port **5001** from ALB security group
  - Public IP: **Enabled**
- Load balancer:
  - Type: Application Load Balancer
  - Load balancer: `ceylonroam-alb`
  - Target group: `ceylonroam-auth-tg`
  - Container port: **5001**
- **Create**

**Service 2: Itinerary Service**
- Same as above but:
  - Task definition: `ceylonroam-itinerary-service`
  - Service name: `itinerary-service`
  - Port: **8001**
  - Target group: `ceylonroam-itinerary-tg`

**Service 3: Route Optimizer Service**
- Same as above but:
  - Task definition: `ceylonroam-route-optimizer-service`
  - Service name: `route-optimizer-service`
  - Port: **8002**
  - Target group: `ceylonroam-route-tg`

---

## Step 5: Test Your Deployment (2 minutes)

1. Get your ALB DNS name:
   - Go to **EC2** → **Load Balancers**
   - Copy DNS name (e.g., `ceylonroam-alb-123456789.us-east-1.elb.amazonaws.com`)

2. Test endpoints:
```bash
# Replace with your ALB DNS
ALB_DNS="your-alb-dns-here"

# Test auth service
curl http://$ALB_DNS/health

# Test itinerary service  
curl http://$ALB_DNS:8001/health

# Test route optimizer
curl http://$ALB_DNS:8002/health
```

All should return `{"ok": true}` or `{"status": "ok"}`

---

## Step 6: Update Frontend (1 minute)

In your frontend `.env` file:

```env
VITE_API_BASE_URL=http://your-alb-dns-here
```

---

## Troubleshooting

### Services won't start?
1. Check CloudWatch Logs: **CloudWatch** → **Log groups** → `/ecs/ceylonroam-*`
2. Check task definition has execution role
3. Verify secrets exist in Secrets Manager

### Can't connect to database?
1. Test MongoDB connection string in MongoDB Atlas dashboard
2. Ensure IP whitelist includes `0.0.0.0/0`
3. Check secret value in Secrets Manager

### Health checks failing?
1. Wait 2-3 minutes for services to start
2. Check security groups allow traffic
3. Verify target group health check settings

### Still stuck?
Check the full guide: `AWS_DEPLOYMENT_GUIDE.md`

---

## What's Next?

- [ ] Set up custom domain with Route 53
- [ ] Add HTTPS with AWS Certificate Manager
- [ ] Enable auto-scaling
- [ ] Set up CloudWatch alarms
- [ ] Implement CI/CD with GitHub Actions

---

## Architecture Diagram

```
Internet
   ↓
Application Load Balancer
   ↓
┌──────────────┬─────────────────┬──────────────────┐
│              │                 │                  │
Auth Service   Itinerary Service Route Optimizer
(Port 5001)    (Port 8001)      (Port 8002)
   ↓              ↓                  ↓
MongoDB Atlas  (In-memory)      Google Maps API
```

---

**Deployment complete! Your backend is now running on AWS! 🎉**

Total time: ~25-30 minutes

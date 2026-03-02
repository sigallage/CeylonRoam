# CeylonRoam Backend - FREE AWS Deployment Guide

**Deploy your microservices backend to AWS for FREE using AWS Free Tier**

## 🎯 What You'll Get (100% FREE)

- ✅ All 4 microservices running on AWS
- ✅ MongoDB database (MongoDB Atlas Free Tier)
- ✅ Public IP address accessible from anywhere
- ✅ 12 months FREE on AWS (then ~$10/month after)
- ✅ Uses Docker Compose on a single EC2 instance

## 📋 Prerequisites

- AWS Account (requires credit card but won't be charged)
- Basic terminal/command line knowledge
- All your backend code ready

---

## PART 1: Install Docker on Windows

### Step 1: Install Docker Desktop

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop
   - Download for Windows
   - Run the installer

2. **Install WSL 2 (if prompted):**
   ```powershell
   wsl --install
   ```
   - Restart computer if required

3. **Start Docker Desktop:**
   - Open Docker Desktop
   - Wait for "Docker is running" status
   - You'll see a whale icon in system tray

4. **Verify Docker Installation:**
   ```powershell
   docker --version
   docker-compose --version
   ```
   
   Expected output:
   ```
   Docker version 24.x.x
   Docker Compose version v2.x.x
   ```

### Step 2: Test Docker Locally (Optional but Recommended)

```powershell
# Navigate to your backend folder
cd C:\Users\Sasanka\OneDrive\Desktop\CeylonRoam\backend

# Create a .env file for local testing
Copy-Item .env.example .env

# Edit .env file with your actual values:
# MONGODB_URI=mongodb://admin:changeme123@localhost:27017/ceylonroam?authSource=admin
# GOOGLE_MAPS_API_KEY=your_key_here
# OPENROUTER_API_KEY=your_key_here

# Start all services with Docker Compose
docker-compose up -d

# Check running containers
docker ps

# View logs
docker-compose logs -f

# Test services:
# Auth Service: http://localhost:5001/health
# Itinerary: http://localhost:8001/health
# Route Optimizer: http://localhost:8002/health
# Voice Translation: http://localhost:8003/health

# Stop services
docker-compose down
```

---

## PART 2: Set Up FREE MongoDB Database

### Step 1: Create MongoDB Atlas Account (FREE Forever)

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose **FREE** tier (M0 Sandbox)
4. Click **Create a Deployment**
5. Select:
   - ☑️ **M0 FREE**
   - Provider: **AWS**
   - Region: **us-east-1** (or closest to you)
6. Click **Create Deployment**

### Step 2: Create Database User

1. Create username: `ceylonroam`
2. Create password: (generate or create strong password - save it!)
3. Click **Create Database User**

### Step 3: Allow Network Access

1. Click **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (0.0.0.0/0)
3. Click **Confirm**

### Step 4: Get Connection String

1. Click **Database** → **Connect** → **Drivers**
2. Copy connection string (looks like):
   ```
   mongodb+srv://ceylonroam:<password>@cluster0.xxxxx.mongodb.net/ceylonroam?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your actual password
4. **Save this connection string** - you'll need it later!

---

## PART 3: Deploy to AWS (100% FREE)

### Step 1: Create AWS Account

1. Go to: https://aws.amazon.com/free
2. Click **Create a Free Account**
3. Enter email, password, AWS account name
4. Choose **Personal** account
5. Enter credit card (required but won't be charged)
6. Verify phone number
7. Choose **Basic Support - Free**

### Step 2: Install AWS CLI

**Windows:**

1. Download installer:
   ```
   https://awscli.amazonaws.com/AWSCLIV2.msi
   ```

2. Run installer (use default settings)

3. Verify installation:
   ```powershell
   aws --version
   ```

### Step 3: Configure AWS CLI

1. **Create Access Keys:**
   - Login to AWS Console: https://console.aws.amazon.com
   - Search for **IAM** → **Users** → **Create User**
   - Username: `ceylonroam-deployer`
   - ☑️ **Attach policies directly**
   - Select: **AdministratorAccess** (for simplicity)
   - Click **Next** → **Create User**
   - Click on the user → **Security Credentials** tab
   - Click **Create access key** → Choose **CLI** → **Create**
   - **Download the CSV file** (you can't see this again!)

2. **Configure AWS CLI:**
   ```powershell
   aws configure
   ```
   
   Enter:
   - **AWS Access Key ID**: (from CSV file)
   - **AWS Secret Access Key**: (from CSV file)
   - **Default region**: `us-east-1`
   - **Default output format**: `json`

3. **Test configuration:**
   ```powershell
   aws sts get-caller-identity
   ```

### Step 4: Create EC2 Key Pair (for SSH access)

```powershell
# Create key pair
aws ec2 create-key-pair --key-name ceylonroam-key --query 'KeyMaterial' --output text --region us-east-1 > ceylonroam-key.pem

# Save this file in a safe place!
```

**Or create via AWS Console:**
1. Go to EC2 → **Key Pairs** → **Create key pair**
2. Name: `ceylonroam-key`
3. Type: **RSA**
4. Format: **pem**
5. Click **Create** → Save the `.pem` file

### Step 5: Launch FREE EC2 Instance

1. **Go to EC2 Console:**
   - https://console.aws.amazon.com/ec2
   - Make sure region is **us-east-1** (top right)

2. **Launch Instance:**
   - Click **Launch Instance**
   - **Name:** `ceylonroam-backend`
   
3. **Choose AMI:**
   - Select: **Ubuntu Server 22.04 LTS** (Free tier eligible)
   
4. **Instance Type:**
   - Select: **t2.micro** (Free tier eligible - 750 hours/month FREE)
   
5. **Key Pair:**
   - Select the key pair you created: `ceylonroam-key`
   
6. **Network Settings:**
   - Click **Edit**
   - Auto-assign Public IP: **Enable**
   - Click **Add Security Group Rule** and add:
     - Type: **Custom TCP**, Port: **5001**, Source: **Anywhere** (0.0.0.0/0)
     - Type: **Custom TCP**, Port: **8001**, Source: **Anywhere** (0.0.0.0/0)
     - Type: **Custom TCP**, Port: **8002**, Source: **Anywhere** (0.0.0.0/0)
     - Type: **Custom TCP**, Port: **8003**, Source: **Anywhere** (0.0.0.0/0)
     - Type: **SSH**, Port: **22**, Source: **My IP**
   
7. **Configure Storage:**
   - Size: **30 GB** (Free tier allows up to 30GB)
   
8. **Launch Instance:**
   - Click **Launch Instance**
   - Wait 1-2 minutes for instance to start

9. **Get Public IP:**
   - Go to **Instances** → Select your instance
   - Copy **Public IPv4 address** (e.g., 3.84.123.45)

### Step 6: Connect to Your EC2 Instance

**Option A: Using Windows PowerShell**

```powershell
# Navigate to where your key file is
cd C:\Users\Sasanka\Downloads

# Set proper permissions (Windows)
icacls ceylonroam-key.pem /inheritance:r
icacls ceylonroam-key.pem /grant:r "$($env:USERNAME):(R)"

# Connect via SSH
ssh -i ceylonroam-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Option B: Using EC2 Instance Connect (Easier)**

1. Go to EC2 Console → Select instance
2. Click **Connect** → **EC2 Instance Connect**
3. Click **Connect** (opens browser terminal)

### Step 7: Install Docker on EC2 Instance

Once connected to your EC2 instance, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# IMPORTANT: Log out and log back in for group changes to take effect
exit
```

**Reconnect to EC2:**
```powershell
ssh -i ceylonroam-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 8: Deploy Your Backend to EC2

```bash
# Create project directory
mkdir -p ~/ceylonroam-backend
cd ~/ceylonroam-backend

# Create docker-compose.yml file
nano docker-compose.yml
```

**Paste this content into docker-compose.yml:**

```yaml
version: '3.8'

services:
  # Auth Service
  auth-service:
    image: YOUR_DOCKERHUB_USERNAME/ceylonroam-auth:latest
    container_name: ceylonroam-auth
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
      - MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
      - NODE_ENV=production
      - SESSION_SECRET=change_this_to_random_secret_key
    restart: unless-stopped

  # Itinerary Generator Service
  itinerary-service:
    image: YOUR_DOCKERHUB_USERNAME/ceylonroam-itinerary:latest
    container_name: ceylonroam-itinerary
    ports:
      - "8001:8001"
    environment:
      - OPENROUTER_API_KEY=your_key_or_leave_empty
    restart: unless-stopped

  # Route Optimizer Service
  route-optimizer-service:
    image: YOUR_DOCKERHUB_USERNAME/ceylonroam-route-optimizer:latest
    container_name: ceylonroam-route-optimizer
    ports:
      - "8002:8002"
    environment:
      - GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
    restart: unless-stopped

  # Voice Translation Service (Optional - uses lots of memory)
  voice-translation-service:
    image: YOUR_DOCKERHUB_USERNAME/ceylonroam-voice-translation:latest
    container_name: ceylonroam-voice-translation
    ports:
      - "8003:8003"
    restart: unless-stopped
```

**Note:** Since EC2 free tier has limited memory (1GB), you might want to skip the voice translation service initially.

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 9: Build and Push Docker Images (From Your Local Machine)

**Back on your Windows machine:**

```powershell
cd C:\Users\Sasanka\OneDrive\Desktop\CeylonRoam\backend

# Login to Docker Hub (create account at https://hub.docker.com if needed)
docker login

# Build images
docker build -t YOUR_DOCKERHUB_USERNAME/ceylonroam-auth:latest ./authService
docker build -t YOUR_DOCKERHUB_USERNAME/ceylonroam-itinerary:latest ./itineraryGenerator
docker build -t YOUR_DOCKERHUB_USERNAME/ceylonroam-route-optimizer:latest ./routeOptimizer
docker build -t YOUR_DOCKERHUB_USERNAME/ceylonroam-voice-translation:latest ./voiceTranslation

# Push images to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/ceylonroam-auth:latest
docker push YOUR_DOCKERHUB_USERNAME/ceylonroam-itinerary:latest
docker push YOUR_DOCKERHUB_USERNAME/ceylonroam-route-optimizer:latest
docker push YOUR_DOCKERHUB_USERNAME/ceylonroam-voice-translation:latest
```

### Step 10: Start Services on EC2

**Back on EC2 instance:**

```bash
# Pull and start all services
docker-compose pull
docker-compose up -d

# Check running containers
docker ps

# View logs
docker-compose logs -f

# Check individual service logs
docker logs ceylonroam-auth
docker logs ceylonroam-itinerary
docker logs ceylonroam-route-optimizer
```

### Step 11: Test Your Deployment

Your services are now live! Test them:

```bash
# Replace YOUR_EC2_PUBLIC_IP with your actual IP

# Auth Service
curl http://YOUR_EC2_PUBLIC_IP:5001/health

# Itinerary Service
curl http://YOUR_EC2_PUBLIC_IP:8001/health

# Route Optimizer
curl http://YOUR_EC2_PUBLIC_IP:8002/health

# Voice Translation
curl http://YOUR_EC2_PUBLIC_IP:8003/health
```

**Or visit in browser:**
- http://YOUR_EC2_PUBLIC_IP:5001/health
- http://YOUR_EC2_PUBLIC_IP:8001/docs (FastAPI interactive docs)
- http://YOUR_EC2_PUBLIC_IP:8002/docs
- http://YOUR_EC2_PUBLIC_IP:8003/docs

---

## 🎉 Your Backend is Now Live!

Your API endpoints:
- **Auth:** http://YOUR_EC2_PUBLIC_IP:5001/api
- **Itinerary:** http://YOUR_EC2_PUBLIC_IP:8001
- **Route Optimizer:** http://YOUR_EC2_PUBLIC_IP:8002
- **Voice Translation:** http://YOUR_EC2_PUBLIC_IP:8003

---

## 📝 Managing Your Deployment

### View Logs
```bash
docker-compose logs -f
docker logs -f ceylonroam-auth
```

### Restart Services
```bash
docker-compose restart
docker-compose restart auth-service
```

### Stop Services
```bash
docker-compose stop
```

### Update Deployment (after code changes)
```bash
# On local machine: rebuild and push
docker build -t YOUR_DOCKERHUB_USERNAME/ceylonroam-auth:latest ./authService
docker push YOUR_DOCKERHUB_USERNAME/ceylonroam-auth:latest

# On EC2: pull and restart
docker-compose pull
docker-compose up -d
```

### Check Resource Usage
```bash
docker stats
htop  # install with: sudo apt install htop
```

---

## 💰 Cost Breakdown (FREE for 12 months!)

| Service | Cost | Duration |
|---------|------|----------|
| EC2 t2.micro | **FREE** | 750 hours/month for 12 months |
| 30 GB Storage | **FREE** | Included in free tier |
| Data Transfer | **FREE** | 100 GB/month outbound |
| MongoDB Atlas M0 | **FREE** | Forever |
| **Total** | **$0/month** | **12 months** |

**After 12 months:** ~$10/month for t2.micro instance

---

## ⚠️ Important Notes

### Memory Limitations (t2.micro has only 1GB RAM)

If services crash due to memory:

1. **Disable Voice Translation** (uses most memory):
   ```bash
   docker-compose stop voice-translation-service
   ```

2. **Upgrade to t3.small** after free tier (costs ~$15/month):
   - Go to EC2 → Instance → Actions → Instance Settings → Change Instance Type
   - Select **t3.small** (2GB RAM)

### Security Best Practices

1. **Change default passwords** in MongoDB and environment variables
2. **Restrict SSH access** to your IP only
3. **Use HTTPS** in production (get free SSL from Let's Encrypt)
4. **Enable CloudWatch monitoring** (free tier includes 10 metrics)

### Auto-Start on Reboot

```bash
# Make services start automatically
sudo nano /etc/systemd/system/ceylonroam.service
```

Paste:
```ini
[Unit]
Description=CeylonRoam Backend Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/ceylonroam-backend
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable ceylonroam
sudo systemctl start ceylonroam
```

---

## 🆘 Troubleshooting

### Container won't start
```bash
docker logs ceylonroam-auth
docker-compose down && docker-compose up -d
```

### Out of memory errors
```bash
# Check memory usage
free -h
docker stats

# Reduce running services or upgrade instance type
```

### Can't connect to services
```bash
# Check security group allows ports
# Check services are running: docker ps
# Check logs: docker-compose logs
```

### MongoDB connection issues
```bash
# Verify connection string is correct
# Check MongoDB Atlas network access allows 0.0.0.0/0
# Test connection: mongosh "YOUR_CONNECTION_STRING"
```

---

## 🚀 Next Steps

1. **Set up a domain name** (optional):
   - Use Freenom for free domain
   - Point to EC2 IP address
   - Use Nginx as reverse proxy

2. **Add HTTPS with Let's Encrypt** (free SSL)

3. **Set up CI/CD** with GitHub Actions for automatic deployments

4. **Monitor with CloudWatch** (included in free tier)

---

## 📞 Need Help?

- AWS Free Tier: https://aws.amazon.com/free
- Docker Documentation: https://docs.docker.com
- MongoDB Atlas: https://www.mongodb.com/docs/atlas

**Congratulations! Your microservices backend is now running on AWS for FREE! 🎉**

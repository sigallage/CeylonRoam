# Quick Start Cheatsheet - FREE AWS Deployment

## 🚀 Quick Commands Reference

### Local Docker Commands (Windows)

```powershell
# Navigate to backend
cd C:\Users\Sasanka\OneDrive\Desktop\CeylonRoam\backend

# Start all services locally
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Check running containers
docker ps

# Rebuild after code changes
docker-compose up -d --build
```

### Build and Push to Docker Hub

```powershell
# Login to Docker Hub
docker login

# Build all images (replace YOUR_USERNAME)
docker build -t YOUR_USERNAME/ceylonroam-auth:latest ./authService
docker build -t YOUR_USERNAME/ceylonroam-itinerary:latest ./itineraryGenerator
docker build -t YOUR_USERNAME/ceylonroam-route-optimizer:latest ./routeOptimizer
docker build -t YOUR_USERNAME/ceylonroam-voice-translation:latest ./voiceTranslation

# Push all images
docker push YOUR_USERNAME/ceylonroam-auth:latest
docker push YOUR_USERNAME/ceylonroam-itinerary:latest
docker push YOUR_USERNAME/ceylonroam-route-optimizer:latest
docker push YOUR_USERNAME/ceylonroam-voice-translation:latest
```

### Connect to EC2

```powershell
# SSH to EC2 (replace with your IP and key path)
ssh -i ceylonroam-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### EC2 Instance Commands

```bash
# Navigate to project
cd ~/ceylonroam-backend

# Pull latest images and restart
docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker ps

# Restart specific service
docker-compose restart auth-service

# Stop all services
docker-compose down

# Check resource usage
docker stats
free -h
df -h
```

### Useful AWS CLI Commands

```powershell
# List EC2 instances
aws ec2 describe-instances --region us-east-1

# Get instance public IP
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# Stop instance (to save costs when not in use)
aws ec2 stop-instances --instance-ids i-xxxxx

# Start instance
aws ec2 start-instances --instance-ids i-xxxxx
```

---

## 📋 Deployment Checklist

### Initial Setup
- [ ] AWS account created
- [ ] Docker Desktop installed
- [ ] Docker Hub account created
- [ ] MongoDB Atlas free cluster created
- [ ] AWS CLI installed and configured
- [ ] EC2 key pair created

### Build and Push
- [ ] All Docker images built locally
- [ ] All images pushed to Docker Hub
- [ ] Images accessible from Docker Hub

### EC2 Setup
- [ ] EC2 t2.micro instance launched
- [ ] Security groups configured (ports 22, 5001, 8001, 8002, 8003)
- [ ] Docker and Docker Compose installed on EC2
- [ ] docker-compose.yml created with correct values

### Environment Variables Configured
- [ ] MONGODB_URI (from MongoDB Atlas)
- [ ] GOOGLE_MAPS_API_KEY
- [ ] OPENROUTER_API_KEY (optional)
- [ ] SESSION_SECRET

### Testing
- [ ] All services responding to /health endpoint
- [ ] Can signup and login via auth service
- [ ] MongoDB connection working
- [ ] All microservices communicating properly

---

## 🔗 Quick Links

- **AWS Console:** https://console.aws.amazon.com
- **EC2 Dashboard:** https://console.aws.amazon.com/ec2
- **Docker Hub:** https://hub.docker.com
- **MongoDB Atlas:** https://cloud.mongodb.com

---

## 🧪 Test Your Deployment

Replace `YOUR_EC2_IP` with your actual EC2 public IP:

```bash
# Test Auth Service
curl http://YOUR_EC2_IP:5001/health
curl -X POST http://YOUR_EC2_IP:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test Itinerary Service
curl http://YOUR_EC2_IP:8001/health

# Test Route Optimizer
curl http://YOUR_EC2_IP:8002/health

# Test Voice Translation
curl http://YOUR_EC2_IP:8003/health
```

### Or visit in browser:
- http://YOUR_EC2_IP:8001/docs (Interactive API docs)
- http://YOUR_EC2_IP:8002/docs
- http://YOUR_EC2_IP:8003/docs

---

## 💡 Pro Tips

1. **Save your EC2 IP address** - You'll need it often
2. **Keep your .pem key safe** - Can't recover if lost
3. **Monitor free tier usage** - Check AWS Billing dashboard
4. **Set up billing alerts** - Get notified if costs exceed $0
5. **Take EC2 snapshots** - Backup your instance regularly

---

## 🆘 Common Issues & Fixes

### Can't SSH to EC2
```bash
# Fix permissions on Windows
icacls ceylonroam-key.pem /inheritance:r
icacls ceylonroam-key.pem /grant:r "$($env:USERNAME):(R)"
```

### Docker permission denied on EC2
```bash
# Add user to docker group and re-login
sudo usermod -aG docker ubuntu
exit
# Then SSH back in
```

### Service won't start due to memory
```bash
# Stop voice translation (uses most memory)
docker-compose stop voice-translation-service

# Or check what's using memory
docker stats
free -h
```

### Port already in use
```bash
# Stop all containers
docker-compose down

# Check what's using the port
sudo lsof -i :5001

# Kill process if needed
sudo kill -9 <PID>
```

---

## 🎯 Update Workflow

When you make code changes:

```powershell
# 1. On local machine - build and push
cd C:\Users\Sasanka\OneDrive\Desktop\CeylonRoam\backend
docker build -t YOUR_USERNAME/ceylonroam-auth:latest ./authService
docker push YOUR_USERNAME/ceylonroam-auth:latest

# 2. On EC2 - pull and restart
ssh -i ceylonroam-key.pem ubuntu@YOUR_EC2_IP
cd ~/ceylonroam-backend
docker-compose pull auth-service
docker-compose up -d auth-service
```

---

**For full detailed guide, see: FREE_AWS_DEPLOYMENT.md**

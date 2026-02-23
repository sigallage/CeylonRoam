# CeylonRoam Backend

Multi-service backend for the CeylonRoam travel platform, built with Node.js/Express and Python/FastAPI.

## 🏗 Architecture

```
backend/
├── authSignup/          # Authentication service (Node.js/Express)
│   ├── server.js
│   ├── src/
│   └── Dockerfile
├── itineraryGenerator/  # AI travel planner (Python/FastAPI)
│   ├── main.py
│   └── Dockerfile
├── routeOptimizer/      # Route optimization (Python/FastAPI)
│   ├── main.py
│   └── Dockerfile
├── docker-compose.yml   # Local development orchestration
└── aws/                 # AWS deployment configurations
    ├── deploy.bat
    ├── deploy.sh
    └── ecs-task-*.json
```

## 🚀 Services

### 1. Auth Service (Port 5001)
- **Tech Stack:** Node.js, Express, MongoDB, bcrypt, JWT
- **Purpose:** User authentication and authorization
- **Endpoints:**
  - `POST /api/signup` - User registration
  - `POST /api/login` - User authentication
  - `GET /health` - Health check

### 2. Itinerary Generator (Port 8001)
- **Tech Stack:** Python, FastAPI, OpenAI (optional)
- **Purpose:** AI-powered travel itinerary generation
- **Endpoints:**
  - `POST /api/generate` - Generate personalized itinerary
  - `GET /health` - Health check

### 3. Route Optimizer (Port 8002)
- **Tech Stack:** Python, FastAPI, Google Maps API
- **Purpose:** Optimize travel routes and calculate distances
- **Endpoints:**
  - `POST /api/optimize` - Optimize route
  - `POST /api/traffic` - Get traffic information
  - `GET /health` - Health check

## 📋 Quick Start

### Option 1: Local Development (Docker)

```bash
# 1. Clone and navigate
git clone <repo-url>
cd backend

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Test
curl http://localhost:5001/health
curl http://localhost:8001/health
curl http://localhost:8002/health
```

**See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for detailed guide.**

### Option 2: AWS Deployment

**Quick (30 minutes):**
```bash
# See QUICKSTART_AWS.md
cd backend/aws
./deploy.bat  # Windows
./deploy.sh   # Linux/Mac
```

**Complete guide:**
- [QUICKSTART_AWS.md](QUICKSTART_AWS.md) - Quick AWS deployment
- [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) - Comprehensive guide

## 🔑 Environment Variables

Create a `.env` file with:

```env
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ceylonroam
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional
OPENROUTER_API_KEY=your_openrouter_key
NODE_ENV=development
PORT=5001
```

## 🧪 Testing

### Health Checks
```bash
# All services should return 200 OK
curl http://localhost:5001/health  # Auth
curl http://localhost:8001/health  # Itinerary
curl http://localhost:8002/health  # Route Optimizer
```

### API Testing
```bash
# Sign up
curl -X POST http://localhost:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Generate itinerary
curl -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "gender":"male",
    "purpose":["adventure"],
    "traveling_with":"solo",
    "start_date":"2026-03-01",
    "end_date":"2026-03-05",
    "budget":50000
  }'
```

## 📦 Dependencies

### Auth Service
- express - Web framework
- mongoose - MongoDB ODM
- bcrypt - Password hashing
- cors - CORS middleware
- dotenv - Environment variables

### Python Services
- fastapi - Web framework
- uvicorn - ASGI server
- httpx - HTTP client
- pydantic - Data validation
- python-dotenv - Environment variables

## 🏭 Production Deployment

### AWS ECS (Recommended)
- Fully managed containers
- Auto-scaling
- Load balancing
- ~$50-100/month

### AWS Elastic Beanstalk
- Easiest setup
- Good for single services
- ~$30-60/month

### AWS EC2
- Full control
- Manual management
- ~$20-40/month

**See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for all options.**

## 📊 Monitoring

### CloudWatch Logs (AWS)
```bash
aws logs tail /ecs/ceylonroam-auth --follow
```

### Local Logs (Docker)
```bash
docker-compose logs -f auth-service
```

### Container Stats
```bash
docker stats
```

## 🔒 Security

✅ Environment variables via AWS Secrets Manager
✅ MongoDB authentication enabled
✅ CORS configured
✅ HTTPS ready (AWS Certificate Manager)
✅ Security groups restrict traffic
✅ Health checks on all services

## 🛠 Development

### Add New Service

1. Create service directory in `backend/`
2. Add `Dockerfile`
3. Update `docker-compose.yml`
4. Create ECS task definition in `aws/`
5. Update documentation

### Update Existing Service

```bash
# Local
docker-compose build service-name
docker-compose up -d service-name

# AWS
./aws/deploy.bat  # Rebuilds and pushes
aws ecs update-service --cluster ceylonroam-cluster \
  --service service-name --force-new-deployment
```

## 📝 API Documentation

Each service has its own documentation:

- **Auth:** [authSignup/README.md](authSignup/README.md)
- **Itinerary:** [itineraryGenerator/README.md](itineraryGenerator/README.md)
- **Route Optimizer:** [routeOptimizer/README.md](routeOptimizer/README.md)

Auto-generated API docs (when running):
- Itinerary: http://localhost:8001/docs
- Route Optimizer: http://localhost:8002/docs

## 🐛 Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs service-name

# Rebuild
docker-compose build --no-cache service-name

# Restart
docker-compose restart service-name
```

### Database connection issues
```bash
# Test MongoDB connection
docker exec -it ceylonroam-mongodb mongosh -u admin -p changeme123

# Check connection string in .env
```

### Port conflicts
```bash
# Check what's using the port
netstat -ano | findstr :5001

# Change ports in docker-compose.yml
```

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🤝 Contributing

1. Create feature branch
2. Test locally with Docker
3. Update documentation
4. Submit pull request

## 📄 License

[Add your license here]

## 👥 Team

[Add your team members]

---

## 📖 Documentation Index

- **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** - Local Docker setup
- **[QUICKSTART_AWS.md](QUICKSTART_AWS.md)** - Quick AWS deployment
- **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** - Complete AWS guide

---

**Need help? Check the documentation or create an issue!**

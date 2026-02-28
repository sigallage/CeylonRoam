# Local Development with Docker

Test your backend services locally before deploying to AWS.

## Prerequisites

- Docker Desktop installed and running
- MongoDB connection string (or use local MongoDB)
- Google Maps API Key

## Quick Start

### 1. Configure Environment

Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
MONGODB_URI=mongodb://admin:changeme123@mongodb:27017/ceylonroam?authSource=admin
GOOGLE_MAPS_API_KEY=your_actual_key_here
OPENROUTER_API_KEY=your_key_or_leave_empty
```

### 2. Start All Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Test Endpoints

**Auth Service:**
```bash
# Health check
curl http://localhost:5001/health

# Sign up
curl -X POST http://localhost:5001/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Itinerary Generator:**
```bash
# Health check
curl http://localhost:8001/health

# Generate itinerary
curl -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "male",
    "purpose": ["adventure", "culture"],
    "traveling_with": "solo",
    "start_date": "2026-03-01",
    "end_date": "2026-03-10",
    "budget": 100000
  }'
```

**Route Optimizer:**
```bash
# Health check
curl http://localhost:8002/health

# Optimize route (add actual test request)
```

## Individual Service Development

### Build individual services

```bash
# Auth service
cd authSignup
docker build -t ceylonroam-auth .
docker run -p 5001:5001 --env-file ../.env ceylonroam-auth

# Itinerary service
cd itineraryGenerator
docker build -t ceylonroam-itinerary .
docker run -p 8001:8001 --env-file ../.env ceylonroam-itinerary

# Route optimizer
cd routeOptimizer
docker build -t ceylonroam-route-optimizer .
docker run -p 8002:8002 --env-file ../.env ceylonroam-route-optimizer
```

## Using Local MongoDB

If you prefer local MongoDB instead of Atlas:

```bash
# Start MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=changeme123 \
  mongo:7.0

# Update .env
MONGODB_URI=mongodb://admin:changeme123@localhost:27017/ceylonroam?authSource=admin
```

## Troubleshooting

### Ports already in use
```bash
# Check what's using the port
netstat -ano | findstr :5001

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use different ports in docker-compose.yml
```

### Can't connect to MongoDB
```bash
# Check MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs mongodb

# Test connection
docker exec -it mongodb mongosh -u admin -p changeme123
```

### Service won't start
```bash
# View logs for specific service
docker-compose logs auth-service

# Rebuild without cache
docker-compose build --no-cache

# Restart specific service
docker-compose restart auth-service
```

### Clear everything and start fresh
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker rmi ceylonroam-auth ceylonroam-itinerary ceylonroam-route-optimizer

# Rebuild and start
docker-compose up --build -d
```

## Performance Monitoring

```bash
# View resource usage
docker stats

# View container processes
docker-compose ps

# Execute shell in running container
docker exec -it ceylonroam-auth /bin/sh
```

## Database Management

```bash
# Access MongoDB shell
docker exec -it ceylonroam-mongodb mongosh -u admin -p changeme123

# Show databases
show dbs

# Use ceylonroam database
use ceylonroam

# List collections
show collections

# View users
db.users.find()

# Export data
docker exec ceylonroam-mongodb mongodump --out /backup

# Import data
docker exec ceylonroam-mongodb mongorestore /backup
```

## Best Practices

1. **Always use .env file** - Never commit secrets
2. **Check logs regularly** - `docker-compose logs -f`
3. **Clean up** - Remove unused containers and images
4. **Resource limits** - Monitor Docker Desktop memory usage
5. **Hot reload** - Mount volumes for development:

```yaml
# In docker-compose.yml (for development only)
services:
  auth-service:
    volumes:
      - ./authSignup:/app
      - /app/node_modules
```

## Next Steps

Once local testing is complete:
1. Review `QUICKSTART_AWS.md` for AWS deployment
2. Review `AWS_DEPLOYMENT_GUIDE.md` for detailed AWS setup
3. Push your changes to Git
4. Deploy to AWS using provided scripts

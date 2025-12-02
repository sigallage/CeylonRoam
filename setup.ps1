# Ceylon Voyage Setup Script for Windows PowerShell

Write-Host "🇱🇰 Ceylon Voyage - Route Planner Setup" -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

# Backend Setup
Write-Host "📦 Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

# Check if virtual environment exists
if (-Not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Green
    python -m venv .venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
.\.venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Green
pip install -r requirements.txt

# Create .env if it doesn't exist
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Green
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update .env with your Google Maps API key!" -ForegroundColor Red
}

Set-Location ..

# Frontend Setup
Write-Host "`n📦 Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Green
npm install

# Create .env if it doesn't exist
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Green
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update .env with your Google Maps API key!" -ForegroundColor Red
}

Set-Location ..

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Add your Google Maps API key to:" -ForegroundColor White
Write-Host "   - backend/.env (GOOGLE_MAPS_API_KEY)" -ForegroundColor Gray
Write-Host "   - frontend/.env (VITE_GOOGLE_MAPS_API_KEY)" -ForegroundColor Gray
Write-Host "   - frontend/src/components/MapComponent.jsx (line 18)" -ForegroundColor Gray
Write-Host "`n2. Start the backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\.venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python main.py" -ForegroundColor Gray
Write-Host "`n3. Start the frontend (in a new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "`n4. Open http://localhost:5173 in your browser" -ForegroundColor White

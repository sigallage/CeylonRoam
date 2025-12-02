# Ceylon Voyage - Route Planner

An interactive route planning application for exploring Sri Lanka's beautiful destinations.

## Features

🗺️ **Interactive Map** - Display destinations on Google Maps
🧭 **Filtered View** - Show only itinerary destinations, hiding other pins
🚗 **Route Optimization** - Find the shortest/fastest travel path between destinations
🧍 **Visual Routes** - See the optimized route with lines connecting stops

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Google Maps JavaScript API

### Backend
- FastAPI
- Python 3.11+

### Database
- MongoDB (configured but not required for demo)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (if not already created):
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - Windows PowerShell:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - Windows CMD:
     ```cmd
     .venv\Scripts\activate.bat
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

6. Add your Google Maps API key to `.env`:
   ```
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

7. Run the backend server:
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload
   ```

The backend will run at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Add your Google Maps API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

5. Update the Google Maps API key in `src/components/MapComponent.jsx`:
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key on line 18

6. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will run at `http://localhost:5173`

## Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Geocoding API (optional)
4. Create credentials (API Key)
5. Restrict the API key (recommended):
   - Set HTTP referrers (for frontend): `http://localhost:5173/*`
   - Set IP addresses (for backend): Your server IP or `127.0.0.1`

## Usage

1. The application loads with mock data showing 5 destinations in Sri Lanka
2. Only itinerary destinations are displayed on the map (other pins are hidden)
3. Click on map markers to see destination details
4. Click the **"Optimize Route"** button to calculate the optimal travel path
5. The route is displayed with:
   - Numbered markers showing the order
   - Lines connecting destinations
   - Total distance and duration

## Mock Data

The application includes mock data for the following Sri Lankan destinations:
- Temple of the Tooth, Kandy
- Sigiriya Rock Fortress
- Nuwara Eliya Tea Plantations
- Ella Rock
- Galle Fort

You can customize the itinerary in `frontend/src/data/mockData.js`

## API Endpoints

### POST /api/optimize-route

Request body:
```json
{
  "destinations": [
    {
      "id": "dest-1",
      "name": "Location Name",
      "location": {
        "lat": 7.2936,
        "lng": 80.6405
      },
      "description": "Description"
    }
  ],
  "optimize": true
}
```

Response:
```json
{
  "optimized_order": ["dest-1", "dest-2", "dest-3"],
  "total_distance": "250.50 km",
  "total_duration": "5.25 hours",
  "routes": [...]
}
```

## Development Notes

- The backend includes a fallback mock optimization when Google Maps API is unavailable
- Frontend gracefully handles API errors
- All components are responsive and mobile-friendly
- Tailwind CSS is configured for rapid UI development

## License

MIT

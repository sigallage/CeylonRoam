# Route Optimizer (FastAPI)

## Run

From repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/routeOptimizer/requirements.txt
uvicorn backend.routeOptimizer.main:app --reload --port 8000
```

## Live traffic (Google)

To optimize using live traffic, set a backend environment variable:

- `GOOGLE_MAPS_API_KEY` (enable **Distance Matrix API** in Google Cloud; billing required)

On Windows PowerShell (current terminal session):

```powershell
$env:GOOGLE_MAPS_API_KEY = "YOUR_KEY_HERE"
```

Or create a `.env` file (supported locations):

- `backend/routeOptimizer/.env`
- `.env` at repo root

Example `.env`:

```env
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

### Traffic colors on the route (Google Maps-style)

To draw per-segment traffic colors (blue/yellow/red) similar to the native Google Maps app, the frontend calls:

- `POST http://localhost:8000/traffic-route`

This uses Google **Routes API** (v2) with `TRAFFIC_ON_POLYLINE` to return `speedReadingIntervals`.

Enable for your backend key:
- **Routes API**
- Billing

If you see: `Google Routes error (403): Requests from referer <empty> are blocked.`

That means you used a **browser-restricted** key (HTTP referrers) for the backend.
Backend calls have no `Referer` header, so Google blocks them.

Fix:
- Create/use a separate **server** API key for the backend
- In Google Cloud Console → Credentials → API key:
  - **Application restrictions**: `None` (simplest for local dev) OR `IP addresses` (recommended for production)
  - **API restrictions**: limit to `Routes API` (+ `Distance Matrix API` if you use `/optimize` with `metric=google`)

Example request (PowerShell):

```powershell
$body = @{ itinerary = @() ; metric = 'google' ; optimize_for = 'hybrid' ; distance_weight = 1 ; time_weight = 1 } | ConvertTo-Json -Depth 10
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/optimize -ContentType 'application/json' -Body $body
```
Alternative (also works):

```powershell
python -m backend.routeOptimizer
```

If you're inside `backend/routeOptimizer`, `python main.py` also works, but it runs without auto-reload.

Frontend can call:
- `POST http://localhost:8000/optimize`
- `POST http://localhost:8000/traffic-route`

## Smoke test (no server)

From repository root:

```powershell
python -c "from backend.routeOptimizer.optimizer import optimize_route, path_length; coords=[(7.2936,80.6405),(7.9570,80.7603),(6.9497,80.7891),(6.8667,81.0467),(6.0328,80.2170)]; order, dist = optimize_route(coords, return_to_start=False, try_all_starts=True); print('order', order); print('distance_km', round(path_length(dist, order, False), 2))"
```

## API

### POST /optimize

Request body:

```json
{
  "itinerary": [
    {
      "id": "dest-1",
      "name": "Sigiriya Rock Fortress",
      "location": {"lat": 7.957, "lng": 80.7603},
      "description": "..."
    }
  ],
  "return_to_start": false,
  "try_all_starts": true
}
```

Response:

```json
{
  "optimized_order": [0, 2, 1],
  "total_distance_km": 123.45,
  "optimized_itinerary": [ ... ],
  "segments": [
    {"from_index": 0, "to_index": 2, "distance_km": 12.3}
  ]
}
```

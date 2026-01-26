# Route Optimizer (FastAPI)

## Run

From repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/routeOptimizer/requirements.txt
uvicorn backend.routeOptimizer.main:app --reload --port 8000
```
Alternative (also works):

```powershell
python -m backend.routeOptimizer
```

If you're inside `backend/routeOptimizer`, `python main.py` also works, but it runs without auto-reload.

Frontend can call:
- `POST http://localhost:8000/optimize`

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

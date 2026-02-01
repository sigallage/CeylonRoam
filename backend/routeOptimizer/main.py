from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware


def _load_dotenv_if_present() -> None:
    """Load environment variables from .env files if python-dotenv is installed.

    This helps local development on Windows where the backend is often started
    in a different terminal session than where env vars were set.
    """

    try:
        from dotenv import load_dotenv  # type: ignore
    except Exception:
        return

    here = Path(__file__).resolve()
    repo_root = here.parents[2]

    # Prefer a backend-local .env, then fall back to repo-root .env.
    # If the variable exists but is empty, allow .env to override it.
    should_override = not bool(os.getenv("GOOGLE_MAPS_API_KEY"))
    load_dotenv(here.parent / ".env", override=should_override)
    load_dotenv(repo_root / ".env", override=should_override)

_load_dotenv_if_present()

# Support both:
# - `uvicorn backend.routeOptimizer.main:app` (package import)
# - `python backend/routeOptimizer/main.py` (direct execution)
try:
    from .models import OptimizeRequest, OptimizeResponse, Segment
    from .models import TrafficRouteRequest, TrafficRouteResponse, TrafficLeg, SpeedInterval
    from .optimizer import optimize_order_from_cost_matrix, optimize_route, path_length
    from .google_matrix import GoogleMatrixError, fetch_distance_matrix
    from .google_routes import GoogleRoutesError, compute_traffic_route
except ImportError:  # pragma: no cover
    from models import OptimizeRequest, OptimizeResponse, Segment
    from models import TrafficRouteRequest, TrafficRouteResponse, TrafficLeg, SpeedInterval
    from optimizer import optimize_order_from_cost_matrix, optimize_route, path_length
    from google_matrix import GoogleMatrixError, fetch_distance_matrix
    from google_routes import GoogleRoutesError, compute_traffic_route

app = FastAPI(title="CeylonRoam Route Optimizer", version="1.0.0")

# Vite dev server defaults to 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest) -> OptimizeResponse:
    itinerary = req.itinerary
    coords = [(d.location.lat, d.location.lng) for d in itinerary]

    # Default: haversine distance
    distance_km_matrix: list[list[float]]
    duration_s_matrix: list[list[float]] | None = None
    duration_traffic_s_matrix: list[list[float]] | None = None

    metric_used = req.metric

    if req.metric == "google":
        try:
            matrices = fetch_distance_matrix(coords)
            distance_km_matrix = matrices["distance_km"]
            duration_s_matrix = matrices["duration_s"]
            duration_traffic_s_matrix = matrices["duration_in_traffic_s"]
        except GoogleMatrixError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        order, distance_km_matrix = optimize_route(
            coords,
            return_to_start=req.return_to_start,
            try_all_starts=req.try_all_starts,
        )

    if req.metric == "google":
        assert duration_traffic_s_matrix is not None

        if req.optimize_for == "distance":
            cost = distance_km_matrix
        elif req.optimize_for == "time":
            cost = duration_traffic_s_matrix
        else:
            # Hybrid: normalize both matrices to similar scale
            def mean_off_diagonal(m: list[list[float]]) -> float:
                vals: list[float] = []
                for i in range(len(m)):
                    for j in range(len(m)):
                        if i != j and m[i][j] < 1e8:
                            vals.append(float(m[i][j]))
                if not vals:
                    return 1.0
                return sum(vals) / len(vals)

            dist_mean = mean_off_diagonal(distance_km_matrix)
            time_mean = mean_off_diagonal(duration_traffic_s_matrix)
            dist_scale = dist_mean if dist_mean > 0 else 1.0
            time_scale = time_mean if time_mean > 0 else 1.0

            n = len(distance_km_matrix)
            cost = [[0.0] * n for _ in range(n)]
            for i in range(n):
                for j in range(n):
                    cost[i][j] = (req.distance_weight * (distance_km_matrix[i][j] / dist_scale)) + (
                        req.time_weight * (duration_traffic_s_matrix[i][j] / time_scale)
                    )

        order = optimize_order_from_cost_matrix(
            cost,
            return_to_start=req.return_to_start,
            try_all_starts=req.try_all_starts,
        )

    optimized_itinerary = [itinerary[i] for i in order]

    segments: list[Segment] = []
    for from_idx, to_idx in zip(order, order[1:]):
        segments.append(
            Segment(
                from_index=from_idx,
                to_index=to_idx,
                distance_km=distance_km_matrix[from_idx][to_idx],
                duration_seconds=(duration_s_matrix[from_idx][to_idx] if duration_s_matrix else None),
                duration_in_traffic_seconds=(
                    duration_traffic_s_matrix[from_idx][to_idx] if duration_traffic_s_matrix else None
                ),
            )
        )

    if req.return_to_start and len(order) > 1:
        segments.append(
            Segment(
                from_index=order[-1],
                to_index=order[0],
                distance_km=distance_km_matrix[order[-1]][order[0]],
                duration_seconds=(duration_s_matrix[order[-1]][order[0]] if duration_s_matrix else None),
                duration_in_traffic_seconds=(
                    duration_traffic_s_matrix[order[-1]][order[0]] if duration_traffic_s_matrix else None
                ),
            )
        )

    total_km = path_length(distance_km_matrix, order, return_to_start=req.return_to_start)
    total_duration_s = path_length(duration_s_matrix, order, return_to_start=req.return_to_start) if duration_s_matrix else None
    total_duration_traffic_s = (
        path_length(duration_traffic_s_matrix, order, return_to_start=req.return_to_start)
        if duration_traffic_s_matrix
        else None
    )

    return OptimizeResponse(
        optimized_order=order,
        total_distance_km=total_km,
        total_duration_seconds=total_duration_s,
        total_duration_in_traffic_seconds=total_duration_traffic_s,
        metric_used=metric_used,
        optimize_for=req.optimize_for,
        optimized_itinerary=optimized_itinerary,
        segments=segments,
    )


@app.post("/traffic-route", response_model=TrafficRouteResponse)
def traffic_route(req: TrafficRouteRequest) -> TrafficRouteResponse:
    """Return traffic-on-polyline intervals for route coloring.

    This endpoint is used by the frontend to draw a Google-Maps-like route line
    with per-segment traffic colors (blue/yellow/red).

    Requires backend `GOOGLE_MAPS_API_KEY` with Routes API enabled.
    """

    try:
        payload = compute_traffic_route(
            origin=(req.origin.lat, req.origin.lng),
            destination=(req.destination.lat, req.destination.lng),
            intermediates=[(p.lat, p.lng) for p in req.intermediates],
            travel_mode=req.travel_mode,
        )
    except GoogleRoutesError as e:
        raise HTTPException(status_code=400, detail=str(e))

    legs: list[TrafficLeg] = []
    for leg in payload.get("legs", []):
        intervals = [
            SpeedInterval(
                start_index=int(i.get("startIndex", 0)),
                end_index=int(i.get("endIndex", 0)),
                speed=str(i.get("speed", "SPEED_UNSPECIFIED")),
            )
            for i in (leg.get("speedReadingIntervals") or [])
        ]
        legs.append(TrafficLeg(encoded_polyline=str(leg.get("encodedPolyline") or ""), speed_intervals=intervals))

    return TrafficRouteResponse(
        duration_seconds=payload.get("durationSeconds"),
        static_duration_seconds=payload.get("staticDurationSeconds"),
        distance_meters=payload.get("distanceMeters"),
        legs=legs,
    )


if __name__ == "__main__":
    import uvicorn

    # When running this file directly, `reload=True` can't reliably resolve imports.
    uvicorn.run(app, host="127.0.0.1", port=8000)

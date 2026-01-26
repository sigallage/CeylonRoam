from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Support both:
# - `uvicorn backend.routeOptimizer.main:app` (package import)
# - `python backend/routeOptimizer/main.py` (direct execution)
try:
    from .models import OptimizeRequest, OptimizeResponse, Segment
    from .optimizer import optimize_route, path_length
except ImportError:  # pragma: no cover
    from models import OptimizeRequest, OptimizeResponse, Segment
    from optimizer import optimize_route, path_length

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

    order, dist = optimize_route(
        coords,
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
                distance_km=dist[from_idx][to_idx],
            )
        )

    if req.return_to_start and len(order) > 1:
        segments.append(
            Segment(
                from_index=order[-1],
                to_index=order[0],
                distance_km=dist[order[-1]][order[0]],
            )
        )

    total_km = path_length(dist, order, return_to_start=req.return_to_start)

    return OptimizeResponse(
        optimized_order=order,
        total_distance_km=total_km,
        optimized_itinerary=optimized_itinerary,
        segments=segments,
    )


if __name__ == "__main__":
    import uvicorn

    # When running this file directly, `reload=True` can't reliably resolve imports.
    uvicorn.run(app, host="127.0.0.1", port=8000)

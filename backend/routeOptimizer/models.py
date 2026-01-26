from __future__ import annotations

from pydantic import BaseModel, Field


class LatLng(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class Destination(BaseModel):
    id: str
    name: str
    location: LatLng
    description: str | None = None


class OptimizeRequest(BaseModel):
    itinerary: list[Destination] = Field(default_factory=list)
    return_to_start: bool = False
    try_all_starts: bool = True


class Segment(BaseModel):
    from_index: int
    to_index: int
    distance_km: float


class OptimizeResponse(BaseModel):
    optimized_order: list[int]
    total_distance_km: float
    optimized_itinerary: list[Destination]
    segments: list[Segment]

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

    # Optimization metric source
    # - 'haversine': uses straight-line haversine distance
    # - 'google': uses Google Distance Matrix (driving + duration_in_traffic)
    metric: str = Field(default="haversine", pattern="^(haversine|google)$")

    # What to optimize
    # - 'distance': minimize distance (km)
    # - 'time': minimize duration_in_traffic (seconds)
    # - 'hybrid': minimize weighted normalized distance + time
    optimize_for: str = Field(default="distance", pattern="^(distance|time|hybrid)$")

    # Used only when optimize_for='hybrid'
    distance_weight: float = 1.0
    time_weight: float = 1.0


class Segment(BaseModel):
    from_index: int
    to_index: int
    distance_km: float
    duration_seconds: float | None = None
    duration_in_traffic_seconds: float | None = None


class OptimizeResponse(BaseModel):
    optimized_order: list[int]
    total_distance_km: float
    total_duration_seconds: float | None = None
    total_duration_in_traffic_seconds: float | None = None
    metric_used: str
    optimize_for: str
    optimized_itinerary: list[Destination]
    segments: list[Segment]


class TrafficRouteRequest(BaseModel):
    origin: LatLng
    destination: LatLng
    intermediates: list[LatLng] = Field(default_factory=list)

    # Google Routes API travel modes (subset for our UI)
    travel_mode: str = Field(default="DRIVE", pattern="^(DRIVE|TWO_WHEELER)$")


class SpeedInterval(BaseModel):
    start_index: int
    end_index: int
    speed: str


class TrafficLeg(BaseModel):
    encoded_polyline: str
    speed_intervals: list[SpeedInterval] = Field(default_factory=list)


class TrafficRouteResponse(BaseModel):
    duration_seconds: float | None = None
    static_duration_seconds: float | None = None
    distance_meters: int | None = None
    legs: list[TrafficLeg] = Field(default_factory=list)

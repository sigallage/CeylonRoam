from __future__ import annotations

import os
from typing import Any

import httpx


class GoogleMatrixError(RuntimeError):
    pass


def _format_latlng(lat: float, lng: float) -> str:
    return f"{lat},{lng}"


def fetch_distance_matrix(
    coords: list[tuple[float, float]],
    *,
    api_key: str | None = None,
    departure_time: str = "now",
    traffic_model: str = "best_guess",
    mode: str = "driving",
    timeout_s: float = 20.0,
) -> dict[str, list[list[float]]]:
    """Fetch distance + duration matrices from Google Distance Matrix API.

    Returns:
      {
        'distance_km': NxN (float),
        'duration_s': NxN (float),
        'duration_in_traffic_s': NxN (float)
      }

    Notes:
    - API requires billing enabled.
    - duration_in_traffic is available for driving with departure_time.
    - Google may return asymmetric results; matrices here preserve direction.
    """

    if api_key is None:
        api_key = (
            os.getenv("GOOGLE_MAPS_API_KEY")
            or os.getenv("GOOGLE_MAPS_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("GMAPS_API_KEY")
        )

    if not api_key:
        raise GoogleMatrixError(
            "Missing GOOGLE_MAPS_API_KEY. Set it in the backend environment to use live traffic."
        )

    n = len(coords)
    if n == 0:
        return {
            "distance_km": [],
            "duration_s": [],
            "duration_in_traffic_s": [],
        }

    origins = "|".join(_format_latlng(lat, lng) for lat, lng in coords)
    destinations = origins

    params = {
        "origins": origins,
        "destinations": destinations,
        "mode": mode,
        "units": "metric",
        "departure_time": departure_time,
        "traffic_model": traffic_model,
        "key": api_key,
    }

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"

    with httpx.Client(timeout=timeout_s) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        payload: dict[str, Any] = resp.json()

    if payload.get("status") != "OK":
        status = payload.get("status")
        error_message = payload.get("error_message", "")
        if status == "REQUEST_DENIED" and "referer" in str(error_message).lower():
            raise GoogleMatrixError(
                "Google Distance Matrix error: REQUEST_DENIED (referer restriction). "
                "Your key is likely restricted to HTTP referrers (browser key). "
                "Use a server key for the backend (Application restrictions: None or IP addresses)."
            )
        raise GoogleMatrixError(f"Google Distance Matrix error: {status} {error_message}")

    rows = payload.get("rows", [])
    if len(rows) != n:
        raise GoogleMatrixError("Unexpected Distance Matrix response shape")

    distance_km = [[0.0] * n for _ in range(n)]
    duration_s = [[0.0] * n for _ in range(n)]
    duration_in_traffic_s = [[0.0] * n for _ in range(n)]

    for i in range(n):
        elements = rows[i].get("elements", [])
        if len(elements) != n:
            raise GoogleMatrixError("Unexpected Distance Matrix response shape")
        for j in range(n):
            el = elements[j]
            status = el.get("status")
            if status != "OK":
                # Keep large penalties for unreachable pairs
                distance_km[i][j] = 1e9
                duration_s[i][j] = 1e9
                duration_in_traffic_s[i][j] = 1e9
                continue

            dist_m = float(el.get("distance", {}).get("value", 0.0))
            dur = float(el.get("duration", {}).get("value", 0.0))
            dur_traffic = float(el.get("duration_in_traffic", {}).get("value", dur))

            distance_km[i][j] = dist_m / 1000.0
            duration_s[i][j] = dur
            duration_in_traffic_s[i][j] = dur_traffic

    return {
        "distance_km": distance_km,
        "duration_s": duration_s,
        "duration_in_traffic_s": duration_in_traffic_s,
    }

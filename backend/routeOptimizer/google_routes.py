from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx


class GoogleRoutesError(RuntimeError):
    pass


_DURATION_RE = re.compile(r"^(?P<secs>\d+(?:\.\d+)?)s$")


def _parse_duration_seconds(value: str | None) -> float | None:
    if not value:
        return None
    m = _DURATION_RE.match(value)
    if not m:
        return None
    return float(m.group("secs"))


def compute_traffic_route(
    *,
    origin: tuple[float, float],
    destination: tuple[float, float],
    intermediates: list[tuple[float, float]] | None = None,
    travel_mode: str = "DRIVE",
    timeout_s: float = 20.0,
) -> dict[str, Any]:
    """Compute a traffic-aware route polyline with speed reading intervals.

    Uses Google Routes API (v2) with `TRAFFIC_ON_POLYLINE` extra computation to
    get `speedReadingIntervals` for each leg.

    Notes:
    - Requires billing and Routes API enabled.
    - Uses `GOOGLE_MAPS_API_KEY` from environment (server-side key).
    """

    # Prefer a server-side key env var, but accept a few common aliases to
    # reduce local setup friction.
    api_key = (
        os.getenv("GOOGLE_MAPS_API_KEY")
        or os.getenv("GOOGLE_MAPS_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GMAPS_API_KEY")
    )
    if not api_key:
        raise GoogleRoutesError(
            "Missing GOOGLE_MAPS_API_KEY. Set it in the backend environment (or a backend .env file) to use Routes traffic-on-polyline."
        )

    intermediates = intermediates or []

    body: dict[str, Any] = {
        "origin": {"location": {"latLng": {"latitude": origin[0], "longitude": origin[1]}}},
        "destination": {"location": {"latLng": {"latitude": destination[0], "longitude": destination[1]}}},
        "travelMode": travel_mode,
        "routingPreference": "TRAFFIC_AWARE_OPTIMAL",
        "extraComputations": ["TRAFFIC_ON_POLYLINE"],
        "polylineQuality": "HIGH_QUALITY",
        "polylineEncoding": "ENCODED_POLYLINE",
        "departureTime": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }

    if intermediates:
        body["intermediates"] = [
            {"location": {"latLng": {"latitude": lat, "longitude": lng}}} for lat, lng in intermediates
        ]

    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": (
            "routes.duration,routes.staticDuration,routes.distanceMeters,"
            "routes.legs.polyline.encodedPolyline,"
            "routes.legs.travelAdvisory.speedReadingIntervals"
        ),
        "Content-Type": "application/json",
    }

    url = "https://routes.googleapis.com/directions/v2:computeRoutes"

    with httpx.Client(timeout=timeout_s) as client:
        resp = client.post(url, headers=headers, json=body)
        if resp.status_code >= 400:
            # Routes API errors are JSON, but keep a readable message.
            try:
                payload = resp.json()
                message = payload.get("error", {}).get("message") or str(payload)
            except Exception:
                message = resp.text
            # Common local-dev pitfall: using a browser-restricted key (HTTP referrers)
            # for a server-side call. Server-side requests have no Referer header.
            if resp.status_code == 403 and "referer <empty>" in message.lower():
                raise GoogleRoutesError(
                    "Google Routes error (403): requests from referer <empty> are blocked. "
                    "This usually means your API key is restricted to HTTP referrers (browser key). "
                    "For the backend, use a server key (Application restrictions: None or IP addresses), "
                    "and restrict APIs to Routes API."
                )
            raise GoogleRoutesError(f"Google Routes error ({resp.status_code}): {message}")
        payload = resp.json()

    routes = payload.get("routes") or []
    if not routes:
        raise GoogleRoutesError("No route returned by Google Routes API")

    r0 = routes[0]
    legs_out = []
    for leg in (r0.get("legs") or []):
        poly = ((leg.get("polyline") or {}).get("encodedPolyline")) or ""
        intervals = []
        travel_adv = leg.get("travelAdvisory") or {}
        for it in (travel_adv.get("speedReadingIntervals") or []):
            intervals.append(
                {
                    "startIndex": int(it.get("startPolylinePointIndex", 0)),
                    "endIndex": int(it.get("endPolylinePointIndex", 0)),
                    "speed": (it.get("speed") or "SPEED_UNSPECIFIED"),
                }
            )
        legs_out.append({"encodedPolyline": poly, "speedReadingIntervals": intervals})

    return {
        "durationSeconds": _parse_duration_seconds(r0.get("duration")),
        "staticDurationSeconds": _parse_duration_seconds(r0.get("staticDuration")),
        "distanceMeters": r0.get("distanceMeters"),
        "legs": legs_out,
    }

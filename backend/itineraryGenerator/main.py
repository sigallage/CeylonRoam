from __future__ import annotations

import logging
import os
import json
from functools import lru_cache
from pathlib import Path
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Literal

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Environment variables loaded for future use (e.g., OPENROUTER_API_KEY for AI-enhanced itineraries)
# Currently using rule-based generation, but env vars ready for AI integration

app = FastAPI(title="TRAVEL-AI API", version="0.1.0")


def _get_cors_settings() -> tuple[list[str], bool, str | None]:
    raw = (os.getenv("CORS_ORIGINS") or "").strip()
    if not raw:
        # Default dev origins:
        # - Vite dev server
        # - Capacitor WebView (commonly capacitor://localhost or http://localhost)
        return [], True, r"^(capacitor|ionic)://localhost$|^https?://localhost(:\\d+)?$|^https?://127\\.0\\.0\\.1(:\\d+)?$"

    parts = [p.strip() for p in raw.split(",") if p.strip()]
    if any(p == "*" for p in parts):
        # Browsers don't allow wildcard CORS with credentials.
        return ["*"], False, None

    return parts, True, None


cors_origins, cors_allow_credentials, cors_origin_regex = _get_cors_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MetaResponse(BaseModel):
    name: str
    tagline: str
    message: str
    status: Literal["loading", "ready", "error"]
    timestamp: str


class HealthResponse(BaseModel):
    status: Literal["ok"]


class GenerateRequest(BaseModel):
    gender: Literal["male", "female", "other"]
    purpose: list[str]
    traveling_with: Literal["solo", "family", "group", "couple"] | str
    budget_lkr: int | str
    preferences: list[str]
    start_date: date | None = None
    end_date: date | None = None
    provinces: list[str] = []


class GenerateResponse(BaseModel):
    summary: str
    itinerary: str
    generated_at: datetime
    metadata: Dict[str, Any] | None = None


class Destination(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    description: str = ""
    image_url: str = ""
    category: str = ""
    crowd_info: Dict[str, Any] | None = None
    cultural_guidelines: Dict[str, Any] | None = None
    entry_fee: str = ""
    opening_hours: str = ""

    class Config:
        extra = "ignore"


@app.get("/api/meta", response_model=MetaResponse)
def read_meta() -> MetaResponse:
    return MetaResponse(
        name="TRAVEL-AI",
        tagline="Charting your next journey with intelligence",
        message="Your personalized trips are nearly ready...",
        status="ready",
        timestamp=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    )


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


def _format_date_label(start: date | None, end: date | None) -> tuple[date | None, date | None, str | None]:
    if not start:
        return None, None, None

    if not end or start == end:
        label = start.strftime("%B %d, %Y")
        return start, start, label
    
    label = f"{start.strftime('%B %d, %Y')} – {end.strftime('%B %d, %Y')}"
    return start, end, label


def _format_budget_label(budget: int | str) -> str:
    if isinstance(budget, (int, float)):
        return f"{int(budget):,}"

    cleaned = "".join(ch for ch in str(budget) if ch.isdigit())
    if cleaned:
        return f"{int(cleaned):,}"

    return str(budget).strip()


def _human_join(values: list[str]) -> str:
    filtered = [value.strip() for value in values if value.strip()]
    if not filtered:
        return ""
    if len(filtered) == 1:
        return filtered[0]
    return ", ".join(filtered[:-1]) + f" and {filtered[-1]}"


def _shorten(text: str, max_len: int = 180) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 1].rstrip() + "…"


def _try_parse_json_file(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _resolve_destinations_json_path() -> Path:
    configured = (os.getenv("DESTINATIONS_JSON_PATH") or "").strip()
    if configured:
        configured_path = Path(configured)
        if configured_path.exists():
            return configured_path

    here = Path(__file__).resolve().parent
    candidates = [
        here / "destinations.json",
        here / "data" / "destinations.json",
        # Repo layout fallback: backend/itineraryGenerator/main.py -> ../../frontend/src/dataset/destinations.json
        here.parents[1] / "frontend" / "src" / "dataset" / "destinations.json",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    # As a last resort, point at the in-container path so the error message is actionable.
    return Path("/app/destinations.json")


@lru_cache(maxsize=1)
def _load_destinations_catalog() -> list[Destination]:
    path = _resolve_destinations_json_path()
    if not path.exists():
        raise FileNotFoundError(
            "destinations.json not found. Set DESTINATIONS_JSON_PATH or provide the file at one of: "
            f"{path}, ./destinations.json, or frontend/src/dataset/destinations.json"
        )

    raw = _try_parse_json_file(path)
    if not isinstance(raw, list):
        raise ValueError(f"destinations.json must be a JSON array, got: {type(raw).__name__}")

    destinations: list[Destination] = []
    for item in raw:
        try:
            destinations.append(Destination.model_validate(item))
        except Exception:
            # Skip malformed entries rather than failing the whole service.
            logger.exception("Skipping invalid destination entry")

    if not destinations:
        raise ValueError("destinations.json loaded but contained no valid destinations")

    logger.info(f"Loaded {len(destinations)} destinations from {path}")
    return destinations


THEME_KEYWORDS = {
    "beach": ["beach", "coast", "surf", "sun", "sea", "snorkel"],
    "culture": ["culture", "heritage", "temple", "history", "museum", "art"],
    "nature": ["nature", "hike", "scenic", "tea", "mountain", "waterfall"],
    "wildlife": ["wildlife", "safari", "elephant", "bird", "park"],
    "adventure": ["adventure", "rafting", "trek", "zip", "canyon", "dive"],
    "wellness": ["wellness", "spa", "yoga", "relax", "retreat"],
    "food": ["food", "culinary", "cuisine", "dining", "market", "street"],
    "city": ["city", "shopping", "nightlife", "urban", "gallery"],
}

def _destination_matches_theme(destination: Destination, theme: str) -> bool:
    haystack = f"{destination.name} {destination.category} {destination.description}".lower()
    for keyword in THEME_KEYWORDS.get(theme, []):
        if keyword in haystack:
            return True
    return False


def _build_theme_destination_map(destinations: list[Destination]) -> Dict[str, list[Destination]]:
    theme_map: Dict[str, list[Destination]] = {key: [] for key in THEME_KEYWORDS.keys()}
    for destination in destinations:
        for theme in theme_map.keys():
            if _destination_matches_theme(destination, theme):
                theme_map[theme].append(destination)
    return theme_map


def _destination_best_time(destination: Destination) -> str:
    if not isinstance(destination.crowd_info, dict):
        return ""
    return str(destination.crowd_info.get("best_time_to_visit") or "").strip()


def _pick_destination(*, candidates: list[Destination], all_destinations: list[Destination], used_ids: set[str], index: int) -> Destination:
    pool = [d for d in candidates if d.id not in used_ids]
    if not pool:
        pool = [d for d in all_destinations if d.id not in used_ids]
    if not pool:
        pool = all_destinations
    chosen = pool[index % len(pool)]
    used_ids.add(chosen.id)
    return chosen


def _infer_themes(purpose: list[str], preferences: list[str]) -> list[str]:
    scores: Dict[str, int] = {key: 0 for key in THEME_KEYWORDS}
    raw_values = [value.lower() for value in purpose + preferences]
    for value in raw_values:
        for theme, keywords in THEME_KEYWORDS.items():
            if any(keyword in value for keyword in keywords):
                scores[theme] += 1

    ranked = [theme for theme, score in sorted(scores.items(), key=lambda item: item[1], reverse=True) if score]
    if ranked:
        return ranked
    return ["culture", "nature", "beach"]


def _format_preference_notes(preferences: list[str]) -> list[str]:
    notes: list[str] = []
    lowered = [pref.lower() for pref in preferences]
    if any("vegetarian" in pref or "vegan" in pref for pref in lowered):
        notes.append("Confirm vegetarian/vegan options when pre-booking meals; most cafes can adapt with notice.")
    if any("wheel" in pref or "accessible" in pref for pref in lowered):
        notes.append("Request ground-floor rooms and check ramp access ahead of time; major sites provide assistance.")
    if any("photography" in pref for pref in lowered):
        notes.append("Carry spare batteries and plan golden-hour shoots; drones usually need prior approval.")
    if any("spa" in pref or "massage" in pref for pref in lowered):
        notes.append("Reserve spa slots 24 hours in advance to secure preferred therapists and time windows.")
    return notes


def _parse_budget_value(budget: int | str) -> int | None:
    if isinstance(budget, int):
        return budget
    cleaned = "".join(ch for ch in str(budget) if ch.isdigit())
    if cleaned:
        try:
            return int(cleaned)
        except ValueError:
            return None
    return None


def _generate_itinerary(
    *,
    payload: GenerateRequest,
    day_count: int,
    start_date: date | None,
    travel_descriptor: str,
    preferences_phrase: str,
    budget_value: int | None,
) -> str:
    day_total = max(day_count, 1)
    if day_total <= 0:
        day_total = 2

    destinations = _load_destinations_catalog()
    theme_destination_map = _build_theme_destination_map(destinations)

    inferred_themes = _infer_themes(payload.purpose, payload.preferences)
    preference_notes = _format_preference_notes(payload.preferences)

    itinerary_lines: list[str] = []

    if payload.provinces:
        # The current destination catalog does not include province metadata; avoid implying a filter.
        province_text = ", ".join(payload.provinces)
        itinerary_lines.append(f"Note: Province filtering requested ({province_text}), but the destination catalog does not include province metadata. Showing best-matching destinations from the full catalog.")
        itinerary_lines.append("")

    used_destination_ids: set[str] = set()

    day_slot_labels = ["Morning", "Afternoon", "Evening"]

    for day_index in range(day_total):
        if start_date:
            day_label = (start_date + timedelta(days=day_index)).strftime("%A, %B %d")
            itinerary_lines.append(f"Day {day_index + 1} – ({day_label})")
        else:
            itinerary_lines.append(f"Day {day_index + 1}")
        itinerary_lines.append("")

        # Rotate themes across the day's slots to increase variety.
        slot_themes = [
            inferred_themes[(day_index + 0) % len(inferred_themes)],
            inferred_themes[(day_index + 1) % len(inferred_themes)],
            inferred_themes[(day_index + 2) % len(inferred_themes)],
        ]

        for slot_index, slot_label in enumerate(day_slot_labels):
            theme = slot_themes[slot_index]
            candidates = theme_destination_map.get(theme) or destinations
            destination = _pick_destination(
                candidates=candidates,
                all_destinations=destinations,
                used_ids=used_destination_ids,
                index=(day_index * 3) + slot_index,
            )

            title = destination.name
            if destination.category:
                title += f" ({destination.category})"

            line = f"• {slot_label}: {title}"
            overview = _shorten(destination.description, 140)
            if overview:
                line += f" — {overview}"

            best_time = _destination_best_time(destination)
            if best_time:
                line += f" (Best time: {_shorten(best_time, 80)})"

            itinerary_lines.append(line)

        itinerary_lines.append("")

    itinerary_lines.append("Logistics & Tips:")
    travel_tip = "solo-friendly guesthouses" if travel_descriptor == "solo" else f"stays that suit {travel_descriptor} travelers"
    itinerary_lines.append(f"- Pre-book {travel_tip} near key activities to reduce transfer time.")
    if preferences_phrase:
        itinerary_lines.append(f"- Keep preferences in focus by sharing this plan with guides: {preferences_phrase}.")
    itinerary_lines.append("- Allow buffer time between activities for local travel and weather shifts.")

    if budget_value and day_total:
        per_day = max(1, round(budget_value / day_total))
        itinerary_lines.append("Budget Guidance:")
        itinerary_lines.append(f"- Overall budget: {per_day * day_total:,} LKR (approx.)")
        itinerary_lines.append(f"- Target spend per day: {per_day:,} LKR covering meals, activities, and transport.")
        itinerary_lines.append("- Reserve 10% (cash) for tips and unexpected add-ons.")

    if preference_notes:
        itinerary_lines.append("Personal Notes:")
        for note in preference_notes:
            itinerary_lines.append(f"- {note}")

    return "\n".join(line for line in itinerary_lines if line.strip() or line == "")


def _build_summary_and_itinerary(payload: GenerateRequest) -> tuple[str, str, Dict[str, Any]]:
    start_date, end_date, date_label = _format_date_label(payload.start_date, payload.end_date)
    day_count = 0
    if start_date and end_date:
        day_count = (end_date - start_date).days + 1
    elif start_date:
        day_count = 1

    day_phrase = f"{day_count}-day" if day_count else "Multi-day"
    raw_travel_descriptor = str(payload.traveling_with or "solo").strip() or "solo"
    travel_descriptor = raw_travel_descriptor.replace("_", " ").lower()
    purpose_phrase = _human_join(payload.purpose) or "general interests"
    budget_label = _format_budget_label(payload.budget_lkr)
    preferences_phrase = _human_join(payload.preferences)
    provinces_phrase = _human_join(payload.provinces) if payload.provinces else ""

    summary_parts = [
        f"{day_phrase} {travel_descriptor} itinerary focused on {purpose_phrase}",
    ]
    
    if provinces_phrase:
        summary_parts[-1] += f" in {provinces_phrase} province" if len(payload.provinces) == 1 else f" across {provinces_phrase} provinces"
    else:
        summary_parts[-1] += " in Sri Lanka"
    
    if date_label:
        summary_parts[-1] += f" ({date_label})"
    summary_parts[-1] += f" for a {payload.gender.lower()} traveler"
    if budget_label:
        summary_parts[-1] += f", {budget_label} LKR budget."
    else:
        summary_parts[-1] += "."
    if preferences_phrase:
        summary_parts.append(f"Key preferences: {preferences_phrase}.")

    summary = " ".join(summary_parts)

    metadata: Dict[str, Any] = {
        "day_count": day_count,
        "date_range": {
            "start": start_date.isoformat() if start_date else None,
            "end": end_date.isoformat() if end_date else None,
            "label": date_label,
        },
        "purposes": [value for value in payload.purpose if value.strip()],
        "preferences": [value for value in payload.preferences if value.strip()],
        "provinces": payload.provinces,
        "traveling_with": travel_descriptor,
        "budget_label": budget_label,
    }

    itinerary = _generate_itinerary(
        payload=payload,
        day_count=day_count,
        start_date=start_date,
        travel_descriptor=travel_descriptor,
        preferences_phrase=preferences_phrase,
        budget_value=_parse_budget_value(payload.budget_lkr),
    )

    try:
        destinations = _load_destinations_catalog()
        metadata["destination_catalog_count"] = len(destinations)
        metadata["destination_catalog_path"] = str(_resolve_destinations_json_path())
    except Exception:
        # Don't fail response if catalog metadata cannot be resolved (should be rare).
        logger.exception("Unable to attach destination catalog metadata")

    return summary, itinerary, metadata


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_trip_plan(payload: GenerateRequest) -> GenerateResponse:
    summary, itinerary, metadata = _build_summary_and_itinerary(payload)
    return GenerateResponse(
        summary=summary,
        itinerary=itinerary,
        generated_at=datetime.now(timezone.utc),
        metadata=metadata,
    )

from __future__ import annotations

import logging
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
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


@app.get("/api/meta", response_model=MetaResponse)
def read_meta() -> MetaResponse:
    return MetaResponse(
        name="TRAVEL-AI",
        tagline="Charting your next journey with intelligence",
        message="Your personalized trips are nearly ready...",
        status="ready",
        timestamp=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    )


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

# Mapping of locations to their provinces based on correct district divisions
LOCATION_TO_PROVINCE = {
    # Western Province (Colombo, Gampaha, Kalutara districts)
    "Colombo": "Western",          # Colombo District
    "Mount Lavinia": "Western",     # Colombo District
    "Dehiwala": "Western",          # Colombo District
    "Moratuwa": "Western",          # Colombo District
    "Negombo": "Western",           # Gampaha District
    "Kalutara": "Western",          # Kalutara District
    "Bentota": "Western",           # Kalutara District
    
    # Central Province (Kandy, Matale, Nuwara Eliya districts)
    "Kandy": "Central",             # Kandy District
    "Matale": "Central",            # Matale District
    "Nuwara Eliya": "Central",      # Nuwara Eliya District
    "Knuckles Range": "Central",    # Kandy/Matale District
    "Knuckles": "Central",          # Kandy/Matale District
    "Sigiriya": "Central",          # Matale District
    "Dambulla": "Central",          # Matale District
    "Horton Plains": "Central",     # Nuwara Eliya District
    
    # Southern Province (Galle, Matara, Hambantota districts)
    "Galle": "Southern",            # Galle District
    "Galle Fort": "Southern",       # Galle District
    "Unawatuna": "Southern",        # Galle District
    "Mirissa": "Southern",          # Matara District
    "Matara": "Southern",           # Matara District
    "Weligama": "Southern",         # Matara District
    "Talpe": "Southern",            # Galle District
    "Tangalle": "Southern",         # Hambantota District
    "Yala": "Southern",             # Hambantota District
    
    # Northern Province (Jaffna, Kilinochchi, Mannar, Mullaitivu, Vavuniya districts)
    "Jaffna": "Northern",           # Jaffna District
    "Kilinochchi": "Northern",      # Kilinochchi District
    "Mannar": "Northern",           # Mannar District
    "Mullaitivu": "Northern",       # Mullaitivu District
    "Vavuniya": "Northern",         # Vavuniya District
    
    # Eastern Province (Trincomalee, Batticaloa, Ampara districts)
    "Trincomalee": "Eastern",       # Trincomalee District
    "Passikudah": "Eastern",        # Batticaloa District
    "Batticaloa": "Eastern",        # Batticaloa District
    "Ampara": "Eastern",            # Ampara District
    "Arugam Bay": "Eastern",        # Ampara District
    
    # North Western Province (Kurunegala, Puttalam districts)
    "Kurunegala": "North Western",  # Kurunegala District
    "Puttalam": "North Western",    # Puttalam District
    "Kalpitiya": "North Western",   # Puttalam District
    "Wilpattu": "North Western",    # Puttalam District
    
    # North Central Province (Anuradhapura, Polonnaruwa districts)
    "Anuradhapura": "North Central", # Anuradhapura District
    "Mihintale": "North Central",    # Anuradhapura District
    "Polonnaruwa": "North Central",  # Polonnaruwa District
    "Minneriya": "North Central",    # Polonnaruwa District
    
    # Uva Province (Badulla, Monaragala districts)
    "Ella": "Uva",                  # Badulla District
    "Badulla": "Uva",               # Badulla District
    "Bandarawela": "Uva",           # Badulla District
    "Haputale": "Uva",              # Badulla District
    
    # Sabaragamuwa Province (Ratnapura, Kegalle districts)
    "Ratnapura": "Sabaragamuwa",    # Ratnapura District
    "Kegalle": "Sabaragamuwa",      # Kegalle District
    "Kitulgala": "Sabaragamuwa",    # Kegalle District
    "Sinharaja": "Sabaragamuwa",    # Ratnapura/Galle Districts (border area, spans Southern too)
    "Sinharaja South": "Southern",  # Southern side of Sinharaja for better province coverage
    "Udawalawe": "Sabaragamuwa",    # Ratnapura District
}


# Detailed attractions by location and district
LOCATION_ATTRACTIONS = {
    "Colombo": {
        "district": "Colombo District",
        "attractions": [
            "Colombo Fort & Pettah Market – Explore colonial architecture, busy streets, and local shopping.",
            "Galle Face Green – Sunset strolls, kite flying, local snacks.",
            "Gangaramaya Temple – Visit one of the most iconic Buddhist temples in Sri Lanka.",
            "Colombo National Museum – Learn about Sri Lanka's history and culture.",
            "Independence Square – Historic landmark with beautiful architecture.",
            "Beira Lake & Seema Malaka Temple – Scenic lake views and floating temple.",
            "Dutch Hospital Shopping Precinct – Boutique shops, cafes, nightlife.",
            "Colombo City Centre / One Galle Face Mall – Shopping, dining, entertainment.",
        ]
    },
    "Mount Lavinia": {
        "district": "Colombo District",
        "attractions": [
            "Mount Lavinia Beach – Relax on the sand, try seafood at beachfront restaurants.",
            "Mount Lavinia Hotel – Historic colonial hotel with ocean views.",
            "Golden Mile Beach – Swimming, beach activities, sunset views.",
        ]
    },
    "Dehiwala": {
        "district": "Colombo District",
        "attractions": [
            "Dehiwala Zoo (National Zoological Gardens) – See exotic wildlife in a lush setting.",
            "Attidiya Bird Sanctuary – Wetland reserve for birdwatching.",
            "Dehiwala Beach – Local beach with seaside dining options.",
        ]
    },
    "Moratuwa": {
        "district": "Colombo District",
        "attractions": [
            "Moratuwa Beach – Quiet coastal area with fishing boats.",
            "Wooden handicraft workshops – Explore traditional woodworking crafts.",
            "Local markets – Experience authentic Sri Lankan shopping.",
        ]
    },
    "Negombo": {
        "district": "Gampaha District",
        "attractions": [
            "Negombo Lagoon & Dutch Fort – Boat tours, fishing village experience.",
            "Negombo Beach – Swimming, water sports, sunset views.",
            "Negombo Fish Market – Fresh seafood and local culture.",
            "St. Mary's Church – Beautiful Catholic church with impressive architecture.",
            "Muthurajawela Marsh – Wetland sanctuary for birdwatching and boat safaris.",
        ]
    },
    "Bentota": {
        "district": "Kalutara District",
        "attractions": [
            "Bentota Beach – Golden sands, water sports, swimming.",
            "Bentota River – Boat rides, mangrove tours, wildlife spotting.",
            "Brief Garden – Bevis Bawa's landscaped garden estate.",
            "Kosgoda Turtle Hatchery – Sea turtle conservation and baby turtles.",
            "Water sports – Jet skiing, windsurfing, banana boat rides.",
        ]
    },
    "Kalutara": {
        "district": "Kalutara District",
        "attractions": [
            "Kalutara Bodhiya – Sacred Buddhist temple with ocean views.",
            "Kalutara Beach – Clean sandy beach for relaxation.",
            "Richmond Castle – Colonial-era mansion with beautiful architecture.",
            "Kalu Ganga River – Boat rides and scenic views.",
        ]
    },
    "Kandy": {
        "district": "Kandy District",
        "attractions": [
            "Temple of the Sacred Tooth Relic – UNESCO World Heritage Site, most sacred Buddhist temple.",
            "Kandy Lake – Scenic walks around the picturesque lake.",
            "Royal Botanical Gardens (Peradeniya) – 147-acre gardens with orchids and palm collection.",
            "Kandy Cultural Show – Traditional Kandyan dancing and drumming.",
            "Bahirawakanda Vihara Buddha Statue – Panoramic city views.",
            "Udawattakele Forest Reserve – Nature trails and birdwatching.",
        ]
    },
    "Sigiriya": {
        "district": "Matale District",
        "attractions": [
            "Sigiriya Rock Fortress – UNESCO World Heritage Site, ancient rock palace with frescoes.",
            "Sigiriya Museum – Learn about the fortress history.",
            "Pidurangala Rock – Alternative climb with views of Sigiriya.",
            "Sigiriya Frescoes – Ancient paintings on the rock face.",
        ]
    },
    "Dambulla": {
        "district": "Matale District",
        "attractions": [
            "Dambulla Cave Temple (Golden Temple) – UNESCO site with ancient Buddha statues and paintings.",
            "Dambulla Royal Cave Temple Complex – Five caves with religious art.",
            "Giant Golden Buddha Statue – Iconic landmark visible from distance.",
            "Ibbankatuwa Megalithic Tombs – Archaeological site with ancient burial grounds.",
        ]
    },
    "Matale": {
        "district": "Matale District",
        "attractions": [
            "Aluvihare Rock Temple – Ancient Buddhist monastery with cave temples.",
            "Matale Spice Gardens – Tour spice plantations and learn about Sri Lankan spices.",
            "Riverston Peak – Scenic hiking spot with panoramic views.",
            "Sembuwatta Lake – Beautiful lake surrounded by hills and forests.",
        ]
    },
    "Nuwara Eliya": {
        "district": "Nuwara Eliya District",
        "attractions": [
            "Gregory Lake – Boating, swan rides, lakeside walks.",
            "Victoria Park – Well-maintained park with flowering plants.",
            "Hakgala Botanical Gardens – Cool-climate gardens with roses and orchids.",
            "Pedro Tea Estate – Tea factory tours and tastings.",
            "Horton Plains National Park – World's End viewpoint and Baker's Falls.",
            "Seetha Amman Temple – Hindu temple with Ramayana connections.",
        ]
    },
    "Galle": {
        "district": "Galle District",
        "attractions": [
            "Galle Fort – UNESCO World Heritage Site, Dutch colonial fort with ramparts.",
            "Galle Lighthouse – Iconic landmark within the fort.",
            "Dutch Reformed Church – Historic church from colonial era.",
            "Galle National Museum – Maritime and Dutch colonial artifacts.",
            "Fort walls walk – Sunset views along the ramparts.",
            "Boutique shops and cafes – Shopping and dining in colonial buildings.",
        ]
    },
    "Galle Fort": {
        "district": "Galle District",
        "attractions": [
            "Galle Fort Ramparts – Walk along the historic walls with ocean views.",
            "Dutch Reformed Church – 18th-century church with beautiful architecture.",
            "Maritime Archaeology Museum – Underwater discoveries and shipwrecks.",
            "Clock Tower – Colonial landmark within the fort.",
            "Flag Rock – Popular spot for cliff diving and sunsets.",
        ]
    },
    "Unawatuna": {
        "district": "Galle District",
        "attractions": [
            "Unawatuna Beach – Crescent-shaped beach perfect for swimming.",
            "Jungle Beach – Secluded beach with snorkeling.",
            "Japanese Peace Pagoda – Hilltop Buddhist stupa with panoramic views.",
            "Snorkeling and diving – Explore coral reefs and marine life.",
        ]
    },
    "Mirissa": {
        "district": "Matara District",
        "attractions": [
            "Mirissa Beach – Beautiful sandy beach with palm trees.",
            "Whale Watching Tours – See blue whales and dolphins (seasonal).",
            "Coconut Tree Hill – Instagram-famous viewpoint.",
            "Secret Beach – Hidden cove for quiet relaxation.",
            "Surfing lessons – Beginner-friendly waves.",
        ]
    },
    "Ella": {
        "district": "Badulla District",
        "attractions": [
            "Nine Arch Bridge – Iconic railway bridge surrounded by tea plantations.",
            "Ella Rock – Hiking trail with stunning valley views.",
            "Little Adam's Peak – Easy hike with panoramic scenery.",
            "Ravana Falls – Picturesque waterfall beside the highway.",
            "Lipton's Seat – Tea estate viewpoint with mountain vistas.",
            "Flying Ravana Mega Zipline – Adventure activity with aerial views.",
        ]
    },
    "Anuradhapura": {
        "district": "Anuradhapura District",
        "attractions": [
            "Sri Maha Bodhi – Sacred fig tree over 2,000 years old.",
            "Ruwanwelisaya Stupa – Massive white dagoba and pilgrimage site.",
            "Jetavanarama – Ancient stupa, once one of the tallest structures.",
            "Abhayagiri Monastery – Ruins of ancient Buddhist monastery.",
            "Isurumuniya Rock Temple – Temple with ancient rock carvings.",
            "Twin Ponds (Kuttam Pokuna) – Ancient bathing pools with perfect symmetry.",
        ]
    },
    "Polonnaruwa": {
        "district": "Polonnaruwa District",
        "attractions": [
            "Gal Vihara – Rock temple with giant Buddha statues.",
            "Polonnaruwa Ancient City – UNESCO World Heritage ruins.",
            "Parakrama Samudra – Ancient reservoir or 'sea built by King Parakramabahu.",
            "Royal Palace ruins – Ancient king's palace complex.",
            "Lankathilaka Temple – Impressive ancient temple structure.",
        ]
    },
    "Jaffna": {
        "district": "Jaffna District",
        "attractions": [
            "Jaffna Fort – Dutch colonial fort with ocean views.",
            "Nallur Kandaswamy Temple – Colorful Hindu temple with festivals.",
            "Jaffna Public Library – Iconic colonial building.",
            "Casuarina Beach – Pristine beach with white sand.",
            "Nagadeepa Buddhist Temple – Important pilgrimage site.",
        ]
    },
    "Trincomalee": {
        "district": "Trincomalee District",
        "attractions": [
            "Nilaveli Beach – Pristine white sand beach.",
            "Pigeon Island National Park – Snorkeling, coral reefs, sea turtles.",
            "Koneswaram Temple – Hindu temple on cliff with ocean views.",
            "Trincomalee Harbor – Natural deep-water harbor.",
            "Hot Water Springs (Kanniya) – Seven natural hot springs.",
        ]
    },
    "Arugam Bay": {
        "district": "Ampara District",
        "attractions": [
            "Arugam Bay Beach – World-famous surfing destination.",
            "Elephant Rock – Surf break and beach hangout spot.",
            "Pottuvil Point – Long right-hand surf break.",
            "Kumana National Park – Birdwatching and wildlife safaris.",
            "Muhudu Maha Viharaya – Ancient Buddhist temple by the beach.",
        ]
    },
    "Yala": {
        "district": "Hambantota District",
        "attractions": [
            "Yala National Park – Safari to see leopards, elephants, and wildlife.",
            "Block I Safari – Most popular area for animal sightings.",
            "Sithulpawwa Rock Temple – Ancient Buddhist monastery in the park.",
            "Leopard spotting – Highest leopard density in the world.",
        ]
    },
}

THEME_LIBRARY = {
    "beach": {
        "locations": ["Mirissa", "Bentota", "Passikudah", "Kalpitiya", "Negombo", "Weligama", "Unawatuna", "Tangalle", "Trincomalee", "Arugam Bay", "Mount Lavinia", "Dehiwala"],
        "morning": [
            "Catch the sunrise over {location} beach before a light tropical breakfast.",
            "Join a dawn yoga stretch on the sands of {location} and fuel up with fresh king coconut.",
        ],
        "afternoon": [
            "Snorkel the nearby reefs of {location} and break for lunch at a seaside cafe.",
            "Head out on a dolphin-spotting cruise off the coast of {location}, keeping the camera ready.",
        ],
        "evening": [
            "Relax with a sunset catamaran sail at {location} followed by grilled seafood within budget.",
            "Wind down with a beach barbecue at {location} and sample local kottu or hoppers.",
        ],
    },
    "culture": {
        "locations": ["Kandy", "Galle Fort", "Anuradhapura", "Jaffna", "Sigiriya", "Dambulla", "Polonnaruwa", "Colombo"],
        "morning": [
            "Walk through {location}'s old quarters with a local guide to learn stories tied to key landmarks.",
            "Visit living temples around {location} during the morning puja and observe traditional rituals.",
        ],
        "afternoon": [
            "Browse curated museums and artisan workshops in {location}, then enjoy a rice and curry lunch.",
            "Cycle between UNESCO-listed ruins near {location} with commentary on ancient kingdoms.",
        ],
        "evening": [
            "Attend a cultural show in {location} and dine on regional specialties at a modest boutique eatery.",
            "Join a twilight fort walk in {location} ending with sunset tea at a veranda overlooking the ramparts.",
        ],
    },
    "nature": {
        "locations": ["Ella", "Nuwara Eliya", "Knuckles Range", "Sinharaja", "Haputale", "Horton Plains", "Kitulgala"],
        "morning": [
            "Start with a scenic hike near {location}, pausing at lookout points for panoramic photos.",
            "Ride the famed hill-country train into {location} and breathe in the cool tea-country air.",
        ],
        "afternoon": [
            "Tour a working tea estate outside {location} and enjoy a factory tasting session.",
            "Trek to nearby waterfalls around {location} with a guide who knows the safest trails.",
        ],
        "evening": [
            "Settle into a cozy guesthouse in {location} with a hearth-cooked supper and storytelling.",
            "Join a night-time nature walk near {location} listening for endemic frogs and fireflies.",
        ],
    },
    "wildlife": {
        "locations": ["Yala", "Udawalawe", "Wilpattu", "Minneriya"],
        "morning": [
            "Embark on a sunrise jeep safari in {location} while the animals are most active.",
            "Meet your naturalist at {location} for a bird-watching walk before the crowds arrive.",
        ],
        "afternoon": [
            "Visit conservation projects near {location} and volunteer for a feeding session if available.",
            "Cool off by a reservoir close to {location} and enjoy a ranger-hosted picnic lunch.",
        ],
        "evening": [
            "Review wildlife sightings with park trackers at your lodge near {location} over a hearty curry buffet.",
            "Join a guided night safari just outside {location} to spot nocturnal species ethically.",
        ],
    },
    "adventure": {
        "locations": ["Kitulgala", "Kalpitiya", "Sigiriya", "Knuckles", "Ella", "Arugam Bay"],
        "morning": [
            "Kick off with white-water rafting in {location}, then refuel with local snacks.",
            "Climb the rock fortress near {location} before the heat rises and absorb the frescoes.",
        ],
        "afternoon": [
            "Try canyoning or waterfall abseiling in {location} with certified instructors.",
            "Go kite-surfing lessons at {location} once the afternoon winds pick up.",
        ],
        "evening": [
            "Share stories with fellow adventurers around a campfire near {location} while sampling roti and sambol.",
            "Relax those muscles with a herbal soak arranged by your homestay host in {location}.",
        ],
    },
    "wellness": {
        "locations": ["Talpe", "Weligama", "Negombo", "Colombo", "Bentota", "Mount Lavinia", "Dehiwala"],
        "morning": [
            "Begin the day with a guided meditation and slow yoga flow overlooking the ocean at {location}.",
            "Enjoy an Ayurveda consultation in {location} to tailor herbal treatments for the stay.",
        ],
        "afternoon": [
            "Indulge in a full-body Ayurvedic massage followed by detox cuisine in {location}.",
            "Join a mindful cooking class in {location} focusing on plant-based Sri Lankan dishes.",
        ],
        "evening": [
            "Stroll a quiet beach in {location} at sunset, journaling reflections over herbal tea.",
            "Close the day with a candlelit sound bath in {location} and light vegetarian dinner.",
        ],
    },
    "food": {
        "locations": ["Colombo", "Kandy", "Negombo", "Jaffna", "Galle"],
        "morning": [
            "Take a guided street-food breakfast crawl in {location}, tasting hoppers, polos, and sweet kiribath.",
            "Visit the central market in {location} to meet spice traders and sample tropical produce.",
        ],
        "afternoon": [
            "Join a cooking class in {location} learning to balance chilies, coconut, and curry leaves.",
            "Tour specialty tea and coffee bars around {location}, pairing brews with hand-made sweets.",
        ],
        "evening": [
            "Reserve a table at a mid-range restaurant in {location} that highlights regional tasting menus.",
            "Explore night markets in {location} with a guide ensuring safe, budget-friendly stops.",
        ],
    },
    "city": {
        "locations": ["Colombo", "Galle", "Kandy", "Negombo", "Jaffna", "Moratuwa"],
        "morning": [
            "Start with a heritage walk through {location} led by an architect who explains colonial influences.",
            "Sip specialty coffee in {location}'s creative quarter before browsing design studios.",
        ],
        "afternoon": [
            "Tour independent galleries and concept stores in {location}, setting aside time for souvenir shopping.",
            "Hop between urban green spaces in {location} and enjoy a relaxed cafe lunch.",
        ],
        "evening": [
            "Sample rooftop nightlife in {location} while sticking to mocktails or happy-hour deals within budget.",
            "Catch a live music session in {location} and pair it with comforting street food.",
        ],
    },
}


def _filter_locations_by_provinces(locations: list[str], provinces: list[str]) -> list[str]:
    """Filter locations to only include those in the selected provinces."""
    if not provinces:
        return locations
    
    filtered = [
        loc for loc in locations 
        if LOCATION_TO_PROVINCE.get(loc) in provinces
    ]
    
    if not filtered and provinces:
        logger.warning(f"No locations found for provinces: {provinces}. Locations checked: {locations}")
    
    # If no locations match the selected provinces, return empty list
    # The caller will handle this case
    return filtered


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


def _select_from_list(options: list[str], index: int) -> str:
    if not options:
        return ""
    return options[index % len(options)]


def _build_theme_location_map(provinces: list[str]) -> Dict[str, list[str]]:
    """Build a map of themes to locations filtered by provinces."""
    theme_map: Dict[str, list[str]] = {}
    
    for theme_name, theme_data in THEME_LIBRARY.items():
        filtered_locs = _filter_locations_by_provinces(
            theme_data["locations"], 
            provinces
        )
        theme_map[theme_name] = filtered_locs
        
        if provinces and filtered_locs:
            logger.info(f"Theme '{theme_name}': Found {len(filtered_locs)} locations in selected provinces")
    
    return theme_map


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

    inferred_themes = _infer_themes(payload.purpose, payload.preferences)
    preference_notes = _format_preference_notes(payload.preferences)
    
    # Build province-filtered location map for all themes
    theme_location_map = _build_theme_location_map(payload.provinces)
    
    # Get all available locations in selected provinces (for fallback)
    all_available_locs = []
    for locs in theme_location_map.values():
        all_available_locs.extend(locs)
    all_available_locs = list(dict.fromkeys(all_available_locs))  # Remove duplicates
    
    # Validation: Check if any locations are available
    province_mismatch = False
    if payload.provinces and not all_available_locs:
        logger.warning(f"No locations found matching selected provinces: {payload.provinces}. Using all available locations.")
        province_mismatch = True
        # Rebuild without province filtering as fallback
        theme_location_map = _build_theme_location_map([])
        for locs in theme_location_map.values():
            all_available_locs.extend(locs)
        all_available_locs = list(dict.fromkeys(all_available_locs))
    
    # Final validation: Ensure we have at least one location
    if not all_available_locs:
        logger.error("Critical error: No locations available for itinerary generation")
        raise ValueError("Unable to generate itinerary: No destinations available. Please contact support.")

    itinerary_lines: list[str] = []
    
    # Add province information at the top if provinces were selected
    if payload.provinces:
        province_text = ", ".join(payload.provinces)
        if province_mismatch:
            itinerary_lines.append(f"⚠️ Note: No destinations currently available in {province_text} province" + ("s" if len(payload.provinces) > 1 else "") + ".")
            itinerary_lines.append("Showing recommended destinations from nearby regions instead.")
        else:
            itinerary_lines.append(f"Focusing on: {province_text} province" + ("s" if len(payload.provinces) > 1 else ""))
        itinerary_lines.append("")

    # Track used locations and attractions to avoid repetition
    used_locations: list[str] = []
    location_attraction_offset: Dict[str, int] = {}  # Track which attractions we've shown for each location
    
    for day_index in range(day_total):
        theme = inferred_themes[day_index % len(inferred_themes)]
        template = THEME_LIBRARY.get(theme, THEME_LIBRARY["culture"])
        
        # Get province-filtered locations for this theme
        available_locations = theme_location_map.get(theme, [])
        
        # If no locations for this theme, try to find a theme that has locations
        if not available_locations:
            logger.info(f"Day {day_index + 1}: No locations for theme '{theme}', searching for fallback theme")
            for fallback_theme in inferred_themes:
                fallback_locs = theme_location_map.get(fallback_theme, [])
                if fallback_locs:
                    logger.info(f"Day {day_index + 1}: Using fallback theme '{fallback_theme}' with {len(fallback_locs)} locations")
                    theme = fallback_theme
                    template = THEME_LIBRARY.get(theme, THEME_LIBRARY["culture"])
                    available_locations = fallback_locs
                    break
        
        # If still no locations, use all available locations from selected provinces
        if not available_locations and all_available_locs:
            available_locations = all_available_locs
        
        # Absolute fallback if no provinces were selected or no matches
        if not available_locations:
            logger.warning(f"Day {day_index + 1}: Using template default locations for theme '{theme}'")
            available_locations = template["locations"]
        
        # Filter out already used locations
        unused_locations = [loc for loc in available_locations if loc not in used_locations]
        logger.debug(f"Day {day_index + 1}: {len(unused_locations)} unused locations available")
        
        # If all locations have been used, reset and start fresh rotation
        if not unused_locations:
            used_locations = []
            unused_locations = available_locations
        
        # Select location by cycling through unused locations sequentially
        location_index = day_index % len(unused_locations)
        location = unused_locations[location_index]
        used_locations.append(location)
        
        # Get location details
        location_data = LOCATION_ATTRACTIONS.get(location, {})
        district = location_data.get("district", "District")
        attractions = location_data.get("attractions", [])

        if start_date:
            day_label = (start_date + timedelta(days=day_index)).strftime("%A, %B %d")
            heading = f"Day {day_index + 1} – ({day_label}) {district} focus – {location}"
        else:
            heading = f"Day {day_index + 1} – {district} focus – {location}"

        itinerary_lines.append(heading)
        itinerary_lines.append("")
        
        # Add attractions for this location - limit to 2-3 attractions to avoid overwhelming
        if attractions:
            # Get the offset for this location (how many attractions we've already shown)
            offset = location_attraction_offset.get(location, 0)
            
            # Select 2-3 unique attractions starting from offset
            num_attractions = min(3, len(attractions))
            selected_attractions = []
            
            for i in range(num_attractions):
                idx = (offset + i) % len(attractions)
                selected_attractions.append(attractions[idx])
            
            # Update offset for next time this location is visited
            location_attraction_offset[location] = (offset + num_attractions) % len(attractions)
            
            for attraction in selected_attractions:
                itinerary_lines.append(f"• {attraction}")
        else:
            # Fallback to generic descriptions if no specific attractions
            morning = _select_from_list(template["morning"], day_index).format(location=location)
            afternoon = _select_from_list(template["afternoon"], day_index).format(location=location)
            evening = _select_from_list(template["evening"], day_index).format(location=location)
            itinerary_lines.append(f"Morning: {morning}")
            itinerary_lines.append(f"Afternoon: {afternoon}")
            itinerary_lines.append(f"Evening: {evening}")
        
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

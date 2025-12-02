from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import math

app = FastAPI(title="Ceylon Voyage API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Location(BaseModel):
    lat: float
    lng: float

class Destination(BaseModel):
    id: str
    name: str
    location: Location
    description: Optional[str] = None

class RouteOptimizationRequest(BaseModel):
    destinations: List[Destination]
    optimize: bool = True
    use_traffic: bool = True  # Enable live traffic data
    traffic_model: str = "best_guess"  # Options: best_guess, pessimistic, optimistic

class RouteOptimizationResponse(BaseModel):
    optimized_order: List[str]
    total_distance: str
    total_duration: str
    routes: List[dict]

@app.get("/")
def read_root():
    return {"message": "Ceylon Voyage API"}

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def reorder_by_nearest_neighbor(destinations: List[Destination]) -> List[Destination]:
    """
    Reorder destinations using nearest neighbor algorithm.
    Keeps first destination (user location) as start, then visits nearest unvisited destination.
    """
    if len(destinations) <= 2:
        return destinations
    
    # Start with user location
    ordered = [destinations[0]]
    remaining = destinations[1:].copy()
    
    current = destinations[0]
    
    # Visit nearest neighbor until all destinations are visited
    while remaining:
        nearest = None
        min_distance = float('inf')
        
        for dest in remaining:
            distance = calculate_distance(
                current.location.lat, current.location.lng,
                dest.location.lat, dest.location.lng
            )
            if distance < min_distance:
                min_distance = distance
                nearest = dest
        
        if nearest:
            ordered.append(nearest)
            remaining.remove(nearest)
            current = nearest
    
    return ordered

@app.post("/api/optimize-route", response_model=RouteOptimizationResponse)
async def optimize_route(request: RouteOptimizationRequest):
    """
    Optimize the route between destinations using Google Maps Directions API.
    If first destination is user location, find closest destination first.
    """
    if len(request.destinations) < 2:
        raise HTTPException(status_code=400, detail="At least 2 destinations are required")
    
    # Check if first destination is user's current location
    is_user_location_start = request.destinations[0].id == "user-location"
    
    # Reorder destinations if starting from user location
    if is_user_location_start and len(request.destinations) > 2:
        reordered = reorder_by_nearest_neighbor(request.destinations)
        request.destinations = reordered
    
    # Get Google Maps API key from environment variable
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    if not api_key:
        # For demo purposes, return mock optimized route
        return create_mock_optimized_route(request.destinations)
    
    try:
        # Use Google Maps Directions API with waypoint optimization
        origin = request.destinations[0]
        destination = request.destinations[-1]
        waypoints = request.destinations[1:-1] if len(request.destinations) > 2 else []
        
        # Build waypoints string
        waypoints_str = "|".join([f"{w.location.lat},{w.location.lng}" for w in waypoints])
        
        url = "https://maps.googleapis.com/maps/api/directions/json"
        params = {
            "origin": f"{origin.location.lat},{origin.location.lng}",
            "destination": f"{destination.location.lat},{destination.location.lng}",
            "key": api_key,
        }
        
        # Add traffic-related parameters
        if request.use_traffic:
            params["departure_time"] = "now"  # Use current time for live traffic
            params["traffic_model"] = request.traffic_model  # best_guess, pessimistic, or optimistic
        
        if waypoints_str:
            # Only optimize waypoints, not the start/end if user location is start
            if is_user_location_start:
                params["waypoints"] = waypoints_str
            else:
                params["waypoints"] = f"optimize:true|{waypoints_str}" if request.optimize else waypoints_str
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
        
        if data["status"] != "OK":
            return create_mock_optimized_route(request.destinations)
        
        # Parse the optimized route
        route = data["routes"][0]
        waypoint_order = route.get("waypoint_order", [])

        # Build optimized order
        # If starting from user location OR optimize=false OR API did not return waypoint_order,
        # keep the waypoints in the order we sent (nearest-neighbor already applied when needed).
        if is_user_location_start or (not request.optimize) or (not waypoint_order):
            optimized_order = [origin.id] + [w.id for w in waypoints] + [destination.id]
        else:
            optimized_order = [origin.id] + [waypoints[idx].id for idx in waypoint_order] + [destination.id]
        
        # Extract route information
        legs = route["legs"]
        total_distance = sum(leg["distance"]["value"] for leg in legs)
        
        # Use duration_in_traffic if available (when traffic data is used), otherwise use duration
        if request.use_traffic and "duration_in_traffic" in legs[0]:
            total_duration = sum(leg["duration_in_traffic"]["value"] for leg in legs)
            duration_key = "duration_in_traffic"
        else:
            total_duration = sum(leg["duration"]["value"] for leg in legs)
            duration_key = "duration"
        
        # Format routes for frontend
        routes = []
        for leg in legs:
            route_info = {
                "start_location": leg["start_location"],
                "end_location": leg["end_location"],
                "distance": leg["distance"]["text"],
                "duration": leg[duration_key]["text"],
                "polyline": leg.get("overview_polyline", {}).get("points", "")
            }
            
            # Add traffic info if available
            if "duration_in_traffic" in leg:
                route_info["duration_in_traffic"] = leg["duration_in_traffic"]["text"]
                route_info["traffic_delay"] = leg["duration_in_traffic"]["value"] - leg["duration"]["value"]
            
            routes.append(route_info)
        
        return RouteOptimizationResponse(
            optimized_order=optimized_order,
            total_distance=f"{total_distance / 1000:.2f} km",
            total_duration=f"{total_duration / 3600:.2f} hours",
            routes=routes
        )
        
    except Exception as e:
        print(f"Error optimizing route: {e}")
        return create_mock_optimized_route(request.destinations)

def create_mock_optimized_route(destinations: List[Destination]) -> RouteOptimizationResponse:
    """
    Create a mock optimized route when Google Maps API is not available.
    Uses nearest neighbor algorithm starting from first destination.
    """
    # Check if starting from user location
    is_user_location_start = destinations[0].id == "user-location"
    
    if is_user_location_start and len(destinations) > 2:
        # Reorder using nearest neighbor
        destinations = reorder_by_nearest_neighbor(destinations)
    
    optimized_order = [dest.id for dest in destinations]
    
    # Calculate mock distances
    routes = []
    total_distance = 0
    total_duration = 0
    
    for i in range(len(destinations) - 1):
        start = destinations[i]
        end = destinations[i + 1]
        
        # Haversine distance calculation
        distance = calculate_distance(
            start.location.lat, start.location.lng,
            end.location.lat, end.location.lng
        )
        
        total_distance += distance
        duration = distance / 50  # Assume 50 km/h average speed
        total_duration += duration
        
        routes.append({
            "start_location": {"lat": start.location.lat, "lng": start.location.lng},
            "end_location": {"lat": end.location.lat, "lng": end.location.lng},
            "distance": f"{distance:.2f} km",
            "duration": f"{duration * 60:.0f} min",
            "polyline": ""
        })
    
    return RouteOptimizationResponse(
        optimized_order=optimized_order,
        total_distance=f"{total_distance:.2f} km",
        total_duration=f"{total_duration:.2f} hours",
        routes=routes
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# Import required modules
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure the current directory is in sys.path for direct pytest runs
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import FastAPI app and models
from main import app
from models import OptimizeRequest, OptimizeResponse, TrafficRouteRequest, TrafficRouteResponse

# Create a test client using the FastAPI app
client = TestClient(app)


# Test the /health endpoint for service status
def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    # The response should contain status 'ok'
    assert response.json()["status"] == "ok"


# Test /optimize endpoint with minimal valid itinerary (2 points)
def test_optimize_minimal():
    payload = {
        "itinerary": [
            {"id": "1", "name": "Kandy", "location": {"lat": 7.2906, "lng": 80.6337}},
            {"id": "2", "name": "Colombo", "location": {"lat": 6.9271, "lng": 79.8612}},
        ],
        "metric": "haversine",
        "optimize_for": "distance",
        "return_to_start": False,
        "try_all_starts": False,
        "distance_weight": 1.0,
        "time_weight": 1.0
    }
    response = client.post("/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Check for optimized order and correct points
    assert "optimized_order" in data
    assert set(data["optimized_order"]) == {0, 1}
    assert data["total_distance_km"] > 0
    # The first point should be Kandy
    assert data["optimized_itinerary"][0]["location"]["lat"] == 7.2906


# Test /optimize endpoint with return_to_start enabled
def test_optimize_return_to_start():
    payload = {
        "itinerary": [
            {"id": "1", "name": "Kandy", "location": {"lat": 7.2906, "lng": 80.6337}},
            {"id": "2", "name": "Colombo", "location": {"lat": 6.9271, "lng": 79.8612}},
            {"id": "3", "name": "Galle", "location": {"lat": 6.0535, "lng": 80.2210}},
        ],
        "metric": "haversine",
        "optimize_for": "distance",
        "return_to_start": True,
        "try_all_starts": False,
        "distance_weight": 1.0,
        "time_weight": 1.0
    }
    response = client.post("/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    # The optimized order may not end at 0, but the route will return to start in the segments
    assert set(data["optimized_order"]) == {0, 1, 2}
    assert data["total_distance_km"] > 0


# Test /optimize endpoint with an invalid metric (should fail)
def test_optimize_invalid_metric():
    payload = {
        "itinerary": [
            {"id": "1", "name": "Kandy", "location": {"lat": 7.2906, "lng": 80.6337}},
            {"id": "2", "name": "Colombo", "location": {"lat": 6.9271, "lng": 79.8612}},
        ],
        "metric": "invalid_metric",
        "optimize_for": "distance",
        "return_to_start": False,
        "try_all_starts": False,
        "distance_weight": 1.0,
        "time_weight": 1.0
    }
    response = client.post("/optimize", json=payload)
    # Should fail with 422 due to pattern validation on metric
    assert response.status_code == 422


# Test /traffic-route endpoint with invalid route (should error)
def test_traffic_route_invalid():
    payload = {
        "origin": {"lat": 0, "lng": 0},
        "destination": {"lat": 0, "lng": 0},
        "intermediates": [],
        "travel_mode": "DRIVE"
    }
    response = client.post("/traffic-route", json=payload)
    # Should error due to invalid route (Google API not called in test)
    assert response.status_code in (400, 422)

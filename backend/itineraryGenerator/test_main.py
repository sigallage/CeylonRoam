# Import required modules
import pytest
from fastapi.testclient import TestClient
from main import app

# Create a test client using the FastAPI app
client = TestClient(app)


# Test the /health endpoint for service status
def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    # The response should contain status 'ok'
    assert response.json()["status"] == "ok"


# Test the /api/health endpoint for API health
def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    # The response should contain status 'ok'
    assert response.json()["status"] == "ok"


# Test the /api/meta endpoint for metadata
def test_meta_endpoint():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    # Check for required metadata fields
    assert "name" in data
    assert data["name"] == "TRAVEL-AI"
    assert "tagline" in data
    assert "message" in data
    assert "status" in data
    assert data["status"] == "ready"
    assert "timestamp" in data


# Test /api/generate with minimal required fields
def test_generate_trip_plan_minimal():
    payload = {
        "purpose": ["beach"],
        "preferences": [],
        "provinces": [],
        "start_date": None,
        "end_date": None,
        "gender": "male",
        "traveling_with": "solo",
        "budget_lkr": 10000
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Check for required fields in the response
    assert "summary" in data
    assert "itinerary" in data
    assert "generated_at" in data
    assert "metadata" in data
    # If no start_date/end_date, day_count may be 0 (see backend logic)
    assert "day_count" in data["metadata"]


# Test /api/generate with preferences and date range
def test_generate_trip_plan_with_preferences():
    payload = {
        "purpose": ["culture", "nature"],
        "preferences": ["vegetarian", "photography"],
        "provinces": ["Central"],
        "start_date": "2024-07-01",
        "end_date": "2024-07-03",
        "gender": "female",
        "traveling_with": "family",
        "budget_lkr": "25000"
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Check for required fields in the response
    assert "summary" in data
    assert "itinerary" in data
    assert "generated_at" in data
    assert "metadata" in data
    # The day_count should match the date range
    assert data["metadata"]["day_count"] == 3
    # The itinerary should reflect preferences
    assert "vegetarian" in data["itinerary"] or "photography" in data["itinerary"]

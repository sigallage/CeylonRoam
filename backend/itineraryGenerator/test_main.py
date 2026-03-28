import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_meta_endpoint():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert data["name"] == "TRAVEL-AI"
    assert "tagline" in data
    assert "message" in data
    assert "status" in data
    assert data["status"] == "ready"
    assert "timestamp" in data

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
    assert "summary" in data
    assert "itinerary" in data
    assert "generated_at" in data
    assert "metadata" in data
    # If no start_date/end_date, day_count may be 0 (see backend logic)
    assert "day_count" in data["metadata"]

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
    assert "summary" in data
    assert "itinerary" in data
    assert "generated_at" in data
    assert "metadata" in data
    assert data["metadata"]["day_count"] == 3
    assert "vegetarian" in data["itinerary"] or "photography" in data["itinerary"]

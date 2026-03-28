
# Import required modules
import pytest
from fastapi.testclient import TestClient
from main import app

# Create a test client using the FastAPI app
client = TestClient(app)


# Test the root endpoint for API status and model info
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    # Check for key fields in the root response
    assert "message" in data
    assert "whisper_loaded" in data
    assert "translation_loaded" in data
    assert "device" in data
    assert "ffmpeg_available" in data


# Test the /health endpoint for service health info
def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # Check for health status and model info
    assert data["ok"] is True
    assert "whisper_loaded" in data
    assert "translation_loaded" in data
    assert "ffmpeg_available" in data


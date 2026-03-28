import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    """Test the root endpoint returns API status and model info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "whisper_loaded" in data
    assert "translation_loaded" in data
    assert "device" in data
    assert "ffmpeg_available" in data

def test_health():
    """Test the health endpoint returns service health info."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "whisper_loaded" in data
    assert "translation_loaded" in data
    assert "ffmpeg_available" in data

# Note: For /voice/translate and /text/translate, full tests require models and ffmpeg.
# You can add more tests with mocks or sample files if needed.

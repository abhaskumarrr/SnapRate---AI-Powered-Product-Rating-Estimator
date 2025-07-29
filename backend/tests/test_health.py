import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json

from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    """Test that health check endpoint returns correct response"""
    response = client.get("/healthcheck")
    
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "timestamp" in data
    
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    
    # Verify timestamp is valid ISO format
    try:
        datetime.fromisoformat(data["timestamp"])
    except ValueError:
        pytest.fail("Timestamp is not in valid ISO format")

def test_health_check_response_structure():
    """Test that health check response has correct structure"""
    response = client.get("/healthcheck")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    
    data = response.json()
    
    # Check required fields exist
    required_fields = ["status", "version", "timestamp"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    # Check field types
    assert isinstance(data["status"], str)
    assert isinstance(data["version"], str)
    assert isinstance(data["timestamp"], str)

def test_root_endpoint():
    """Test that root endpoint returns welcome message"""
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "SnapRate API is running"
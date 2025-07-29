"""
Tests for the prediction endpoint.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from PIL import Image
import io
import json

from app.main import app
from app.models import PredictionResponse
from app.prediction_service import EnsemblePredictor

client = TestClient(app)


class TestPredictionEndpoint:
    """Test cases for prediction endpoint."""
    
    def create_test_image_file(self, format='PNG', size=(800, 600)):
        """Create a test image file for upload testing."""
        image = Image.new('RGB', size, color='red')
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format=format)
        img_byte_arr.seek(0)
        return img_byte_arr
    
    def test_predict_with_title_only(self):
        """Test prediction endpoint with title only."""
        response = client.post(
            "/api/v1/predict",
            data={"title": "Premium Wireless Bluetooth Headphones"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "rating" in data
        assert "confidence" in data
        assert "explanation" in data
        assert 1.0 <= data["rating"] <= 5.0
        assert 0.0 <= data["confidence"] <= 100.0
        assert len(data["explanation"]) > 10
    
    def test_predict_with_image_upload(self):
        """Test prediction endpoint with image upload."""
        image_file = self.create_test_image_file()
        
        response = client.post(
            "/api/v1/predict",
            data={"title": "Premium Wireless Bluetooth Headphones"},
            files={"image": ("test.png", image_file, "image/png")}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "rating" in data
        assert "confidence" in data
        assert "explanation" in data
        assert 1.0 <= data["rating"] <= 5.0
        assert 0.0 <= data["confidence"] <= 100.0
    
    def test_predict_with_image_url(self):
        """Test prediction endpoint with image URL."""
        with patch('app.prediction_service.requests.get') as mock_get:
            # Mock successful image download
            test_image = Image.new('RGB', (800, 600), color='blue')
            img_byte_arr = io.BytesIO()
            test_image.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            mock_response = Mock()
            mock_response.content = img_byte_arr.getvalue()
            mock_response.raise_for_status.return_value = None
            mock_get.return_value = mock_response
            
            response = client.post(
                "/api/v1/predict",
                data={
                    "title": "Premium Wireless Bluetooth Headphones",
                    "image_url": "https://example.com/image.jpg"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert "rating" in data
            assert "confidence" in data
            assert "explanation" in data
    
    def test_predict_empty_title(self):
        """Test prediction endpoint with empty title."""
        response = client.post(
            "/api/v1/predict",
            data={"title": ""}
        )
        
        assert response.status_code == 400
        assert "Title is required" in response.json()["detail"]
    
    def test_predict_whitespace_title(self):
        """Test prediction endpoint with whitespace-only title."""
        response = client.post(
            "/api/v1/predict",
            data={"title": "   "}
        )
        
        assert response.status_code == 400
        assert "Title is required" in response.json()["detail"]
    
    def test_predict_both_image_and_url(self):
        """Test prediction endpoint with both image file and URL."""
        image_file = self.create_test_image_file()
        
        response = client.post(
            "/api/v1/predict",
            data={
                "title": "Premium Wireless Bluetooth Headphones",
                "image_url": "https://example.com/image.jpg"
            },
            files={"image": ("test.png", image_file, "image/png")}
        )
        
        assert response.status_code == 400
        assert "either an image file or image URL" in response.json()["detail"]
    
    def test_predict_invalid_mode(self):
        """Test prediction endpoint with invalid mode."""
        response = client.post(
            "/api/v1/predict",
            data={
                "title": "Premium Wireless Bluetooth Headphones",
                "mode": "invalid_mode"
            }
        )
        
        assert response.status_code == 400
        assert "Invalid mode" in response.json()["detail"]
    
    def test_predict_different_modes(self):
        """Test prediction endpoint with different valid modes."""
        valid_modes = ["auto", "rule_based", "ai", "ensemble"]
        
        for mode in valid_modes:
            response = client.post(
                "/api/v1/predict",
                data={
                    "title": "Premium Wireless Bluetooth Headphones",
                    "mode": mode
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "rating" in data
            assert "confidence" in data
            assert "explanation" in data
    
    def test_predict_large_image(self):
        """Test prediction endpoint with oversized image."""
        # Create a large image (this might be slow, so we'll mock the validation)
        with patch('app.input_processor.InputProcessor.process_uploaded_image') as mock_process:
            mock_process.side_effect = ValueError("File size exceeds maximum allowed size")
            
            image_file = self.create_test_image_file()
            
            response = client.post(
                "/api/v1/predict",
                data={"title": "Premium Wireless Bluetooth Headphones"},
                files={"image": ("large.png", image_file, "image/png")}
            )
            
            assert response.status_code == 400
            assert "File size" in response.json()["detail"] or "exceeds" in response.json()["detail"]
    
    def test_predict_invalid_image_format(self):
        """Test prediction endpoint with invalid image format."""
        # Create a text file instead of image
        text_file = io.BytesIO(b"This is not an image")
        
        response = client.post(
            "/api/v1/predict",
            data={"title": "Premium Wireless Bluetooth Headphones"},
            files={"image": ("test.txt", text_file, "text/plain")}
        )
        
        assert response.status_code == 400
    
    def test_predict_long_title(self):
        """Test prediction endpoint with very long title."""
        long_title = "A" * 250  # Exceeds 200 character limit
        
        response = client.post(
            "/api/v1/predict",
            data={"title": long_title}
        )
        
        assert response.status_code == 400
        assert "exceed" in response.json()["detail"] or "long" in response.json()["detail"]
    
    def test_predict_short_title(self):
        """Test prediction endpoint with very short title."""
        response = client.post(
            "/api/v1/predict",
            data={"title": "AB"}  # Less than 3 characters
        )
        
        assert response.status_code == 400
        assert "at least 3 characters" in response.json()["detail"]
    
    @patch('app.prediction_service.EnsemblePredictor.predict')
    def test_predict_service_error(self, mock_predict):
        """Test prediction endpoint when service fails."""
        mock_predict.side_effect = Exception("Service error")
        
        response = client.post(
            "/api/v1/predict",
            data={"title": "Premium Wireless Bluetooth Headphones"}
        )
        
        assert response.status_code == 500
        assert "Failed to generate prediction" in response.json()["detail"]
    
    def test_get_prediction_modes(self):
        """Test get prediction modes endpoint."""
        response = client.get("/api/v1/predict/modes")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "modes" in data
        assert "default" in data
        assert "ai_available" in data
        
        modes = data["modes"]
        assert "auto" in modes
        assert "rule_based" in modes
        assert "ai" in modes
        assert "ensemble" in modes
        
        # Check mode structure
        for mode_name, mode_info in modes.items():
            assert "description" in mode_info
            assert "recommended" in mode_info
    
    def test_prediction_health(self):
        """Test prediction health endpoint."""
        response = client.get("/api/v1/predict/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "services" in data
        assert "ai_mode_available" in data
        assert "timestamp" in data
        
        services = data["services"]
        assert "rule_based_predictor" in services
        assert "ai_predictor" in services
        assert "ensemble_predictor" in services
    
    @patch('app.routers.prediction.predictor')
    def test_prediction_health_unhealthy(self, mock_predictor):
        """Test prediction health endpoint when service is unhealthy."""
        mock_predictor.rule_based_predictor.predict.side_effect = Exception("Service error")
        
        response = client.get("/api/v1/predict/health")
        
        # Should return 500 when health check fails
        assert response.status_code == 500
        data = response.json()
        assert data["status"] == "unhealthy"
    
    def test_predict_with_special_characters_title(self):
        """Test prediction endpoint with special characters in title."""
        special_title = "Premium Headphones™ with Bluetooth® 5.0 & Noise-Cancellation!"
        
        response = client.post(
            "/api/v1/predict",
            data={"title": special_title}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "rating" in data
        assert "confidence" in data
        assert "explanation" in data
    
    def test_predict_with_unicode_title(self):
        """Test prediction endpoint with unicode characters in title."""
        unicode_title = "Premium Headphones 高品质耳机 Écouteurs de qualité"
        
        response = client.post(
            "/api/v1/predict",
            data={"title": unicode_title}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "rating" in data
        assert "confidence" in data
        assert "explanation" in data
    
    def test_predict_response_format(self):
        """Test that prediction response matches expected format."""
        response = client.post(
            "/api/v1/predict",
            data={"title": "Premium Wireless Bluetooth Headphones"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert isinstance(data["rating"], float)
        assert isinstance(data["confidence"], float)
        assert isinstance(data["explanation"], str)
        
        # Check value ranges
        assert 1.0 <= data["rating"] <= 5.0
        assert 0.0 <= data["confidence"] <= 100.0
        assert len(data["explanation"]) > 0
        
        # Check decimal precision
        assert len(str(data["rating"]).split('.')[-1]) <= 1  # Max 1 decimal place
        assert len(str(data["confidence"]).split('.')[-1]) <= 1  # Max 1 decimal place
    
    def test_predict_consistency(self):
        """Test that similar requests produce consistent results."""
        title = "Premium Wireless Bluetooth Headphones"
        
        # Make multiple requests
        responses = []
        for _ in range(3):
            response = client.post(
                "/api/v1/predict",
                data={"title": title, "mode": "rule_based"}  # Use rule_based for consistency
            )
            assert response.status_code == 200
            responses.append(response.json())
        
        # Check that ratings are reasonably consistent
        ratings = [r["rating"] for r in responses]
        rating_range = max(ratings) - min(ratings)
        assert rating_range <= 1.0  # Allow some variation due to randomness
    
    def test_predict_rate_limiting_disabled(self):
        """Test that prediction endpoint works without rate limiting."""
        # Since we removed rate limiting dependency, just test normal operation
        response = client.post(
            "/api/v1/predict",
            data={"title": "Premium Wireless Bluetooth Headphones"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "rating" in data


class TestPredictionEndpointIntegration:
    """Integration tests for prediction endpoint."""
    
    def test_full_prediction_workflow(self):
        """Test complete prediction workflow."""
        # 1. Check health
        health_response = client.get("/api/v1/predict/health")
        assert health_response.status_code == 200
        
        # 2. Get available modes
        modes_response = client.get("/api/v1/predict/modes")
        assert modes_response.status_code == 200
        modes_data = modes_response.json()
        
        # 3. Make prediction with default mode
        prediction_response = client.post(
            "/api/v1/predict",
            data={"title": "Apple iPhone 15 Pro Max 256GB"}
        )
        assert prediction_response.status_code == 200
        prediction_data = prediction_response.json()
        
        # Verify prediction quality
        assert prediction_data["rating"] > 3.0  # Should be above average for premium product
        assert prediction_data["confidence"] >= 60.0  # Should have reasonable confidence
        assert "brand" in prediction_data["explanation"].lower() or "product" in prediction_data["explanation"].lower()
    
    def test_different_product_types(self):
        """Test prediction with different types of products."""
        test_products = [
            ("Apple iPhone 15 Pro Max", 4.0),  # Premium product, expect high rating
            ("Cheap plastic phone case", 3.0),  # Budget product, expect lower rating
            ("Professional DSLR Camera Canon EOS", 4.0),  # Professional product
            ("Generic USB cable", 3.0),  # Generic product
        ]
        
        for title, expected_min_rating in test_products:
            response = client.post(
                "/api/v1/predict",
                data={"title": title}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Check that rating makes sense for product type
            if "premium" in title.lower() or "pro" in title.lower() or "professional" in title.lower():
                assert data["rating"] >= expected_min_rating - 0.5  # Allow some tolerance
            
            assert 1.0 <= data["rating"] <= 5.0
            assert 0.0 <= data["confidence"] <= 100.0
import pytest
from pydantic import ValidationError
from app.models import (
    PredictionRequest,
    ImageUploadRequest,
    PredictionResponse,
    ErrorResponse,
    ValidationErrorResponse,
    ImageValidationModel,
    HealthResponse
)


class TestPredictionRequest:
    """Test cases for PredictionRequest model"""
    
    def test_valid_prediction_request(self):
        """Test valid prediction request creation"""
        request = PredictionRequest(
            title="Premium Wireless Headphones",
            image_url="https://example.com/image.jpg"
        )
        assert request.title == "Premium Wireless Headphones"
        assert str(request.image_url) == "https://example.com/image.jpg"
    
    def test_valid_prediction_request_without_url(self):
        """Test valid prediction request without image URL"""
        request = PredictionRequest(title="Test Product")
        assert request.title == "Test Product"
        assert request.image_url is None
    
    def test_title_validation_empty(self):
        """Test title validation with empty string"""
        with pytest.raises(ValidationError) as exc_info:
            PredictionRequest(title="")
        
        errors = exc_info.value.errors()
        assert any("at least 1 character" in str(error) for error in errors)
    
    def test_title_validation_whitespace_only(self):
        """Test title validation with whitespace only"""
        with pytest.raises(ValidationError) as exc_info:
            PredictionRequest(title="   ")
        
        errors = exc_info.value.errors()
        assert any("Title cannot be empty" in str(error) for error in errors)
    
    def test_title_validation_too_short(self):
        """Test title validation with too short title"""
        with pytest.raises(ValidationError) as exc_info:
            PredictionRequest(title="ab")
        
        errors = exc_info.value.errors()
        assert any("at least 3 characters" in str(error) for error in errors)
    
    def test_title_validation_too_long(self):
        """Test title validation with too long title"""
        long_title = "a" * 201
        with pytest.raises(ValidationError) as exc_info:
            PredictionRequest(title=long_title)
        
        errors = exc_info.value.errors()
        assert any("at most 200 characters" in str(error) for error in errors)
    
    def test_title_whitespace_normalization(self):
        """Test title whitespace normalization"""
        request = PredictionRequest(title="  Multiple   spaces   here  ")
        assert request.title == "Multiple spaces here"
    
    def test_invalid_image_url(self):
        """Test invalid image URL"""
        with pytest.raises(ValidationError) as exc_info:
            PredictionRequest(title="Test Product", image_url="not-a-url")
        
        errors = exc_info.value.errors()
        assert any("valid URL" in str(error) for error in errors)


class TestImageUploadRequest:
    """Test cases for ImageUploadRequest model"""
    
    def test_valid_image_upload_request(self):
        """Test valid image upload request creation"""
        request = ImageUploadRequest(title="Test Product")
        assert request.title == "Test Product"
    
    def test_title_validation_same_as_prediction_request(self):
        """Test that title validation works the same as PredictionRequest"""
        with pytest.raises(ValidationError):
            ImageUploadRequest(title="")
        
        with pytest.raises(ValidationError):
            ImageUploadRequest(title="ab")
        
        request = ImageUploadRequest(title="  Valid   Title  ")
        assert request.title == "Valid Title"


class TestPredictionResponse:
    """Test cases for PredictionResponse model"""
    
    def test_valid_prediction_response(self):
        """Test valid prediction response creation"""
        response = PredictionResponse(
            rating=4.2,
            confidence=85.5,
            explanation="Good product with appealing features"
        )
        assert response.rating == 4.2
        assert response.confidence == 85.5
        assert response.explanation == "Good product with appealing features"
    
    def test_rating_validation_bounds(self):
        """Test rating validation bounds"""
        # Test lower bound
        with pytest.raises(ValidationError) as exc_info:
            PredictionResponse(
                rating=0.5,
                confidence=50.0,
                explanation="Test"
            )
        errors = exc_info.value.errors()
        assert any("greater than or equal to 1" in str(error) for error in errors)
        
        # Test upper bound
        with pytest.raises(ValidationError) as exc_info:
            PredictionResponse(
                rating=5.5,
                confidence=50.0,
                explanation="Test"
            )
        errors = exc_info.value.errors()
        assert any("less than or equal to 5" in str(error) for error in errors)
    
    def test_confidence_validation_bounds(self):
        """Test confidence validation bounds"""
        # Test lower bound
        with pytest.raises(ValidationError) as exc_info:
            PredictionResponse(
                rating=3.0,
                confidence=-5.0,
                explanation="Test"
            )
        errors = exc_info.value.errors()
        assert any("greater than or equal to 0" in str(error) for error in errors)
        
        # Test upper bound
        with pytest.raises(ValidationError) as exc_info:
            PredictionResponse(
                rating=3.0,
                confidence=105.0,
                explanation="Test"
            )
        errors = exc_info.value.errors()
        assert any("less than or equal to 100" in str(error) for error in errors)
    
    def test_rating_rounding(self):
        """Test rating rounding to 1 decimal place"""
        response = PredictionResponse(
            rating=4.2567,
            confidence=85.0,
            explanation="Test"
        )
        assert response.rating == 4.3
    
    def test_confidence_rounding(self):
        """Test confidence rounding to 1 decimal place"""
        response = PredictionResponse(
            rating=4.0,
            confidence=85.6789,
            explanation="Test"
        )
        assert response.confidence == 85.7
    
    def test_explanation_validation_empty(self):
        """Test explanation validation with empty string"""
        with pytest.raises(ValidationError) as exc_info:
            PredictionResponse(
                rating=4.0,
                confidence=85.0,
                explanation=""
            )
        errors = exc_info.value.errors()
        assert any("Explanation cannot be empty" in str(error) for error in errors)
    
    def test_explanation_whitespace_trimming(self):
        """Test explanation whitespace trimming"""
        response = PredictionResponse(
            rating=4.0,
            confidence=85.0,
            explanation="  Good explanation  "
        )
        assert response.explanation == "Good explanation"


class TestErrorResponse:
    """Test cases for ErrorResponse model"""
    
    def test_valid_error_response(self):
        """Test valid error response creation"""
        response = ErrorResponse(
            status_code=400,
            message="Bad request",
            details={"field": "title", "error": "Invalid title"}
        )
        assert response.status_code == 400
        assert response.message == "Bad request"
        assert response.details == {"field": "title", "error": "Invalid title"}
    
    def test_valid_error_response_without_details(self):
        """Test valid error response without details"""
        response = ErrorResponse(
            status_code=500,
            message="Internal server error"
        )
        assert response.status_code == 500
        assert response.message == "Internal server error"
        assert response.details is None
    
    def test_status_code_validation_bounds(self):
        """Test status code validation bounds"""
        # Test lower bound
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse(status_code=99, message="Test")
        errors = exc_info.value.errors()
        assert any("valid HTTP status code" in str(error) for error in errors)
        
        # Test upper bound
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse(status_code=600, message="Test")
        errors = exc_info.value.errors()
        assert any("valid HTTP status code" in str(error) for error in errors)
    
    def test_message_validation_empty(self):
        """Test message validation with empty string"""
        with pytest.raises(ValidationError) as exc_info:
            ErrorResponse(status_code=400, message="")
        errors = exc_info.value.errors()
        assert any("Error message cannot be empty" in str(error) for error in errors)
    
    def test_message_whitespace_trimming(self):
        """Test message whitespace trimming"""
        response = ErrorResponse(
            status_code=400,
            message="  Error message  "
        )
        assert response.message == "Error message"


class TestValidationErrorResponse:
    """Test cases for ValidationErrorResponse model"""
    
    def test_valid_validation_error_response(self):
        """Test valid validation error response creation"""
        response = ValidationErrorResponse(
            errors=[
                {
                    "loc": ["title"],
                    "msg": "Title too short",
                    "type": "value_error"
                }
            ]
        )
        assert response.status_code == 422
        assert response.message == "Validation error"
        assert len(response.errors) == 1
        assert response.errors[0]["loc"] == ["title"]


class TestImageValidationModel:
    """Test cases for ImageValidationModel model"""
    
    def test_default_image_validation_model(self):
        """Test default image validation model creation"""
        model = ImageValidationModel()
        assert model.max_file_size == 5 * 1024 * 1024  # 5MB
        assert model.allowed_formats == ["image/jpeg", "image/png", "image/webp"]
        assert model.min_width == 100
        assert model.min_height == 100
        assert model.max_width == 4000
        assert model.max_height == 4000
    
    def test_custom_image_validation_model(self):
        """Test custom image validation model creation"""
        model = ImageValidationModel(
            max_file_size=10 * 1024 * 1024,
            allowed_formats=["image/jpeg"],
            min_width=200,
            min_height=200
        )
        assert model.max_file_size == 10 * 1024 * 1024
        assert model.allowed_formats == ["image/jpeg"]
        assert model.min_width == 200
        assert model.min_height == 200


class TestHealthResponse:
    """Test cases for HealthResponse model"""
    
    def test_valid_health_response(self):
        """Test valid health response creation"""
        response = HealthResponse(
            status="healthy",
            version="1.0.0",
            timestamp="2024-01-15T10:30:00Z"
        )
        assert response.status == "healthy"
        assert response.version == "1.0.0"
        assert response.timestamp == "2024-01-15T10:30:00Z"
    
    def test_status_validation_valid_values(self):
        """Test status validation with valid values"""
        for status in ["healthy", "unhealthy", "degraded"]:
            response = HealthResponse(
                status=status,
                version="1.0.0",
                timestamp="2024-01-15T10:30:00Z"
            )
            assert response.status == status
    
    def test_status_validation_invalid_value(self):
        """Test status validation with invalid value"""
        with pytest.raises(ValidationError) as exc_info:
            HealthResponse(
                status="invalid",
                version="1.0.0",
                timestamp="2024-01-15T10:30:00Z"
            )
        errors = exc_info.value.errors()
        assert any("Status must be one of" in str(error) for error in errors)
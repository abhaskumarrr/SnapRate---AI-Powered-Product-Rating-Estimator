from pydantic import BaseModel, Field, field_validator, HttpUrl, ConfigDict
from typing import Optional, Dict, Union
from fastapi import UploadFile, Form
import re

class PredictionRequest(BaseModel):
    """Request model for prediction endpoint"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Premium Wireless Bluetooth Headphones",
                "image_url": "https://example.com/product-image.jpg"
            }
        }
    )
    
    title: str = Field(..., min_length=1, max_length=200, description="Product title")
    image_url: Optional[HttpUrl] = Field(None, description="URL of the product image")
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        """Validate title content"""
        if not v or not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v.strip())
        
        # Check for minimum meaningful content
        if len(v) < 3:
            raise ValueError('Title must be at least 3 characters long')
            
        return v

class ImageUploadRequest(BaseModel):
    """Model for handling image upload with form data"""
    title: str = Field(..., min_length=1, max_length=200, description="Product title")
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        """Validate title content"""
        if not v or not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        
        # Remove excessive whitespace
        v = re.sub(r'\s+', ' ', v.strip())
        
        # Check for minimum meaningful content
        if len(v) < 3:
            raise ValueError('Title must be at least 3 characters long')
            
        return v

class PredictionResponse(BaseModel):
    """Response model for prediction results"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "rating": 4.2,
                "confidence": 85.5,
                "explanation": "The product has an appealing visual design with clear branding. The title suggests premium quality features that typically receive positive ratings."
            }
        }
    )
    
    rating: float = Field(..., ge=1.0, le=5.0, description="Predicted rating (1-5)")
    confidence: float = Field(..., ge=0.0, le=100.0, description="Confidence percentage")
    explanation: str = Field(..., description="Human-readable explanation")
    
    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        """Ensure rating is rounded to 1 decimal place"""
        return round(v, 1)
    
    @field_validator('confidence')
    @classmethod
    def validate_confidence(cls, v):
        """Ensure confidence is rounded to 1 decimal place"""
        return round(v, 1)
    
    @field_validator('explanation')
    @classmethod
    def validate_explanation(cls, v):
        """Ensure explanation is not empty"""
        if not v or not v.strip():
            raise ValueError('Explanation cannot be empty')
        return v.strip()

class ErrorResponse(BaseModel):
    """Error response model"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status_code": 400,
                "message": "Invalid input provided",
                "details": {
                    "field": "title",
                    "error": "Title must be at least 3 characters long"
                }
            }
        }
    )
    
    status_code: int = Field(..., description="HTTP status code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict] = Field(None, description="Additional error details")
    
    @field_validator('status_code')
    @classmethod
    def validate_status_code(cls, v):
        """Ensure status code is a valid HTTP status code"""
        if not (100 <= v <= 599):
            raise ValueError('Status code must be a valid HTTP status code (100-599)')
        return v
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        """Ensure message is not empty"""
        if not v or not v.strip():
            raise ValueError('Error message cannot be empty')
        return v.strip()

class ValidationErrorResponse(BaseModel):
    """Validation error response model"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status_code": 422,
                "message": "Validation error",
                "errors": [
                    {
                        "loc": ["title"],
                        "msg": "Title must be at least 3 characters long",
                        "type": "value_error"
                    }
                ]
            }
        }
    )
    
    status_code: int = Field(422, description="HTTP status code for validation errors")
    message: str = Field("Validation error", description="Error message")
    errors: list = Field(..., description="List of validation errors")

class ImageValidationModel(BaseModel):
    """Model for image validation parameters"""
    max_file_size: int = Field(5 * 1024 * 1024, description="Maximum file size in bytes (5MB)")
    allowed_formats: list = Field(["image/jpeg", "image/png", "image/webp"], description="Allowed image formats")
    min_width: int = Field(100, description="Minimum image width in pixels")
    min_height: int = Field(100, description="Minimum image height in pixels")
    max_width: int = Field(4000, description="Maximum image width in pixels")
    max_height: int = Field(4000, description="Maximum image height in pixels")

class HealthResponse(BaseModel):
    """Health check response model"""
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }
    )
    
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    timestamp: str = Field(..., description="Current timestamp")
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        """Ensure status is a valid value"""
        valid_statuses = ["healthy", "unhealthy", "degraded"]
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {", ".join(valid_statuses)}')
        return v
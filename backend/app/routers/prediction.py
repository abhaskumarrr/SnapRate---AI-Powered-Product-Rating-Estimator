"""
Prediction router for SnapRate API.
Handles product rating prediction requests.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import logging
from PIL import Image
from io import BytesIO

from ..models import PredictionResponse, ErrorResponse, ImageUploadRequest
from ..prediction_service import EnsemblePredictor
from ..input_processor import InputProcessor
# Rate limiting will be handled by middleware

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/v1",
    tags=["prediction"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
        429: {"model": ErrorResponse, "description": "Rate Limit Exceeded"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    }
)

# Initialize services
predictor = EnsemblePredictor()
input_processor = InputProcessor()


@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict product rating",
    description="Predict customer rating for a product based on image and title"
)
async def predict_rating(
    title: str = Form(..., description="Product title"),
    image: Optional[UploadFile] = File(None, description="Product image file"),
    image_url: Optional[str] = Form(None, description="Product image URL"),
    mode: str = Form("auto", description="Prediction mode: auto, rule_based, ai, ensemble")
):
    """
    Predict product rating based on title and image.
    
    Args:
        title: Product title (required)
        image: Uploaded image file (optional)
        image_url: Image URL (optional)
        mode: Prediction mode (auto, rule_based, ai, ensemble)
        request_id: Rate limiting identifier
        
    Returns:
        PredictionResponse with rating, confidence, and explanation
        
    Raises:
        HTTPException: For various error conditions
    """
    try:
        logger.info(f"Prediction request - Title: {title[:50]}..., Mode: {mode}")
        
        # Validate inputs
        if not title or not title.strip():
            raise HTTPException(
                status_code=400,
                detail="Title is required and cannot be empty"
            )
        
        if not image and not image_url:
            logger.warning("No image provided, proceeding with title-only prediction")
        
        if image and image_url:
            raise HTTPException(
                status_code=400,
                detail="Please provide either an image file or image URL, not both"
            )
        
        # Validate mode
        valid_modes = ["auto", "rule_based", "ai", "ensemble"]
        if mode not in valid_modes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid mode. Must be one of: {', '.join(valid_modes)}"
            )
        
        # Process image if provided
        processed_image = None
        if image:
            try:
                processed_image = await input_processor.process_uploaded_image(image)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                logger.error(f"Image processing failed: {e}")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to process uploaded image"
                )
        
        # Validate title
        try:
            validated_title = input_processor.validate_title(title)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Generate prediction
        try:
            prediction = predictor.predict(
                title=validated_title,
                image=processed_image,
                image_url=image_url,
                mode=mode
            )
            
            logger.info(f"Prediction generated - Rating: {prediction.rating}, Confidence: {prediction.confidence}%")
            return prediction
            
        except Exception as e:
            logger.error(f"Prediction generation failed: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate prediction"
            )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error in prediction endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )


@router.get(
    "/predict/modes",
    summary="Get available prediction modes",
    description="Get list of available prediction modes and their descriptions"
)
async def get_prediction_modes():
    """
    Get available prediction modes.
    
    Returns:
        Dictionary with available modes and descriptions
    """
    modes = {
        "auto": {
            "description": "Automatically selects the best available prediction method",
            "recommended": True
        },
        "rule_based": {
            "description": "Uses rule-based heuristics for prediction (MVP mode)",
            "recommended": False
        },
        "ai": {
            "description": "Uses AI models for more accurate predictions",
            "recommended": True,
            "available": predictor.use_ai_mode
        },
        "ensemble": {
            "description": "Combines rule-based and AI predictions for best results",
            "recommended": True,
            "available": predictor.use_ai_mode
        }
    }
    
    return {
        "modes": modes,
        "default": "auto",
        "ai_available": predictor.use_ai_mode
    }


@router.get(
    "/predict/health",
    summary="Check prediction service health",
    description="Check if prediction services are working correctly"
)
async def prediction_health():
    """
    Check prediction service health.
    
    Returns:
        Health status of prediction services
    """
    try:
        # Test rule-based predictor
        test_prediction = predictor.rule_based_predictor.predict("Test Product")
        rule_based_healthy = isinstance(test_prediction.rating, float)
        
        # Test AI predictor if available
        ai_healthy = True
        if predictor.use_ai_mode:
            try:
                ai_prediction = predictor.ai_predictor.predict("Test Product")
                ai_healthy = isinstance(ai_prediction.rating, float)
            except Exception as e:
                logger.warning(f"AI predictor health check failed: {e}")
                ai_healthy = False
        
        return {
            "status": "healthy" if rule_based_healthy else "unhealthy",
            "services": {
                "rule_based_predictor": "healthy" if rule_based_healthy else "unhealthy",
                "ai_predictor": "healthy" if ai_healthy else "unhealthy" if predictor.use_ai_mode else "disabled",
                "ensemble_predictor": "healthy" if rule_based_healthy else "unhealthy"
            },
            "ai_mode_available": predictor.use_ai_mode,
            "timestamp": input_processor.get_current_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Prediction health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "unhealthy",
                "error": "Health check failed",
                "timestamp": input_processor.get_current_timestamp()
            }
        )
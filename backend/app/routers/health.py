from fastapi import APIRouter
from datetime import datetime, timezone
from ..models import HealthResponse
from ..config import settings

router = APIRouter()

@router.get("/healthcheck", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint that returns system status information.
    
    Returns:
        HealthResponse: System status, version, and timestamp
    """
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
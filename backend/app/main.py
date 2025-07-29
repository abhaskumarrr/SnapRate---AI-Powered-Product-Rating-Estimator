import time
import logging
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn
from .config import settings, logger
from .routers import health

# Create FastAPI application instance with environment-specific settings
app = FastAPI(
    title=settings.app_name,
    description="AI-powered product rating prediction service",
    version=settings.app_version,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
    debug=settings.debug
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Add trusted host middleware in production
if settings.is_production or settings.is_staging:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.trusted_hosts,
    )

# Add GZip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Process the request
    try:
        response = await call_next(request)
    except Exception as e:
        # Log exceptions
        logger.error(f"Request failed: {request.url.path} - {str(e)}")
        raise
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log request details (less verbose in production)
    if settings.is_development:
        logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    elif response.status_code >= 400:  # Only log errors in production
        logger.warning(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    
    # Add processing time header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Rate limiting is handled by our custom middleware

# Include routers
app.include_router(health.router)

# Import and include prediction router
from .routers import prediction
app.include_router(prediction.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": f"{settings.app_name} is running",
        "version": settings.app_version,
        "environment": settings.environment
    }

# Startup event handler
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    
    # Log configuration in development mode
    if settings.is_development:
        logger.info(f"Configuration: {settings.dict_for_logging()}")

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"Shutting down {settings.app_name}")

if __name__ == "__main__":
    # Run the application with environment-specific settings
    uvicorn.run(
        "app.main:app", 
        host=settings.api_host, 
        port=settings.api_port,
        reload=settings.reload,
        workers=settings.workers,
        log_level=settings.log_level.lower()
    )
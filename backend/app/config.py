import os
import logging
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic_settings import BaseSettings
from pydantic import Field

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("snaprate")

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class Settings(BaseSettings):
    """Application settings using Pydantic for validation and type safety"""
    
    # Application settings
    app_name: str = Field("SnapRate API", description="Application name")
    app_version: str = Field("1.0.0", description="Application version")
    debug: bool = Field(False, description="Debug mode")
    environment: Environment = Field(
        Environment.DEVELOPMENT, 
        description="Application environment"
    )
    log_level: LogLevel = Field(
        LogLevel.INFO, 
        description="Logging level"
    )
    
    # CORS settings
    cors_origins: List[str] = Field(
        ["*"], 
        description="Allowed CORS origins"
    )
    
    # File upload settings
    max_file_size: int = Field(
        10485760,  # 10MB
        description="Maximum file size in bytes"
    )
    allowed_image_types: List[str] = Field(
        ["image/jpeg", "image/png", "image/webp"],
        description="Allowed image MIME types"
    )
    temp_file_dir: str = Field(
        "/tmp/snaprate",
        description="Temporary directory for file uploads"
    )
    
    # API settings
    api_host: str = Field(
        "0.0.0.0", 
        description="API host"
    )
    api_port: int = Field(
        8000, 
        description="API port"
    )
    workers: int = Field(
        1, 
        description="Number of worker processes"
    )
    reload: bool = Field(
        True, 
        description="Auto-reload on code changes"
    )
    
    # Rate limiting
    rate_limit_enabled: bool = Field(
        True, 
        description="Enable rate limiting"
    )
    rate_limit_requests: int = Field(
        100, 
        description="Requests per window"
    )
    rate_limit_window: int = Field(
        3600, 
        description="Window size in seconds"
    )
    
    # Security settings
    trusted_hosts: List[str] = Field(
        ["localhost", "127.0.0.1"],
        description="Trusted hosts"
    )
    behind_proxy: bool = Field(
        False, 
        description="Whether the application is behind a reverse proxy"
    )
    
    # Performance settings
    cache_enabled: bool = Field(
        True, 
        description="Enable caching"
    )
    cache_ttl: int = Field(
        3600, 
        description="Cache TTL in seconds"
    )
    model_optimization: bool = Field(
        False, 
        description="Enable model optimization techniques"
    )
    
    # Monitoring
    enable_metrics: bool = Field(
        False, 
        description="Enable metrics collection"
    )
    metrics_port: int = Field(
        9090, 
        description="Metrics server port"
    )
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }
    
    def model_post_init(self, __context):
        """Post-initialization setup"""
        # Parse list values from comma-separated strings
        if isinstance(self.cors_origins, str):
            self.cors_origins = self.cors_origins.split(",")
        
        if isinstance(self.allowed_image_types, str):
            self.allowed_image_types = self.allowed_image_types.split(",")
            
        if isinstance(self.trusted_hosts, str):
            self.trusted_hosts = self.trusted_hosts.split(",")
        
        # Set up logging based on configuration
        log_level = getattr(logging, self.log_level.upper(), logging.INFO)
        logger.setLevel(log_level)
        
        # Create temp directory if it doesn't exist
        if not os.path.exists(self.temp_file_dir):
            os.makedirs(self.temp_file_dir, exist_ok=True)
        
        # Log startup configuration in development mode
        if self.environment == Environment.DEVELOPMENT:
            logger.info(f"Starting application in {self.environment} mode")
    
    @property
    def is_production(self) -> bool:
        """Check if the application is running in production mode"""
        return self.environment == Environment.PRODUCTION
    
    @property
    def is_development(self) -> bool:
        """Check if the application is running in development mode"""
        return self.environment == Environment.DEVELOPMENT
    
    @property
    def is_staging(self) -> bool:
        """Check if the application is running in staging mode"""
        return self.environment == Environment.STAGING
    
    def dict_for_logging(self) -> Dict[str, Any]:
        """Return a dictionary of settings for logging (excluding sensitive data)"""
        return {
            "app_name": self.app_name,
            "app_version": self.app_version,
            "environment": self.environment,
            "debug": self.debug,
            "api_host": self.api_host,
            "api_port": self.api_port,
            "workers": self.workers,
            "rate_limit_enabled": self.rate_limit_enabled,
            "cache_enabled": self.cache_enabled,
            "model_optimization": self.model_optimization,
            "enable_metrics": self.enable_metrics,
        }

# Create global settings instance
settings = Settings()

# Configure logger with the appropriate level
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
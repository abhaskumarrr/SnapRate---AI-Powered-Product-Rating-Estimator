"""
Input processor for SnapRate API.
Handles validation and processing of user inputs.
"""

import re
import logging
from typing import Optional
from datetime import datetime, timezone
from PIL import Image
from fastapi import UploadFile
from io import BytesIO

logger = logging.getLogger(__name__)

class InputProcessor:
    """Processes and validates user inputs for the prediction service."""
    
    def __init__(self):
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.allowed_formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        self.min_title_length = 3
        self.max_title_length = 200
    
    def validate_title(self, title: str) -> str:
        """
        Validate and clean product title.
        
        Args:
            title: Raw product title
            
        Returns:
            Cleaned title string
            
        Raises:
            ValueError: If title is invalid
        """
        if not title or not title.strip():
            raise ValueError("Title cannot be empty")
        
        # Clean the title
        cleaned_title = re.sub(r'\s+', ' ', title.strip())
        
        if len(cleaned_title) < self.min_title_length:
            raise ValueError(f"Title must be at least {self.min_title_length} characters long")
        
        if len(cleaned_title) > self.max_title_length:
            raise ValueError(f"Title must be no more than {self.max_title_length} characters long")
        
        return cleaned_title
    
    async def process_uploaded_image(self, file: UploadFile) -> Image.Image:
        """
        Process uploaded image file.
        
        Args:
            file: FastAPI UploadFile object
            
        Returns:
            PIL Image object
            
        Raises:
            ValueError: If image is invalid
        """
        # Check file size
        content = await file.read()
        if len(content) > self.max_file_size:
            raise ValueError(f"Image file size exceeds maximum limit of {self.max_file_size // (1024*1024)}MB")
        
        # Check file type
        if file.content_type not in self.allowed_formats:
            raise ValueError(f"Invalid image format. Supported formats: {', '.join(self.allowed_formats)}")
        
        try:
            # Open and validate image
            image = Image.open(BytesIO(content))
            
            # Verify it's a valid image
            image.verify()
            
            # Reopen for actual use (verify() closes the image)
            image = Image.open(BytesIO(content))
            
            # Convert to RGB if necessary
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')
            
            return image
            
        except Exception as e:
            raise ValueError(f"Invalid image file: {str(e)}")
    
    def get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format."""
        return datetime.now(timezone.utc).isoformat()
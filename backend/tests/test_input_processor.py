import pytest
import io
from PIL import Image
from unittest.mock import Mock, patch, AsyncMock
from fastapi import UploadFile, HTTPException
import requests

from app.input_processor import InputProcessor, extract_image_from_request, validate_request_data
from app.models import ImageValidationModel


class TestInputProcessor:
    """Test cases for InputProcessor class"""
    
    @pytest.fixture
    def processor(self):
        """Create InputProcessor instance for testing"""
        return InputProcessor()
    
    @pytest.fixture
    def custom_processor(self):
        """Create InputProcessor with custom validation config"""
        config = ImageValidationModel(
            max_file_size=1024 * 1024,  # 1MB
            min_width=200,
            min_height=200
        )
        return InputProcessor(config)
    
    @pytest.fixture
    def sample_image(self):
        """Create a sample PIL image for testing"""
        image = Image.new('RGB', (300, 300), color='red')
        return image
    
    @pytest.fixture
    def sample_image_bytes(self, sample_image):
        """Convert sample image to bytes"""
        img_bytes = io.BytesIO()
        sample_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes.getvalue()
    
    @pytest.fixture
    def mock_upload_file(self, sample_image_bytes):
        """Create mock UploadFile for testing"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=sample_image_bytes)
        return mock_file


class TestImageUploadProcessing(TestInputProcessor):
    """Test image upload processing functionality"""
    
    @pytest.mark.asyncio
    async def test_process_image_upload_success(self, processor, mock_upload_file):
        """Test successful image upload processing"""
        image, metadata = await processor.process_image_upload(mock_upload_file)
        
        assert isinstance(image, Image.Image)
        assert image.size == (300, 300)
        assert metadata['filename'] == "test_image.jpg"
        assert metadata['content_type'] == "image/jpeg"
        assert metadata['width'] == 300
        assert metadata['height'] == 300
        assert 'size_bytes' in metadata
    
    @pytest.mark.asyncio
    async def test_process_image_upload_file_too_large(self, processor):
        """Test image upload with file too large"""
        large_content = b'x' * (6 * 1024 * 1024)  # 6MB, exceeds 5MB limit
        
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "large_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=large_content)
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_upload(mock_file)
        
        assert exc_info.value.status_code == 413
        assert "exceeds maximum allowed size" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_process_image_upload_invalid_format(self, processor, sample_image_bytes):
        """Test image upload with invalid format"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test_image.txt"
        mock_file.content_type = "text/plain"
        mock_file.read = AsyncMock(return_value=sample_image_bytes)
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_upload(mock_file)
        
        assert exc_info.value.status_code == 400
        assert "Unsupported image format" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_process_image_upload_dimensions_too_small(self, processor):
        """Test image upload with dimensions too small"""
        # Create small image (50x50, below 100x100 minimum)
        small_image = Image.new('RGB', (50, 50), color='blue')
        img_bytes = io.BytesIO()
        small_image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "small_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=img_bytes.getvalue())
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_upload(mock_file)
        
        assert exc_info.value.status_code == 400
        assert "too small" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_process_image_upload_dimensions_too_large(self, processor):
        """Test image upload with dimensions too large"""
        # Create large image (5000x5000, above 4000x4000 maximum)
        large_image = Image.new('RGB', (5000, 5000), color='green')
        img_bytes = io.BytesIO()
        large_image.save(img_bytes, format='JPEG', quality=1)  # Low quality to reduce file size
        img_bytes.seek(0)
        
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "large_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=img_bytes.getvalue())
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_upload(mock_file)
        
        assert exc_info.value.status_code == 400
        assert "too large" in exc_info.value.detail


class TestImageUrlProcessing(TestInputProcessor):
    """Test image URL processing functionality"""
    
    @pytest.mark.asyncio
    @patch('app.input_processor.requests.get')
    async def test_process_image_url_success(self, mock_get, processor, sample_image_bytes):
        """Test successful image URL processing"""
        mock_response = Mock()
        mock_response.headers = {'content-type': 'image/jpeg'}
        mock_response.iter_content.return_value = [sample_image_bytes]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        image, metadata = await processor.process_image_url("https://example.com/image.jpg")
        
        assert isinstance(image, Image.Image)
        assert image.size == (300, 300)
        assert metadata['source_url'] == "https://example.com/image.jpg"
        assert metadata['content_type'] == 'image/jpeg'
        assert metadata['width'] == 300
        assert metadata['height'] == 300
    
    @pytest.mark.asyncio
    @patch('app.input_processor.requests.get')
    async def test_process_image_url_request_error(self, mock_get, processor):
        """Test image URL processing with request error"""
        mock_get.side_effect = requests.RequestException("Connection failed")
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_url("https://example.com/nonexistent.jpg")
        
        assert exc_info.value.status_code == 400
        assert "Failed to download image from URL" in exc_info.value.detail
    
    @pytest.mark.asyncio
    @patch('app.input_processor.requests.get')
    async def test_process_image_url_invalid_content_type(self, mock_get, processor):
        """Test image URL processing with invalid content type"""
        mock_response = Mock()
        mock_response.headers = {'content-type': 'text/html'}
        mock_response.iter_content.return_value = [b'<html></html>']
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_url("https://example.com/page.html")
        
        assert exc_info.value.status_code == 400
        assert "Unsupported image format from URL" in exc_info.value.detail
    
    @pytest.mark.asyncio
    @patch('app.input_processor.requests.get')
    async def test_process_image_url_file_too_large(self, mock_get, processor):
        """Test image URL processing with file too large"""
        large_content = b'x' * (6 * 1024 * 1024)  # 6MB
        
        mock_response = Mock()
        mock_response.headers = {'content-type': 'image/jpeg'}
        mock_response.iter_content.return_value = [large_content]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_image_url("https://example.com/large_image.jpg")
        
        assert exc_info.value.status_code == 413
        assert "exceeds maximum allowed size" in exc_info.value.detail


class TestTitleValidation(TestInputProcessor):
    """Test title validation functionality"""
    
    def test_validate_title_success(self, processor):
        """Test successful title validation"""
        title = processor.validate_title("Premium Wireless Headphones")
        assert title == "Premium Wireless Headphones"
    
    def test_validate_title_whitespace_normalization(self, processor):
        """Test title whitespace normalization"""
        title = processor.validate_title("  Multiple   spaces   here  ")
        assert title == "Multiple spaces here"
    
    def test_validate_title_empty(self, processor):
        """Test title validation with empty string"""
        with pytest.raises(HTTPException) as exc_info:
            processor.validate_title("")
        
        assert exc_info.value.status_code == 400
        assert "cannot be empty" in exc_info.value.detail
    
    def test_validate_title_whitespace_only(self, processor):
        """Test title validation with whitespace only"""
        with pytest.raises(HTTPException) as exc_info:
            processor.validate_title("   ")
        
        assert exc_info.value.status_code == 400
        assert "cannot be empty" in exc_info.value.detail
    
    def test_validate_title_too_short(self, processor):
        """Test title validation with too short title"""
        with pytest.raises(HTTPException) as exc_info:
            processor.validate_title("ab")
        
        assert exc_info.value.status_code == 400
        assert "at least 3 characters" in exc_info.value.detail
    
    def test_validate_title_too_long(self, processor):
        """Test title validation with too long title"""
        long_title = "a" * 201
        with pytest.raises(HTTPException) as exc_info:
            processor.validate_title(long_title)
        
        assert exc_info.value.status_code == 400
        assert "not exceed 200 characters" in exc_info.value.detail


class TestMultipartRequestProcessing(TestInputProcessor):
    """Test complete multipart request processing"""
    
    @pytest.mark.asyncio
    async def test_process_multipart_request_with_file(self, processor, mock_upload_file):
        """Test multipart request processing with file upload"""
        title, image, metadata = await processor.process_multipart_request(
            title="Test Product",
            image_file=mock_upload_file
        )
        
        assert title == "Test Product"
        assert isinstance(image, Image.Image)
        assert image.size == (300, 300)
        assert metadata['filename'] == "test_image.jpg"
    
    @pytest.mark.asyncio
    @patch('app.input_processor.requests.get')
    async def test_process_multipart_request_with_url(self, mock_get, processor, sample_image_bytes):
        """Test multipart request processing with image URL"""
        mock_response = Mock()
        mock_response.headers = {'content-type': 'image/jpeg'}
        mock_response.iter_content.return_value = [sample_image_bytes]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        title, image, metadata = await processor.process_multipart_request(
            title="Test Product",
            image_url="https://example.com/image.jpg"
        )
        
        assert title == "Test Product"
        assert isinstance(image, Image.Image)
        assert metadata['source_url'] == "https://example.com/image.jpg"
    
    @pytest.mark.asyncio
    async def test_process_multipart_request_no_image(self, processor):
        """Test multipart request processing with no image provided"""
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_multipart_request(title="Test Product")
        
        assert exc_info.value.status_code == 400
        assert "Either image file or image URL must be provided" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_process_multipart_request_invalid_title(self, processor, mock_upload_file):
        """Test multipart request processing with invalid title"""
        with pytest.raises(HTTPException) as exc_info:
            await processor.process_multipart_request(
                title="",
                image_file=mock_upload_file
            )
        
        assert exc_info.value.status_code == 400
        assert "cannot be empty" in exc_info.value.detail


class TestCustomValidationConfig(TestInputProcessor):
    """Test custom validation configuration"""
    
    @pytest.mark.asyncio
    async def test_custom_validation_config(self, custom_processor):
        """Test processor with custom validation configuration"""
        # Create image that meets custom requirements (200x200 minimum)
        image = Image.new('RGB', (250, 250), color='blue')
        img_bytes = io.BytesIO()
        image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "custom_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=img_bytes.getvalue())
        
        processed_image, metadata = await custom_processor.process_image_upload(mock_file)
        
        assert isinstance(processed_image, Image.Image)
        assert processed_image.size == (250, 250)
        assert metadata['width'] == 250
        assert metadata['height'] == 250
    
    @pytest.mark.asyncio
    async def test_custom_validation_config_fails(self, custom_processor):
        """Test processor with custom validation configuration fails for small image"""
        # Create image smaller than custom requirements (150x150, below 200x200 minimum)
        image = Image.new('RGB', (150, 150), color='red')
        img_bytes = io.BytesIO()
        image.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "small_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=img_bytes.getvalue())
        
        with pytest.raises(HTTPException) as exc_info:
            await custom_processor.process_image_upload(mock_file)
        
        assert exc_info.value.status_code == 400
        assert "too small" in exc_info.value.detail


class TestUtilityFunctions(TestInputProcessor):
    """Test utility functions"""
    
    @pytest.mark.asyncio
    async def test_extract_image_from_request_with_file(self, sample_image_bytes):
        """Test extract_image_from_request with file upload"""
        mock_file = Mock(spec=UploadFile)
        mock_file.filename = "test_image.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.read = AsyncMock(return_value=sample_image_bytes)
        
        image, metadata = await extract_image_from_request(image_file=mock_file)
        
        assert isinstance(image, Image.Image)
        assert metadata['filename'] == "test_image.jpg"
    
    @pytest.mark.asyncio
    @patch('app.input_processor.requests.get')
    async def test_extract_image_from_request_with_url(self, mock_get, sample_image_bytes):
        """Test extract_image_from_request with URL"""
        mock_response = Mock()
        mock_response.headers = {'content-type': 'image/jpeg'}
        mock_response.iter_content.return_value = [sample_image_bytes]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        image, metadata = await extract_image_from_request(image_url="https://example.com/image.jpg")
        
        assert isinstance(image, Image.Image)
        assert metadata['source_url'] == "https://example.com/image.jpg"
    
    @pytest.mark.asyncio
    async def test_extract_image_from_request_no_input(self):
        """Test extract_image_from_request with no input"""
        with pytest.raises(HTTPException) as exc_info:
            await extract_image_from_request()
        
        assert exc_info.value.status_code == 400
        assert "Either image file or image URL must be provided" in exc_info.value.detail
    
    def test_validate_request_data_success(self):
        """Test validate_request_data utility function"""
        title = validate_request_data("Valid Product Title")
        assert title == "Valid Product Title"
    
    def test_validate_request_data_failure(self):
        """Test validate_request_data utility function with invalid input"""
        with pytest.raises(HTTPException) as exc_info:
            validate_request_data("")
        
        assert exc_info.value.status_code == 400
        assert "cannot be empty" in exc_info.value.detail
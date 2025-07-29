"""
Tests for the rule-based prediction service.
"""

import pytest
from unittest.mock import Mock, patch
from PIL import Image
import io
import requests
from app.prediction_service import RuleBasedPredictor, AIModelPredictor, EnsemblePredictor
from app.models import PredictionResponse


class TestRuleBasedPredictor:
    """Test cases for RuleBasedPredictor class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.predictor = RuleBasedPredictor()
    
    def test_analyze_title_premium_keywords(self):
        """Test title analysis with premium keywords."""
        title = "Premium Wireless Bluetooth Headphones Professional"
        result = self.predictor.analyze_title(title)
        
        assert result['positive_score'] > 0
        assert result['tech_score'] > 0
        assert result['negative_penalty'] == 0
        assert result['word_count'] == 5
    
    def test_analyze_title_negative_keywords(self):
        """Test title analysis with negative keywords."""
        title = "Cheap Basic Budget Headphones"
        result = self.predictor.analyze_title(title)
        
        assert result['negative_penalty'] > 0
        assert result['positive_score'] == 0
        assert result['word_count'] == 4
    
    def test_analyze_title_brand_keywords(self):
        """Test title analysis with brand keywords."""
        title = "Apple iPhone Samsung Galaxy"
        result = self.predictor.analyze_title(title)
        
        assert result['brand_score'] > 0
        assert result['word_count'] == 4
    
    def test_analyze_title_tech_keywords(self):
        """Test title analysis with technology keywords."""
        title = "Wireless Bluetooth Smart LED 4K"
        result = self.predictor.analyze_title(title)
        
        assert result['tech_score'] > 0
        assert result['pattern_bonus'] > 0  # Should detect numbers and caps
        assert result['word_count'] == 5
    
    def test_analyze_title_empty(self):
        """Test title analysis with minimal content."""
        title = "A"
        result = self.predictor.analyze_title(title)
        
        assert result['title_length_score'] < 0.1
        assert result['word_count'] == 1
    
    def test_analyze_title_long(self):
        """Test title analysis with long title."""
        title = "Premium Professional Wireless Bluetooth Noise-Cancelling Over-Ear Headphones with Advanced Audio Technology"
        result = self.predictor.analyze_title(title)
        
        assert result['title_length_score'] > 0.8
        assert result['positive_score'] > 0
        assert result['tech_score'] > 0
        assert result['word_count'] > 10
    
    def create_test_image(self, width=800, height=600, mode='RGB'):
        """Create a test image for testing."""
        image = Image.new(mode, (width, height), color='red')
        return image
    
    def test_analyze_image_high_resolution(self):
        """Test image analysis with high resolution image."""
        image = self.create_test_image(1920, 1080)
        result = self.predictor.analyze_image(image)
        
        assert result['resolution_score'] > 0.8
        assert result['width'] == 1920
        assert result['height'] == 1080
        assert 'brightness_score' in result
        assert 'contrast_score' in result
    
    def test_analyze_image_low_resolution(self):
        """Test image analysis with low resolution image."""
        image = self.create_test_image(200, 150)
        result = self.predictor.analyze_image(image)
        
        assert result['resolution_score'] < 0.1
        assert result['width'] == 200
        assert result['height'] == 150
    
    def test_analyze_image_standard_aspect_ratio(self):
        """Test image analysis with standard aspect ratio."""
        image = self.create_test_image(1600, 1200)  # 4:3 ratio
        result = self.predictor.analyze_image(image)
        
        assert result['aspect_score'] > 0.8
    
    def test_analyze_image_non_rgb(self):
        """Test image analysis with non-RGB image."""
        image = self.create_test_image(800, 600, 'L')  # Grayscale
        result = self.predictor.analyze_image(image)
        
        assert result['brightness_score'] == 0.7  # Default value
        assert result['contrast_score'] == 0.7  # Default value
    
    def test_analyze_image_exception_handling(self):
        """Test image analysis with invalid image."""
        # Mock an image that raises an exception
        mock_image = Mock()
        mock_image.size = Mock(side_effect=Exception("Test exception"))
        
        result = self.predictor.analyze_image(mock_image)
        
        # Should return default scores
        assert result['resolution_score'] == 0.5
        assert result['aspect_score'] == 0.5
        assert result['brightness_score'] == 0.5
        assert result['contrast_score'] == 0.5
    
    @patch('requests.get')
    def test_load_image_from_url_success(self, mock_get):
        """Test successful image loading from URL."""
        # Create a mock response with image data
        test_image = self.create_test_image()
        img_byte_arr = io.BytesIO()
        test_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        mock_response = Mock()
        mock_response.content = img_byte_arr.getvalue()
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        result = self.predictor.load_image_from_url("http://example.com/image.png")
        
        assert result is not None
        assert isinstance(result, Image.Image)
        mock_get.assert_called_once_with("http://example.com/image.png", timeout=10)
    
    @patch('requests.get')
    def test_load_image_from_url_failure(self, mock_get):
        """Test failed image loading from URL."""
        mock_get.side_effect = requests.RequestException("Network error")
        
        result = self.predictor.load_image_from_url("http://example.com/image.png")
        
        assert result is None
    
    def test_combine_scores_high_quality(self):
        """Test score combination for high-quality product."""
        title_analysis = {
            'title_length_score': 0.8,
            'positive_score': 0.6,
            'tech_score': 0.4,
            'brand_score': 0.8,
            'negative_penalty': 0.0,
            'pattern_bonus': 0.2
        }
        
        image_analysis = {
            'resolution_score': 0.9,
            'aspect_score': 0.8,
            'brightness_score': 0.8,
            'contrast_score': 0.7
        }
        
        rating, confidence = self.predictor.combine_scores(title_analysis, image_analysis)
        
        assert rating > 3.5  # Should be above average
        assert confidence > 70  # Should have decent confidence
        assert 1.0 <= rating <= 5.0
        assert 0.0 <= confidence <= 100.0
    
    def test_combine_scores_low_quality(self):
        """Test score combination for low-quality product."""
        title_analysis = {
            'title_length_score': 0.2,
            'positive_score': 0.0,
            'tech_score': 0.0,
            'brand_score': 0.0,
            'negative_penalty': 0.6,
            'pattern_bonus': 0.0
        }
        
        image_analysis = {
            'resolution_score': 0.2,
            'aspect_score': 0.3,
            'brightness_score': 0.3,
            'contrast_score': 0.2
        }
        
        rating, confidence = self.predictor.combine_scores(title_analysis, image_analysis)
        
        assert rating < 3.5  # Should be below average
        assert 1.0 <= rating <= 5.0
        assert 0.0 <= confidence <= 100.0
    
    def test_generate_explanation_premium_product(self):
        """Test explanation generation for premium product."""
        title_analysis = {
            'positive_score': 0.6,
            'tech_score': 0.4,
            'brand_score': 0.8,
            'word_count': 8,
            'negative_penalty': 0.0
        }
        
        image_analysis = {
            'resolution_score': 0.9,
            'aspect_score': 0.8,
            'brightness_score': 0.8,
            'contrast_score': 0.7
        }
        
        explanation = self.predictor.generate_explanation(
            title_analysis, image_analysis, 4.5, "Premium Apple iPhone Professional"
        )
        
        assert "premium quality indicators" in explanation.lower()
        assert "technical features" in explanation.lower()
        assert "brand name" in explanation.lower()
        assert "high-resolution" in explanation.lower()
        assert len(explanation) > 50  # Should be reasonably detailed
    
    def test_generate_explanation_budget_product(self):
        """Test explanation generation for budget product."""
        title_analysis = {
            'positive_score': 0.0,
            'tech_score': 0.0,
            'brand_score': 0.0,
            'word_count': 3,
            'negative_penalty': 0.4
        }
        
        image_analysis = {
            'resolution_score': 0.2,
            'aspect_score': 0.3,
            'brightness_score': 0.4,
            'contrast_score': 0.3
        }
        
        explanation = self.predictor.generate_explanation(
            title_analysis, image_analysis, 2.5, "Cheap Basic Phone"
        )
        
        assert "budget positioning" in explanation.lower()
        assert "low image resolution" in explanation.lower()
        assert len(explanation) > 30
    
    def test_predict_with_image(self):
        """Test full prediction with image."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image(1200, 800)
        
        result = self.predictor.predict(title, image=image)
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
        assert len(result.explanation) > 20
    
    @patch.object(RuleBasedPredictor, 'load_image_from_url')
    def test_predict_with_image_url(self, mock_load_image):
        """Test full prediction with image URL."""
        title = "Premium Wireless Bluetooth Headphones"
        image_url = "http://example.com/image.jpg"
        test_image = self.create_test_image()
        
        mock_load_image.return_value = test_image
        
        result = self.predictor.predict(title, image_url=image_url)
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
        mock_load_image.assert_called_once_with(image_url)
    
    def test_predict_without_image(self):
        """Test prediction without image (title only)."""
        title = "Premium Wireless Bluetooth Headphones"
        
        result = self.predictor.predict(title)
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
        assert len(result.explanation) > 20
    
    @patch.object(RuleBasedPredictor, 'load_image_from_url')
    def test_predict_with_failed_image_url(self, mock_load_image):
        """Test prediction when image URL fails to load."""
        title = "Premium Wireless Bluetooth Headphones"
        image_url = "http://example.com/nonexistent.jpg"
        
        mock_load_image.return_value = None
        
        result = self.predictor.predict(title, image_url=image_url)
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
    
    def test_predict_various_titles(self):
        """Test prediction with various title types."""
        test_cases = [
            "Apple iPhone 15 Pro Max",
            "Cheap plastic phone case",
            "Professional DSLR Camera Canon",
            "Basic headphones",
            "Premium Luxury Watch Swiss Made",
            "Generic USB cable"
        ]
        
        for title in test_cases:
            result = self.predictor.predict(title)
            assert isinstance(result, PredictionResponse)
            assert 1.0 <= result.rating <= 5.0
            assert 0.0 <= result.confidence <= 100.0
            assert len(result.explanation) > 10
    
    def test_rating_consistency(self):
        """Test that similar inputs produce consistent ratings."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image(1200, 800)
        
        # Run prediction multiple times
        results = []
        for _ in range(5):
            result = self.predictor.predict(title, image=image)
            results.append(result.rating)
        
        # Ratings should be relatively consistent (within 0.5 points due to randomness)
        rating_range = max(results) - min(results)
        assert rating_range <= 0.6  # Allow for some randomness
    
    def test_confidence_bounds(self):
        """Test that confidence scores stay within reasonable bounds."""
        test_cases = [
            ("Premium Apple iPhone Professional", self.create_test_image(1920, 1080)),
            ("Cheap basic phone", self.create_test_image(200, 150)),
            ("Wireless Bluetooth Headphones", None)
        ]
        
        for title, image in test_cases:
            result = self.predictor.predict(title, image=image)
            assert 60.0 <= result.confidence <= 95.0  # Should be within reasonable bounds


class TestAIModelPredictor:
    """Test cases for AIModelPredictor class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.ai_predictor = AIModelPredictor()
    
    def create_test_image(self, width=800, height=600, mode='RGB'):
        """Create a test image for testing."""
        image = Image.new(mode, (width, height), color='red')
        return image
    
    def test_ai_predictor_initialization(self):
        """Test AI predictor initialization."""
        # Should initialize without errors
        assert self.ai_predictor is not None
        # Models may or may not be loaded depending on dependencies
        assert isinstance(self.ai_predictor.models_loaded, bool)
    
    def test_basic_title_analysis_fallback(self):
        """Test fallback title analysis when AI models are not available."""
        result = self.ai_predictor._basic_title_analysis("Premium Wireless Headphones")
        
        assert 'positive_sentiment' in result
        assert 'negative_sentiment' in result
        assert 'semantic_quality_score' in result
        assert 'word_count' in result
        assert result['word_count'] == 3
    
    def test_analyze_title_with_ai_fallback(self):
        """Test AI title analysis (may fall back to basic analysis)."""
        title = "Premium Wireless Bluetooth Headphones Professional"
        result = self.ai_predictor.analyze_title_with_ai(title)
        
        # Should return analysis results regardless of AI availability
        assert 'positive_sentiment' in result
        assert 'negative_sentiment' in result
        assert 'semantic_quality_score' in result
        assert 'word_count' in result
        assert result['word_count'] == 5
    
    def test_analyze_image_with_ai(self):
        """Test AI image analysis."""
        image = self.create_test_image(1200, 800)
        result = self.ai_predictor.analyze_image_with_ai(image)
        
        assert 'resolution_score' in result
        assert 'color_richness' in result
        assert 'brightness_score' in result
        assert 'sharpness_score' in result
        assert 'composition_score' in result
        assert result['width'] == 1200
        assert result['height'] == 800
    
    def test_analyze_image_with_ai_grayscale(self):
        """Test AI image analysis with grayscale image."""
        image = self.create_test_image(800, 600, 'L')
        result = self.ai_predictor.analyze_image_with_ai(image)
        
        # Should handle grayscale images
        assert 'resolution_score' in result
        assert 'brightness_score' in result
        assert result['width'] == 800
        assert result['height'] == 600
    
    def test_combine_ai_scores(self):
        """Test AI score combination."""
        title_analysis = {
            'positive_sentiment': 0.8,
            'negative_sentiment': 0.1,
            'semantic_quality_score': 0.7,
            'semantic_tech_score': 0.6,
            'semantic_brand_score': 0.5,
            'complexity_score': 0.8
        }
        
        image_analysis = {
            'resolution_score': 0.9,
            'color_richness': 0.7,
            'brightness_score': 0.8,
            'contrast_score': 0.7,
            'sharpness_score': 0.8,
            'composition_score': 0.6,
            'aspect_score': 0.8
        }
        
        rating, confidence = self.ai_predictor.combine_ai_scores(title_analysis, image_analysis)
        
        assert 1.0 <= rating <= 5.0
        assert 70.0 <= confidence <= 98.0  # AI mode has higher confidence range
    
    def test_generate_ai_explanation(self):
        """Test AI explanation generation."""
        title_analysis = {
            'positive_sentiment': 0.8,
            'negative_sentiment': 0.1,
            'semantic_quality_score': 0.7,
            'semantic_tech_score': 0.6,
            'semantic_brand_score': 0.5,
            'complexity_score': 0.8
        }
        
        image_analysis = {
            'resolution_score': 0.9,
            'color_richness': 0.7,
            'brightness_score': 0.8,
            'contrast_score': 0.7,
            'sharpness_score': 0.8,
            'composition_score': 0.6,
            'aspect_score': 0.8
        }
        
        explanation = self.ai_predictor.generate_ai_explanation(
            title_analysis, image_analysis, 4.5, "Premium Apple iPhone Professional"
        )
        
        assert len(explanation) > 50
        assert "positive sentiment" in explanation.lower() or "ai analysis" in explanation.lower()
    
    def test_ai_predict_with_image(self):
        """Test AI prediction with image."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image(1200, 800)
        
        result = self.ai_predictor.predict(title, image=image)
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
        assert len(result.explanation) > 20
    
    def test_ai_predict_without_image(self):
        """Test AI prediction without image."""
        title = "Premium Wireless Bluetooth Headphones"
        
        result = self.ai_predictor.predict(title)
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0


class TestEnsemblePredictor:
    """Test cases for EnsemblePredictor class."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.ensemble_predictor = EnsemblePredictor()
    
    def create_test_image(self, width=800, height=600, mode='RGB'):
        """Create a test image for testing."""
        image = Image.new(mode, (width, height), color='red')
        return image
    
    def test_ensemble_predictor_initialization(self):
        """Test ensemble predictor initialization."""
        assert self.ensemble_predictor is not None
        assert self.ensemble_predictor.rule_based_predictor is not None
        # AI predictor may or may not be available
        assert isinstance(self.ensemble_predictor.use_ai_mode, bool)
    
    def test_predict_rule_based_mode(self):
        """Test prediction in rule-based mode."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image()
        
        result = self.ensemble_predictor.predict(title, image=image, mode="rule_based")
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
    
    def test_predict_ai_mode(self):
        """Test prediction in AI mode (may fall back to rule-based)."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image()
        
        result = self.ensemble_predictor.predict(title, image=image, mode="ai")
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
    
    def test_predict_auto_mode(self):
        """Test prediction in auto mode."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image()
        
        result = self.ensemble_predictor.predict(title, image=image, mode="auto")
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
    
    def test_predict_ensemble_mode(self):
        """Test prediction in ensemble mode."""
        title = "Premium Wireless Bluetooth Headphones"
        image = self.create_test_image()
        
        result = self.ensemble_predictor.predict(title, image=image, mode="ensemble")
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
        
        # Ensemble mode should mention both models in explanation if AI is available
        if self.ensemble_predictor.use_ai_mode:
            assert "ensemble" in result.explanation.lower() or "rule-based" in result.explanation.lower()
    
    def test_predict_various_modes(self):
        """Test prediction with various modes."""
        title = "Apple iPhone 15 Pro Max"
        modes = ["rule_based", "ai", "auto", "ensemble"]
        
        for mode in modes:
            result = self.ensemble_predictor.predict(title, mode=mode)
            assert isinstance(result, PredictionResponse)
            assert 1.0 <= result.rating <= 5.0
            assert 0.0 <= result.confidence <= 100.0
    
    def test_predict_without_ai_dependencies(self):
        """Test prediction when AI dependencies are not available."""
        # Create predictor with AI mode disabled
        predictor = EnsemblePredictor(use_ai_mode=False)
        
        title = "Premium Wireless Bluetooth Headphones"
        result = predictor.predict(title, mode="ai")  # Should fall back to rule-based
        
        assert isinstance(result, PredictionResponse)
        assert 1.0 <= result.rating <= 5.0
        assert 0.0 <= result.confidence <= 100.0
    
    @patch.object(RuleBasedPredictor, 'predict')
    def test_ensemble_mode_combination(self, mock_rule_predict):
        """Test ensemble mode properly combines predictions."""
        # Mock rule-based prediction
        mock_rule_predict.return_value = PredictionResponse(
            rating=3.5,
            confidence=75.0,
            explanation="Rule-based explanation"
        )
        
        title = "Test Product"
        
        # Only test if AI mode is available
        if self.ensemble_predictor.use_ai_mode:
            result = self.ensemble_predictor.predict(title, mode="ensemble")
            
            # Should have called rule-based predictor
            mock_rule_predict.assert_called_once()
            
            # Result should be ensemble
            assert isinstance(result, PredictionResponse)
            assert "ensemble" in result.explanation.lower()
        else:
            # If AI not available, should fall back to rule-based
            result = self.ensemble_predictor.predict(title, mode="ensemble")
            assert isinstance(result, PredictionResponse)
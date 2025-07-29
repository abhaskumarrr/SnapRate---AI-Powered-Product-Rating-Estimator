"""
Simplified prediction service for SnapRate.
Provides rule-based product rating predictions.
"""

import re
import random
import logging
from typing import Optional, Dict
from PIL import Image
import requests
from io import BytesIO
from .models import PredictionResponse

logger = logging.getLogger(__name__)

class RuleBasedPredictor:
    """Rule-based predictor using heuristics to estimate product ratings."""
    
    def __init__(self):
        # Keywords that suggest quality/premium products
        self.positive_keywords = {
            'premium', 'luxury', 'professional', 'high-quality', 'deluxe', 'advanced',
            'superior', 'excellent', 'top-rated', 'bestseller', 'award-winning',
            'certified', 'authentic', 'original', 'branded', 'flagship'
        }
        
        # Keywords that might suggest lower quality
        self.negative_keywords = {
            'cheap', 'basic', 'simple', 'budget', 'economy', 'generic',
            'knockoff', 'imitation', 'replica', 'used', 'refurbished'
        }
        
        # Technology/feature keywords that add value
        self.tech_keywords = {
            'wireless', 'bluetooth', 'smart', 'digital', 'hd', '4k', 'led',
            'rechargeable', 'waterproof', 'durable', 'ergonomic', 'portable'
        }
        
        # Brand indicators
        self.brand_indicators = {
            'apple', 'samsung', 'sony', 'nike', 'adidas', 'canon', 'nikon'
        }
    
    def analyze_title(self, title: str) -> Dict[str, float]:
        """Analyze product title for quality indicators."""
        title_lower = title.lower()
        
        # Count positive indicators
        positive_count = sum(1 for keyword in self.positive_keywords if keyword in title_lower)
        negative_count = sum(1 for keyword in self.negative_keywords if keyword in title_lower)
        tech_count = sum(1 for keyword in self.tech_keywords if keyword in title_lower)
        brand_count = sum(1 for brand in self.brand_indicators if brand in title_lower)
        
        # Calculate scores
        title_length_score = min(len(title) / 50, 1.0)
        positive_score = min(positive_count * 0.3, 1.0)
        tech_score = min(tech_count * 0.2, 0.8)
        brand_score = min(brand_count * 0.4, 1.0)
        negative_penalty = min(negative_count * 0.4, 1.0)
        
        # Check for specific patterns
        has_numbers = bool(re.search(r'\d+', title))
        has_caps = bool(re.search(r'[A-Z]{2,}', title))
        pattern_bonus = 0.1 * (has_numbers + has_caps)
        
        return {
            'title_length_score': title_length_score,
            'positive_score': positive_score,
            'tech_score': tech_score,
            'brand_score': brand_score,
            'negative_penalty': negative_penalty,
            'pattern_bonus': pattern_bonus,
            'word_count': len(title.split())
        }
    
    def analyze_image(self, image: Optional[Image.Image]) -> Dict[str, float]:
        """Analyze product image for visual quality indicators."""
        if not image:
            return {
                'resolution_score': 0.4,
                'aspect_score': 0.5,
                'brightness_score': 0.5,
                'contrast_score': 0.4
            }
        
        try:
            width, height = image.size
            aspect_ratio = width / height
            
            # Resolution score
            total_pixels = width * height
            resolution_score = min(total_pixels / (1000 * 1000), 1.0)
            
            # Aspect ratio score
            standard_ratios = [1.0, 4/3, 3/2, 16/9, 16/10]
            aspect_score = max(0.5, 1.0 - min(abs(aspect_ratio - ratio) for ratio in standard_ratios))
            
            # Basic color analysis
            if image.mode == 'RGB':
                grayscale = image.convert('L')
                pixels = list(grayscale.getdata())
                
                avg_brightness = sum(pixels) / len(pixels)
                brightness_score = 1.0 - abs(avg_brightness - 128) / 128
                
                pixel_variance = sum((p - avg_brightness) ** 2 for p in pixels[:1000]) / min(1000, len(pixels))
                contrast_score = min(pixel_variance / 2000, 1.0)
            else:
                brightness_score = 0.7
                contrast_score = 0.7
            
            return {
                'resolution_score': resolution_score,
                'aspect_score': aspect_score,
                'brightness_score': brightness_score,
                'contrast_score': contrast_score
            }
            
        except Exception as e:
            logger.warning(f"Image analysis failed: {e}")
            return {
                'resolution_score': 0.5,
                'aspect_score': 0.5,
                'brightness_score': 0.5,
                'contrast_score': 0.5
            }
    
    def load_image_from_url(self, url: str) -> Optional[Image.Image]:
        """Load image from URL."""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
            return image
        except Exception as e:
            logger.error(f"Failed to load image from URL {url}: {e}")
            return None
    
    def predict(self, title: str, image: Optional[Image.Image] = None, 
                image_url: Optional[str] = None) -> PredictionResponse:
        """Generate rating prediction for a product."""
        # Load image if URL provided
        if image is None and image_url:
            image = self.load_image_from_url(image_url)
        
        # Analyze title and image
        title_analysis = self.analyze_title(title)
        image_analysis = self.analyze_image(image)
        
        # Calculate base rating
        base_rating = 3.0
        
        # Title contribution (40% weight)
        title_score = (
            title_analysis['title_length_score'] * 0.15 +
            title_analysis['positive_score'] * 0.35 +
            title_analysis['tech_score'] * 0.25 +
            title_analysis['brand_score'] * 0.25 +
            title_analysis['pattern_bonus'] * 0.15 -
            title_analysis['negative_penalty'] * 0.4
        )
        
        # Image contribution (60% weight)
        image_score = (
            image_analysis['resolution_score'] * 0.3 +
            image_analysis['aspect_score'] * 0.2 +
            image_analysis['brightness_score'] * 0.25 +
            image_analysis['contrast_score'] * 0.25
        )
        
        # Combine scores
        combined_score = title_score * 0.4 + image_score * 0.6
        rating_adjustment = combined_score * 2.5
        final_rating = base_rating + rating_adjustment
        
        # Add randomness and clamp
        final_rating += random.uniform(-0.15, 0.15)
        final_rating = max(1.0, min(5.0, final_rating))
        
        # Calculate confidence
        title_indicators = (
            title_analysis['positive_score'] + 
            title_analysis['tech_score'] + 
            title_analysis['brand_score'] +
            title_analysis['pattern_bonus']
        )
        
        image_indicators = (
            image_analysis['resolution_score'] +
            image_analysis['aspect_score'] +
            image_analysis['brightness_score'] +
            image_analysis['contrast_score']
        ) / 4
        
        confidence = (title_indicators * 0.4 + image_indicators * 0.6) * 100
        confidence = max(60.0, min(95.0, confidence))
        
        # Generate explanation
        explanation = self.generate_explanation(title_analysis, image_analysis, final_rating)
        
        return PredictionResponse(
            rating=round(final_rating, 1),
            confidence=round(confidence, 1),
            explanation=explanation
        )
    
    def generate_explanation(self, title_analysis: Dict[str, float], 
                           image_analysis: Dict[str, float], rating: float) -> str:
        """Generate human-readable explanation for the rating."""
        explanations = []
        
        # Title-based explanations
        if title_analysis['positive_score'] > 0.2:
            explanations.append("The title includes premium quality indicators")
        
        if title_analysis['tech_score'] > 0.1:
            explanations.append("Technical features mentioned suggest good functionality")
        
        if title_analysis['brand_score'] > 0.2:
            explanations.append("Recognizable brand name adds credibility")
        
        if title_analysis['negative_penalty'] > 0.2:
            explanations.append("Some keywords suggest budget positioning")
        
        # Image-based explanations
        if image_analysis['resolution_score'] > 0.7:
            explanations.append("High-resolution image suggests professional presentation")
        elif image_analysis['resolution_score'] < 0.3:
            explanations.append("Low image resolution may impact perceived quality")
        
        if image_analysis['brightness_score'] > 0.7:
            explanations.append("Well-lit product photo enhances appeal")
        
        # Rating-based summary
        if rating >= 4.5:
            summary = "This product shows strong indicators of high customer satisfaction"
        elif rating >= 4.0:
            summary = "This product appears likely to receive positive customer ratings"
        elif rating >= 3.5:
            summary = "This product shows moderate appeal to customers"
        elif rating >= 3.0:
            summary = "This product has average market appeal"
        else:
            summary = "This product may face challenges in customer satisfaction"
        
        # Combine explanations
        if explanations:
            explanation_text = ". ".join(explanations) + ". " + summary
        else:
            explanation_text = summary + " based on general product presentation"
        
        return explanation_text


class EnsemblePredictor:
    """Main predictor that combines different prediction methods."""
    
    def __init__(self):
        self.rule_based_predictor = RuleBasedPredictor()
        self.use_ai_mode = False  # Simplified version without AI
        
    def predict(self, title: str, image: Optional[Image.Image] = None, 
                image_url: Optional[str] = None, mode: str = "auto") -> PredictionResponse:
        """
        Generate prediction using the specified mode.
        
        Args:
            title: Product title
            image: PIL Image object (optional)
            image_url: Image URL (optional)
            mode: Prediction mode ("auto", "rule_based", "ai", "ensemble")
            
        Returns:
            PredictionResponse object
        """
        # For now, always use rule-based predictor
        return self.rule_based_predictor.predict(title, image, image_url)
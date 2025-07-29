# SnapRate API Documentation

## Overview

The SnapRate API is a RESTful service that predicts customer ratings for products based on their images and titles. The API uses AI models and rule-based heuristics to generate ratings on a scale of 1-5 stars with confidence scores and explanations.

**Base URL:** `http://localhost:8000` (development) or your deployed URL  
**API Version:** v1  
**Content-Type:** `application/json` or `multipart/form-data`

## Authentication

Currently, the API does not require authentication. Rate limiting is applied based on IP address.

## Rate Limiting

- **Limit:** 100 requests per minute per IP address
- **Headers:** Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoints

### 1. Root Endpoint

**GET** `/`

Returns basic API information and status.

#### Response

```json
{
  "message": "SnapRate API is running",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. Health Check

**GET** `/healthcheck`

Returns the health status of the API service.

#### Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Service status: "healthy", "unhealthy", or "degraded" |
| `version` | string | API version |
| `timestamp` | string | Current timestamp in ISO 8601 format |

### 3. Predict Product Rating

**POST** `/api/v1/predict`

Predicts a customer rating for a product based on its title and optional image.

#### Request

**Content-Type:** `multipart/form-data`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Product title (3-200 characters) |
| `image` | file | No | Product image file (JPEG, PNG, WebP, max 5MB) |
| `image_url` | string | No | URL to product image (alternative to file upload) |
| `mode` | string | No | Prediction mode: "auto", "rule_based", "ai", "ensemble" (default: "auto") |

#### Example Request (cURL)

```bash
# With image file
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "title=Premium Wireless Bluetooth Headphones" \
  -F "image=@product-image.jpg" \
  -F "mode=auto"

# With image URL
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "title=Premium Wireless Bluetooth Headphones" \
  -F "image_url=https://example.com/product-image.jpg" \
  -F "mode=auto"

# Title only
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "title=Premium Wireless Bluetooth Headphones" \
  -F "mode=auto"
```

#### Response (Success)

**Status Code:** `200 OK`

```json
{
  "rating": 4.2,
  "confidence": 85.5,
  "explanation": "The product has an appealing visual design with clear branding. The title suggests premium quality features that typically receive positive ratings."
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `rating` | float | Predicted rating (1.0-5.0, rounded to 1 decimal place) |
| `confidence` | float | Confidence percentage (0.0-100.0, rounded to 1 decimal place) |
| `explanation` | string | Human-readable explanation of the rating factors |

### 4. Get Prediction Modes

**GET** `/api/v1/predict/modes`

Returns available prediction modes and their descriptions.

#### Response

```json
{
  "modes": {
    "auto": {
      "description": "Automatically selects the best available prediction method",
      "recommended": true
    },
    "rule_based": {
      "description": "Uses rule-based heuristics for prediction (MVP mode)",
      "recommended": false
    },
    "ai": {
      "description": "Uses AI models for more accurate predictions",
      "recommended": true,
      "available": true
    },
    "ensemble": {
      "description": "Combines rule-based and AI predictions for best results",
      "recommended": true,
      "available": true
    }
  },
  "default": "auto",
  "ai_available": true
}
```

### 5. Prediction Service Health

**GET** `/api/v1/predict/health`

Checks the health of prediction services.

#### Response

```json
{
  "status": "healthy",
  "services": {
    "rule_based_predictor": "healthy",
    "ai_predictor": "healthy",
    "ensemble_predictor": "healthy"
  },
  "ai_mode_available": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error information in JSON format.

### Error Response Format

```json
{
  "status_code": 400,
  "message": "Invalid input provided",
  "details": {
    "field": "title",
    "error": "Title must be at least 3 characters long"
  }
}
```

### HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid input parameters, missing required fields |
| `422` | Unprocessable Entity | Validation errors in request data |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side processing error |

### Common Error Scenarios

#### 1. Missing Title

**Status:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Title is required and cannot be empty"
}
```

#### 2. Invalid Title

**Status:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Title must be at least 3 characters long"
}
```

#### 3. Both Image File and URL Provided

**Status:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Please provide either an image file or image URL, not both"
}
```

#### 4. Invalid Image Format

**Status:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Invalid image format. Supported formats: JPEG, PNG, WebP"
}
```

#### 5. Image Too Large

**Status:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Image file size exceeds maximum limit of 5MB"
}
```

#### 6. Invalid Prediction Mode

**Status:** `400 Bad Request`

```json
{
  "status_code": 400,
  "message": "Invalid mode. Must be one of: auto, rule_based, ai, ensemble"
}
```

#### 7. Rate Limit Exceeded

**Status:** `429 Too Many Requests`

```json
{
  "status_code": 429,
  "message": "Rate limit exceeded. Please try again later."
}
```

#### 8. Validation Error

**Status:** `422 Unprocessable Entity`

```json
{
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
```

## Request/Response Examples

### Example 1: Complete Request with Image File

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "title=Apple iPhone 15 Pro Max 256GB Space Black" \
  -F "image=@iphone-image.jpg" \
  -F "mode=ensemble"
```

**Response:**
```json
{
  "rating": 4.7,
  "confidence": 92.3,
  "explanation": "High-quality product image shows premium build quality and design. The title indicates a well-known brand with specific technical specifications, suggesting reliability and desirability. Premium pricing tier typically correlates with positive customer satisfaction."
}
```

### Example 2: Title-Only Request

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "title=Budget Wireless Earbuds - Basic Sound Quality" \
  -F "mode=rule_based"
```

**Response:**
```json
{
  "rating": 3.2,
  "confidence": 68.5,
  "explanation": "The title suggests a budget product with basic features. Terms like 'budget' and 'basic' typically indicate lower-tier products that receive moderate ratings. Lack of premium features or brand recognition may limit customer satisfaction."
}
```

### Example 3: Image URL Request

**Request:**
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -F "title=Professional DSLR Camera with 24-70mm Lens" \
  -F "image_url=https://example.com/camera-image.jpg" \
  -F "mode=ai"
```

**Response:**
```json
{
  "rating": 4.5,
  "confidence": 88.7,
  "explanation": "Professional-grade equipment with technical specifications appeals to serious photographers. The image shows high build quality and professional design elements. Products in this category typically receive high ratings from knowledgeable users."
}
```

## SDK and Integration Examples

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function predictRating(title, imagePath, mode = 'auto') {
  const form = new FormData();
  form.append('title', title);
  form.append('mode', mode);
  
  if (imagePath) {
    form.append('image', fs.createReadStream(imagePath));
  }
  
  try {
    const response = await axios.post('http://localhost:8000/api/v1/predict', form, {
      headers: form.getHeaders()
    });
    
    return response.data;
  } catch (error) {
    console.error('Prediction failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
predictRating('Premium Wireless Headphones', './product-image.jpg')
  .then(result => console.log('Rating:', result.rating))
  .catch(error => console.error('Error:', error));
```

### Python

```python
import requests

def predict_rating(title, image_path=None, image_url=None, mode='auto'):
    url = 'http://localhost:8000/api/v1/predict'
    
    data = {
        'title': title,
        'mode': mode
    }
    
    files = {}
    if image_path:
        files['image'] = open(image_path, 'rb')
    elif image_url:
        data['image_url'] = image_url
    
    try:
        response = requests.post(url, data=data, files=files)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Prediction failed: {e}')
        raise
    finally:
        # Close file if opened
        if 'image' in files:
            files['image'].close()

# Usage
result = predict_rating('Premium Wireless Headphones', image_path='product-image.jpg')
print(f"Rating: {result['rating']}, Confidence: {result['confidence']}%")
```

## Best Practices

### 1. Image Optimization
- Use high-quality product images for better predictions
- Ensure images are well-lit and show the product clearly
- Recommended image size: 800x800 pixels or larger
- Supported formats: JPEG, PNG, WebP

### 2. Title Guidelines
- Use descriptive, specific titles
- Include brand names and key features
- Avoid excessive capitalization or special characters
- Keep titles between 10-100 characters for optimal results

### 3. Error Handling
- Always check response status codes
- Implement retry logic for transient errors (5xx)
- Handle rate limiting gracefully with exponential backoff
- Validate inputs on the client side before sending requests

### 4. Performance
- Cache prediction results when appropriate
- Use appropriate prediction modes based on your needs
- Consider batch processing for multiple products
- Monitor response times and adjust timeout settings

## Changelog

### Version 1.0.0
- Initial API release
- Basic prediction functionality
- Support for image upload and URL input
- Multiple prediction modes
- Rate limiting and error handling
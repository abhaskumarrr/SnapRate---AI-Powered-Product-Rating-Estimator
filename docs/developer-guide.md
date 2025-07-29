# SnapRate Developer Guide

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Setup and Installation](#setup-and-installation)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [Troubleshooting](#troubleshooting)

## Project Overview

SnapRate is an AI-powered product rating estimator that predicts customer ratings (1-5 stars) based on product images and titles. The application simulates first-impression-based ratings that customers subconsciously make while browsing products online.

### Key Features

- **Multi-input Support**: Camera capture, file upload, and URL input for images
- **AI-Powered Predictions**: Rule-based and AI model predictions with ensemble mode
- **Mobile-First Design**: Responsive PWA with offline capabilities
- **Modular Architecture**: Decoupled frontend and backend for scalability
- **Developer-Friendly**: Comprehensive API documentation and testing suite

### Technology Stack

#### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS 4.x
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Testing**: Vitest + Testing Library
- **Build Tools**: Vite, ESLint, Prettier

#### Backend
- **Framework**: FastAPI
- **Runtime**: Python 3.9+
- **AI/ML**: Transformers, PyTorch, Sentence Transformers
- **Image Processing**: Pillow
- **Testing**: pytest
- **Production**: Gunicorn, Uvicorn

## Architecture

SnapRate follows a client-server architecture with clear separation of concerns:

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│                 │ ◄──────────────► │                 │
│   React Frontend│                  │  FastAPI Backend│
│                 │                  │                 │
│  - UI Components│                  │  - API Endpoints│
│  - State Mgmt   │                  │  - AI Models    │
│  - PWA Features │                  │  - Data Proc.   │
│                 │                  │                 │
└─────────────────┘                  └─────────────────┘
```

### Core Components

1. **Frontend Components**:
   - Image Input (camera, upload, URL)
   - Title Input with validation
   - Prediction Button with loading states
   - Result Display with animations

2. **Backend Services**:
   - Input processing and validation
   - AI prediction models (rule-based + ML)
   - Rate limiting and security
   - Health monitoring

## Project Structure

```
snaprate/
├── README.md
├── docker-compose.yml
├── docs/
│   ├── api.md                    # API documentation
│   ├── developer-guide.md        # This file
│   └── ci-cd.md                 # CI/CD documentation
├── frontend/
│   ├── public/
│   │   ├── icons/               # PWA icons
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js               # Service worker
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── ImageInput.jsx
│   │   │   ├── TitleInput.jsx
│   │   │   ├── PredictionButton.jsx
│   │   │   ├── ResultDisplay.jsx
│   │   │   └── animations/     # Animation components
│   │   ├── utils/
│   │   │   ├── apiClient.js    # API communication
│   │   │   ├── env.js          # Environment config
│   │   │   └── pwa.js          # PWA utilities
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── scripts/                # Build and utility scripts
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI application
│   │   ├── config.py           # Configuration
│   │   ├── models.py           # Pydantic models
│   │   ├── input_processor.py  # Input validation
│   │   ├── prediction_service.py # AI prediction logic
│   │   ├── rate_limiter.py     # Rate limiting
│   │   └── routers/
│   │       ├── health.py       # Health endpoints
│   │       └── prediction.py   # Prediction endpoints
│   ├── tests/                  # Test suite
│   ├── scripts/                # Deployment scripts
│   ├── requirements.txt
│   └── Dockerfile
└── .github/
    └── workflows/              # CI/CD workflows
```

## Setup and Installation

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **Python**: 3.9 or higher
- **Yarn**: 1.22.0 or higher (required for frontend)
- **Docker**: Optional, for containerized development

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd snaprate
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the backend
python -m app.main
# Or with uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (yarn is required)
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
yarn dev
```

#### 4. Docker Setup (Alternative)

```bash
# Start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Configuration

#### Backend Environment Variables

Create `backend/.env`:

```env
# Application
APP_NAME=SnapRate API
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# Server
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=true
WORKERS=1

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# AI Models
USE_AI_MODE=true
MODEL_CACHE_DIR=./models

# Logging
LOG_LEVEL=INFO
```

#### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000

# Application
VITE_APP_NAME=SnapRate
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false

# Development
VITE_DEBUG=true
```

## Development Workflow

### Code Style and Formatting

#### Frontend

```bash
# Linting
yarn lint              # Check for issues
yarn lint:fix          # Fix auto-fixable issues

# Formatting
yarn format            # Format code
yarn format:check      # Check formatting
```

#### Backend

```bash
# Install development tools
pip install black isort mypy

# Format code
black app/
isort app/

# Type checking
mypy app/
```

### Git Workflow

1. **Feature Development**:
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

2. **Pull Request**:
   - Create PR against `main` branch
   - Ensure all tests pass
   - Request code review
   - Address feedback

3. **Commit Message Format**:
   ```
   type(scope): description
   
   Types: feat, fix, docs, style, refactor, test, chore
   Examples:
   - feat(api): add image URL support
   - fix(ui): resolve mobile layout issue
   - docs: update API documentation
   ```

### Development Commands

#### Frontend Commands

```bash
# Development
yarn dev                    # Start dev server
yarn build                  # Production build
yarn build:analyze          # Build with bundle analysis
yarn preview               # Preview production build

# Testing
yarn test                  # Run tests in watch mode
yarn test:run              # Run tests once
yarn test:coverage         # Run with coverage

# Environment validation
yarn validate:env          # Validate development env
yarn validate:env:prod     # Validate production env

# Utilities
yarn clean                 # Clean build artifacts
```

#### Backend Commands

```bash
# Development
python -m app.main         # Start development server
uvicorn app.main:app --reload  # Alternative start method

# Testing
pytest                     # Run all tests
pytest --cov              # Run with coverage
pytest tests/test_api.py   # Run specific test file

# Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Testing

### Frontend Testing

#### Test Structure

```javascript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TitleInput from './TitleInput';

describe('TitleInput', () => {
  it('validates title length', () => {
    const onTitleChange = vi.fn();
    render(<TitleInput onTitleChange={onTitleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'ab' } });
    
    expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument();
  });
});
```

#### Running Tests

```bash
# Watch mode (development)
yarn test

# Single run (CI)
yarn test:run

# Coverage report
yarn test:coverage
```

### Backend Testing

#### Test Structure

```python
# API test example
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_predict_endpoint():
    response = client.post(
        "/api/v1/predict",
        data={"title": "Test Product"},
        files={"image": ("test.jpg", b"fake image data", "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "rating" in data
    assert 1.0 <= data["rating"] <= 5.0
```

#### Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_prediction_endpoint.py

# With coverage
pytest --cov=app --cov-report=html

# Verbose output
pytest -v
```

### End-to-End Testing

E2E tests are located in `frontend/src/e2e.test.jsx` and test complete user workflows:

```bash
# Run E2E tests
yarn test e2e.test.jsx
```

## Deployment

### Production Build

#### Frontend

```bash
# Production build
yarn build:prod

# Staging build
yarn build:staging

# CI build (skip tests)
yarn build:ci
```

#### Backend

```bash
# Install production dependencies only
pip install -r requirements.txt --no-dev

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configurations

#### Production Environment

- Disable debug mode
- Use production database
- Enable security headers
- Configure proper CORS origins
- Set up monitoring and logging

#### Staging Environment

- Mirror production configuration
- Use staging database
- Enable additional logging
- Allow broader CORS for testing

### CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment:

- **On Pull Request**: Run tests, linting, and security checks
- **On Merge to Main**: Deploy to staging environment
- **On Release Tag**: Deploy to production environment

See `.github/workflows/` for detailed pipeline configurations.

## Contributing

### Code Review Guidelines

1. **Code Quality**:
   - Follow established patterns and conventions
   - Write clear, self-documenting code
   - Include appropriate comments for complex logic
   - Ensure proper error handling

2. **Testing**:
   - Write tests for new features
   - Maintain or improve test coverage
   - Test edge cases and error conditions
   - Update integration tests as needed

3. **Documentation**:
   - Update API documentation for endpoint changes
   - Add inline code documentation
   - Update README for setup changes
   - Include examples for new features

### Pull Request Process

1. **Before Creating PR**:
   - Ensure all tests pass locally
   - Run linting and formatting tools
   - Update documentation if needed
   - Test in multiple environments

2. **PR Description**:
   - Clear description of changes
   - Link to related issues
   - Include screenshots for UI changes
   - List breaking changes if any

3. **Review Process**:
   - At least one approval required
   - Address all review comments
   - Ensure CI checks pass
   - Squash commits before merge

### Development Best Practices

#### Frontend

- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Implement proper error boundaries
- Optimize for performance (lazy loading, memoization)
- Ensure accessibility compliance

#### Backend

- Follow FastAPI best practices
- Use Pydantic for data validation
- Implement proper error handling
- Write comprehensive tests
- Document API endpoints thoroughly

#### General

- Keep functions small and focused
- Use meaningful variable and function names
- Avoid deep nesting
- Handle errors gracefully
- Write self-documenting code

## Troubleshooting

### Common Issues

#### Frontend Issues

**1. Build Failures**

```bash
# Clear cache and reinstall
yarn clean
rm -rf node_modules
yarn install
```

**2. Environment Variable Issues**

```bash
# Validate environment configuration
yarn validate:env

# Check for missing variables
cat .env.local
```

**3. API Connection Issues**

- Verify backend is running on correct port
- Check CORS configuration
- Validate API URL in environment variables

#### Backend Issues

**1. Import Errors**

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**2. Model Loading Issues**

- Check model cache directory permissions
- Verify internet connection for model downloads
- Clear model cache if corrupted

**3. Database Connection Issues**

- Verify database configuration
- Check connection strings
- Ensure database service is running

#### Docker Issues

**1. Build Failures**

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**2. Port Conflicts**

```bash
# Check port usage
lsof -i :8000
lsof -i :3000

# Stop conflicting services
docker-compose down
```

### Debugging Tips

#### Frontend Debugging

```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check API responses
console.log('API Response:', response.data);

// Monitor state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

#### Backend Debugging

```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)

# Add debug prints
logger.debug(f"Processing request: {request}")

# Use debugger
import pdb; pdb.set_trace()
```

### Performance Optimization

#### Frontend

- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize images and assets
- Use code splitting and lazy loading

#### Backend

- Implement caching for expensive operations
- Use async/await for I/O operations
- Optimize database queries
- Monitor memory usage

### Getting Help

1. **Documentation**: Check this guide and API documentation
2. **Issues**: Search existing GitHub issues
3. **Logs**: Check application logs for error details
4. **Community**: Reach out to the development team

### Useful Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Docker Documentation](https://docs.docker.com/)

---

For additional help or questions, please refer to the project's issue tracker or contact the development team.
#!/bin/bash
# Backend deployment script for SnapRate
# This script deploys the backend to a production environment

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-production}
IMAGE_NAME="snaprate-backend"
IMAGE_TAG=$(date +%Y%m%d%H%M%S)
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_IMAGE_NAME="${IMAGE_NAME}:latest"

# Display banner
echo "=================================================="
echo "SnapRate Backend Deployment - ${ENVIRONMENT}"
echo "=================================================="
echo "Image: ${FULL_IMAGE_NAME}"
echo "Environment: ${ENVIRONMENT}"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Build the Docker image
echo "🏗️ Building Docker image..."
docker build -t ${FULL_IMAGE_NAME} -t ${LATEST_IMAGE_NAME} .

# Run tests before deployment
echo "🧪 Running tests..."
docker run --rm ${FULL_IMAGE_NAME} pytest

# Tag the image for the environment
ENV_IMAGE_NAME="${IMAGE_NAME}:${ENVIRONMENT}"
docker tag ${FULL_IMAGE_NAME} ${ENV_IMAGE_NAME}

# Push the image to a registry (if configured)
if [ -n "${DOCKER_REGISTRY}" ]; then
    echo "📦 Pushing image to registry..."
    docker tag ${FULL_IMAGE_NAME} ${DOCKER_REGISTRY}/${FULL_IMAGE_NAME}
    docker tag ${ENV_IMAGE_NAME} ${DOCKER_REGISTRY}/${ENV_IMAGE_NAME}
    docker tag ${LATEST_IMAGE_NAME} ${DOCKER_REGISTRY}/${LATEST_IMAGE_NAME}
    
    docker push ${DOCKER_REGISTRY}/${FULL_IMAGE_NAME}
    docker push ${DOCKER_REGISTRY}/${ENV_IMAGE_NAME}
    docker push ${DOCKER_REGISTRY}/${LATEST_IMAGE_NAME}
fi

# Deploy to the target environment
case ${ENVIRONMENT} in
    production)
        echo "🚀 Deploying to production..."
        # Add production deployment commands here
        # Example: ssh user@production-server "docker pull ${DOCKER_REGISTRY}/${ENV_IMAGE_NAME} && docker-compose up -d"
        ;;
    staging)
        echo "🚀 Deploying to staging..."
        # Add staging deployment commands here
        ;;
    *)
        echo "⚠️ Unknown environment: ${ENVIRONMENT}"
        echo "Valid environments: production, staging"
        exit 1
        ;;
esac

echo "✅ Deployment completed successfully!"
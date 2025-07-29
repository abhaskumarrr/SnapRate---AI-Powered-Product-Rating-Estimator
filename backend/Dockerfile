# Build stage
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pip tools
RUN pip install --no-cache-dir pip-tools wheel setuptools

# Copy requirements first for better caching
COPY requirements.txt .

# Generate optimized requirements
RUN pip-compile requirements.txt --output-file requirements.lock

# Install Python dependencies
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.lock

# Runtime stage
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system app && \
    adduser --system --group app

# Copy wheels from builder stage
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.lock .

# Install Python dependencies
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.lock && \
    rm -rf /wheels

# Copy application code
COPY app/ ./app/
COPY .env.production ./.env.production

# Create necessary directories with proper permissions
RUN mkdir -p /tmp/snaprate && \
    chown -R app:app /app /tmp/snaprate

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV WORKERS=4

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/healthcheck || exit 1

# Run the application with production settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--no-access-log", "--proxy-headers"]
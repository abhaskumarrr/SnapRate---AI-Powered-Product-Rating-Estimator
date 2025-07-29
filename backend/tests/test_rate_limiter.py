import pytest
import asyncio
import time
from unittest.mock import Mock, AsyncMock, patch
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.testclient import TestClient

from app.rate_limiter import (
    RateLimitConfig,
    TokenBucket,
    RateLimitStore,
    RateLimitMiddleware,
    check_rate_limit,
    create_rate_limit_response
)


class TestRateLimitConfig:
    """Test cases for RateLimitConfig"""
    
    def test_default_config(self):
        """Test default rate limit configuration"""
        config = RateLimitConfig()
        assert config.requests_per_minute == 60
        assert config.requests_per_hour == 1000
        assert config.burst_limit == 10
        assert config.cleanup_interval == 300
    
    def test_custom_config(self):
        """Test custom rate limit configuration"""
        config = RateLimitConfig(
            requests_per_minute=30,
            requests_per_hour=500,
            burst_limit=5,
            cleanup_interval=600
        )
        assert config.requests_per_minute == 30
        assert config.requests_per_hour == 500
        assert config.burst_limit == 5
        assert config.cleanup_interval == 600


class TestTokenBucket:
    """Test cases for TokenBucket"""
    
    @pytest.mark.asyncio
    async def test_token_bucket_creation(self):
        """Test token bucket creation"""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        assert bucket.capacity == 10
        assert bucket.tokens == 10
        assert bucket.refill_rate == 1.0
    
    @pytest.mark.asyncio
    async def test_consume_tokens_success(self):
        """Test successful token consumption"""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        # Should be able to consume tokens
        result = await bucket.consume(5)
        assert result is True
        assert bucket.tokens == 5
    
    @pytest.mark.asyncio
    async def test_consume_tokens_insufficient(self):
        """Test token consumption when insufficient tokens"""
        bucket = TokenBucket(capacity=10, refill_rate=1.0)
        
        # Consume all tokens
        await bucket.consume(10)
        
        # Should not be able to consume more
        result = await bucket.consume(1)
        assert result is False
        assert bucket.tokens < 1  # Allow for floating point precision
    
    @pytest.mark.asyncio
    async def test_token_refill(self):
        """Test token refill over time"""
        bucket = TokenBucket(capacity=10, refill_rate=2.0)  # 2 tokens per second
        
        # Consume all tokens
        await bucket.consume(10)
        assert bucket.tokens == 0
        
        # Wait and check refill (simulate time passage)
        bucket.last_refill = time.time() - 1.0  # 1 second ago
        result = await bucket.consume(1)
        assert result is True  # Should have refilled 2 tokens
    
    def test_get_wait_time(self):
        """Test wait time calculation"""
        bucket = TokenBucket(capacity=10, refill_rate=2.0)
        bucket.tokens = 0
        
        # Need 4 tokens, refill rate is 2/second, so wait time is 2 seconds
        wait_time = bucket.get_wait_time(4)
        assert wait_time == 2.0
        
        # If we have enough tokens, wait time should be 0
        bucket.tokens = 5
        wait_time = bucket.get_wait_time(3)
        assert wait_time == 0.0


class TestRateLimitStore:
    """Test cases for RateLimitStore"""
    
    @pytest.fixture
    def config(self):
        """Create test configuration"""
        return RateLimitConfig(
            requests_per_minute=5,
            requests_per_hour=20,
            burst_limit=3,
            cleanup_interval=60
        )
    
    @pytest.fixture
    def store(self, config):
        """Create rate limit store for testing"""
        return RateLimitStore(config)
    
    @pytest.mark.asyncio
    async def test_first_request_allowed(self, store):
        """Test that first request is allowed"""
        is_allowed, headers = await store.is_allowed("test_client")
        
        assert is_allowed is True
        assert "X-RateLimit-Remaining-Minute" in headers
        assert "X-RateLimit-Remaining-Hour" in headers
    
    @pytest.mark.asyncio
    async def test_burst_limit_exceeded(self, store):
        """Test burst limit enforcement"""
        client_id = "burst_test_client"
        
        # Make requests up to burst limit
        for i in range(3):  # burst_limit = 3
            is_allowed, _ = await store.is_allowed(client_id)
            assert is_allowed is True
        
        # Next request should be blocked
        is_allowed, headers = await store.is_allowed(client_id)
        assert is_allowed is False
        assert "X-RateLimit-Limit" in headers
        assert "Retry-After" in headers
    
    @pytest.mark.asyncio
    async def test_minute_limit_exceeded(self, store):
        """Test minute limit enforcement"""
        client_id = "minute_test_client"
        
        # Directly manipulate the request history to test minute limit
        # This bypasses the burst limit which would interfere with the test
        now = time.time()
        history = store.request_history[client_id]
        
        # Add exactly the minute limit (5) of requests within the last minute
        for i in range(5):
            history.append(now - 30 + i * 5)  # 5 requests in last 30 seconds
        
        # Try to make another request - should be blocked by minute limit
        is_allowed, headers = await store.is_allowed(client_id)
        assert is_allowed is False
        assert headers["X-RateLimit-Window"] == "minute"
    
    @pytest.mark.asyncio
    async def test_hour_limit_exceeded(self, store):
        """Test hour limit enforcement"""
        client_id = "hour_test_client"
        
        # Fill up the hour limit by making actual requests
        # We need to bypass the burst limit by using a different approach
        
        # Directly add requests to history to simulate hour limit being reached
        now = time.time()
        history = store.request_history[client_id]
        
        # Add exactly the hour limit (20) of recent requests
        for i in range(20):
            history.append(now - 1800 + i * 90)  # Spread over last 30 minutes
        
        # Try to make another request - should be blocked by hour limit
        is_allowed, headers = await store.is_allowed(client_id)
        assert is_allowed is False
        assert headers["X-RateLimit-Window"] == "hour"
    
    @pytest.mark.asyncio
    async def test_cleanup_old_entries(self, store):
        """Test cleanup of old request history"""
        client_id = "cleanup_test_client"
        
        # Add old entries
        old_time = time.time() - 7200  # 2 hours ago
        history = store.request_history[client_id]
        history.extend([old_time + i for i in range(10)])
        
        # Trigger cleanup
        await store._cleanup()
        
        # Old entries should be removed
        assert len(history) == 0
        assert client_id not in store.request_history


class TestRateLimitMiddleware:
    """Test cases for RateLimitMiddleware"""
    
    @pytest.fixture
    def app(self):
        """Create test FastAPI app"""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint():
            return {"message": "success"}
        
        @app.get("/healthcheck")
        async def health_endpoint():
            return {"status": "healthy"}
        
        return app
    
    @pytest.fixture
    def config(self):
        """Create test configuration with low limits"""
        return RateLimitConfig(
            requests_per_minute=3,
            requests_per_hour=10,
            burst_limit=2,
            cleanup_interval=60
        )
    
    @pytest.fixture
    def middleware_app(self, app, config):
        """Create app with rate limiting middleware"""
        app.add_middleware(RateLimitMiddleware, config=config)
        return app
    
    def test_excluded_paths_not_rate_limited(self, middleware_app):
        """Test that excluded paths are not rate limited"""
        client = TestClient(middleware_app)
        
        # Make many requests to health endpoint
        for _ in range(10):
            response = client.get("/healthcheck")
            assert response.status_code == 200
    
    def test_rate_limiting_applied(self, middleware_app):
        """Test that rate limiting is applied to regular endpoints"""
        client = TestClient(middleware_app)
        
        # First few requests should succeed
        for i in range(2):  # burst_limit = 2
            response = client.get("/test")
            assert response.status_code == 200
            assert "X-RateLimit-Remaining-Minute" in response.headers
        
        # Next request should be rate limited
        response = client.get("/test")
        assert response.status_code == 429
        assert "Retry-After" in response.headers
    
    def test_client_id_extraction_forwarded_for(self, app, config):
        """Test client ID extraction from X-Forwarded-For header"""
        middleware = RateLimitMiddleware(app, config)
        
        # Mock request with X-Forwarded-For header
        request = Mock(spec=Request)
        request.headers = {"X-Forwarded-For": "192.168.1.1, 10.0.0.1"}
        request.client = Mock()
        request.client.host = "127.0.0.1"
        
        client_id = middleware.get_client_id(request)
        assert client_id == "192.168.1.1"
    
    def test_client_id_extraction_real_ip(self, app, config):
        """Test client ID extraction from X-Real-IP header"""
        middleware = RateLimitMiddleware(app, config)
        
        # Mock request with X-Real-IP header
        request = Mock(spec=Request)
        request.headers = {"X-Real-IP": "192.168.1.2"}
        request.client = Mock()
        request.client.host = "127.0.0.1"
        
        client_id = middleware.get_client_id(request)
        assert client_id == "192.168.1.2"
    
    def test_client_id_extraction_fallback(self, app, config):
        """Test client ID extraction fallback to direct IP"""
        middleware = RateLimitMiddleware(app, config)
        
        # Mock request without proxy headers
        request = Mock(spec=Request)
        request.headers = {}
        request.client = Mock()
        request.client.host = "127.0.0.1"
        
        client_id = middleware.get_client_id(request)
        assert client_id == "127.0.0.1"
    
    def test_client_id_extraction_no_client(self, app, config):
        """Test client ID extraction when no client info available"""
        middleware = RateLimitMiddleware(app, config)
        
        # Mock request without client info
        request = Mock(spec=Request)
        request.headers = {}
        request.client = None
        
        client_id = middleware.get_client_id(request)
        assert client_id == "unknown"


class TestUtilityFunctions:
    """Test utility functions"""
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_function(self):
        """Test manual rate limit check function"""
        config = RateLimitConfig(burst_limit=2)
        
        # First request should be allowed
        is_allowed, headers = await check_rate_limit("test_client", config)
        assert is_allowed is True
        assert "X-RateLimit-Remaining-Minute" in headers
    
    def test_create_rate_limit_response(self):
        """Test rate limit response creation"""
        headers = {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60"
        }
        
        response = create_rate_limit_response(headers)
        
        assert response.status_code == 429
        assert response.headers["X-RateLimit-Limit"] == "10"
        assert response.headers["Retry-After"] == "60"
        
        # Check response body
        import json
        body = json.loads(response.body)
        assert body["status_code"] == 429
        assert body["message"] == "Rate limit exceeded"
        assert "retry_after" in body["details"]


class TestIntegration:
    """Integration tests for rate limiting"""
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test rate limiting with concurrent requests"""
        config = RateLimitConfig(burst_limit=3)
        store = RateLimitStore(config)
        
        # Make concurrent requests
        tasks = []
        for i in range(5):
            task = asyncio.create_task(store.is_allowed(f"client_{i}"))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # All should be allowed since they're different clients
        for is_allowed, headers in results:
            assert is_allowed is True
    
    @pytest.mark.asyncio
    async def test_same_client_concurrent_requests(self):
        """Test rate limiting with concurrent requests from same client"""
        config = RateLimitConfig(burst_limit=2)
        store = RateLimitStore(config)
        
        # Make concurrent requests from same client
        tasks = []
        for i in range(4):
            task = asyncio.create_task(store.is_allowed("same_client"))
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # Some should be allowed, some should be blocked
        allowed_count = sum(1 for is_allowed, _ in results if is_allowed)
        blocked_count = sum(1 for is_allowed, _ in results if not is_allowed)
        
        assert allowed_count <= 2  # burst_limit
        assert blocked_count >= 2  # excess requests
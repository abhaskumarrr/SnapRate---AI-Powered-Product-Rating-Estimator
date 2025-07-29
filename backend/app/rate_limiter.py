"""
Simple rate limiter for SnapRate API.
"""

import time
import logging
from typing import Dict, Tuple
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

class SimpleRateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, requests_per_minute: int = 100):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, identifier: str) -> Tuple[bool, int]:
        """
        Check if request is allowed for the given identifier.
        
        Args:
            identifier: Client identifier (usually IP address)
            
        Returns:
            Tuple of (is_allowed, remaining_requests)
        """
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        client_requests = self.requests[identifier]
        while client_requests and client_requests[0] < minute_ago:
            client_requests.popleft()
        
        # Check if under limit
        if len(client_requests) < self.requests_per_minute:
            client_requests.append(now)
            remaining = self.requests_per_minute - len(client_requests)
            return True, remaining
        else:
            return False, 0
    
    def get_reset_time(self, identifier: str) -> int:
        """Get the time when the rate limit resets for the identifier."""
        client_requests = self.requests[identifier]
        if not client_requests:
            return int(time.time())
        
        # Reset time is 60 seconds after the oldest request
        return int(client_requests[0] + 60)

# Global rate limiter instance
rate_limiter = SimpleRateLimiter()
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface ApiKeyConfig {
  key: string;
  name: string;
  rateLimit: RateLimitConfig;
  enabled: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

import { ApiKeyConfig } from '../types/rateLimit';

/**
 * Configuration for API keys and their rate limits
 * In a production environment, this would be loaded from a database or configuration service
 */
export const apiKeyConfigs: Map<string, ApiKeyConfig> = new Map([
  [
    'demo-key-basic',
    {
      key: 'demo-key-basic',
      name: 'Basic Plan',
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 10, // 10 requests per minute
      },
      enabled: true,
    },
  ],
  [
    'demo-key-premium',
    {
      key: 'demo-key-premium',
      name: 'Premium Plan',
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100, // 100 requests per minute
      },
      enabled: true,
    },
  ],
  [
    'demo-key-enterprise',
    {
      key: 'demo-key-enterprise',
      name: 'Enterprise Plan',
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 1000, // 1000 requests per minute
      },
      enabled: true,
    },
  ],
]);

export function getApiKeyConfig(apiKey: string): ApiKeyConfig | undefined {
  return apiKeyConfigs.get(apiKey);
}

export function isValidApiKey(apiKey: string): boolean {
  const config = apiKeyConfigs.get(apiKey);
  return config !== undefined && config.enabled;
}

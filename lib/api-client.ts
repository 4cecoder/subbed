import { apiCache, requestDeduper, CACHE_KEYS } from './cache';

interface ApiResponse<T> {
  data: T;
  cached: boolean;
  timestamp: number;
}

class ApiClient {
  private baseUrl = '';

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttlSeconds: number = 300
  ): Promise<ApiResponse<T>> {
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return {
        data: cached,
        cached: true,
        timestamp: Date.now(),
      };
    }

    // Dedupe concurrent requests
    return requestDeduper.dedupe(cacheKey, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache the response
      apiCache.set(cacheKey, data, ttlSeconds);

      return {
        data,
        cached: false,
        timestamp: Date.now(),
      };
    });
  }

  async getSubscriptions(): Promise<ApiResponse<unknown[]>> {
    const url = `${this.baseUrl}/api/subscriptions`;
    return this.fetchWithCache(url, CACHE_KEYS.SUBSCRIPTIONS, 60); // 1 minute cache
  }

  async getSettings(): Promise<ApiResponse<unknown>> {
    const url = `${this.baseUrl}/api/settings`;
    return this.fetchWithCache(url, CACHE_KEYS.SETTINGS, 300); // 5 minutes cache
  }

  async getFeed(
    page: number,
    perPage: number,
    query: string,
    type: string
  ): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      q: query,
      type,
    });
    const url = `${this.baseUrl}/api/feed?${params}`;
    const cacheKey = CACHE_KEYS.FEED(page, perPage, query, type);
    return this.fetchWithCache(url, cacheKey, 180); // 3 minutes cache
  }

  async getRssFeed(channelId: string, limit: number, type: string): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({
      id: channelId,
      limit: limit.toString(),
      type,
    });
    const url = `${this.baseUrl}/api/rss?${params}`;
    const cacheKey = CACHE_KEYS.RSS(channelId, limit, type);
    return this.fetchWithCache(url, cacheKey, 300); // 5 minutes cache
  }

  async resolveChannel(url: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/resolve?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || response.statusText);
    }
    return response.json();
  }

  async saveSettings(settings: unknown): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to save settings');
    }

    const data = await response.json();

    // Invalidate settings cache
    apiCache.set(CACHE_KEYS.SETTINGS, data.settings, 300);

    return data;
  }

  async addSubscription(subscription: {
    id: string;
    title: string | null;
    url: string;
  }): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || response.statusText);
    }

    // Invalidate subscriptions cache
    apiCache.set(CACHE_KEYS.SUBSCRIPTIONS, null, 0);

    return response.json();
  }

  async removeSubscription(id: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/subscriptions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription');
    }

    // Invalidate subscriptions cache
    apiCache.set(CACHE_KEYS.SUBSCRIPTIONS, null, 0);

    return response.json();
  }

  async clearSubscriptions(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/subscriptions`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear subscriptions');
    }

    // Invalidate subscriptions cache
    apiCache.set(CACHE_KEYS.SUBSCRIPTIONS, null, 0);

    return response.json();
  }

  // Sync data between local and Convex
  async syncData(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to sync data');
    }

    const data = await response.json();

    // Clear all caches after sync
    this.clearCache();

    return data;
  }

  // Clear all caches
  clearCache(): void {
    apiCache.clear();
    requestDeduper.clear();
  }
}

export const apiClient = new ApiClient();

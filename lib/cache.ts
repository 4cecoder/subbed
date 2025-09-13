// Simple in-memory cache with TTL support
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Request deduplication
class RequestDeduper {
  private pendingRequests = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

// Global instances
export const apiCache = new MemoryCache();
export const requestDeduper = new RequestDeduper();

// Cache keys
export const CACHE_KEYS = {
  SUBSCRIPTIONS: 'subscriptions',
  SETTINGS: 'settings',
  FEED: (page: number, perPage: number, query: string, type: string) =>
    `feed_${page}_${perPage}_${query}_${type}`,
  RSS: (channelId: string, limit: number, type: string) =>
    `rss_${channelId}_${limit}_${type}`,
} as const;

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 60000); // Clean up every minute
}
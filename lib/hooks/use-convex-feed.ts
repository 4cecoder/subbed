import { useState, useCallback, useMemo, useEffect } from 'react';
import { FeedItem, UseFeedReturn, UserSettings } from '@/lib/types';
import { useConvexSubscriptions } from './use-convex-subscriptions';

export function useConvexFeed(settings: UserSettings | null): UseFeedReturn {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { subscriptions } = useConvexSubscriptions();

  // Memoized filtered feed based on settings
  const filteredFeed = useMemo(() => {
    if (!settings) return feed;

    const feedType = settings.defaultFeedType;
    if (feedType === 'all') return feed;

    return feed.filter(item => {
      if (feedType === 'video') return !item.isShort;
      if (feedType === 'short') return !!item.isShort;
      return true;
    });
  }, [feed, settings]);

  const fetchRssFeed = useCallback(
    async (channelId: string, limit: number = 10): Promise<FeedItem[]> => {
      try {
        const response = await fetch(`/api/rss?id=${channelId}&limit=${limit}&type=all`);
        if (!response.ok) {
          throw new Error(`Failed to fetch RSS for ${channelId}`);
        }

        const data = await response.json();
        const subscription = subscriptions.find(sub => sub.channelId === channelId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.items || []).map((item: any) => ({
          ...item,
          channelId: channelId,
          channelTitle: subscription?.channelName || data.channelTitle || 'Unknown Channel',
        }));
      } catch (err) {
        console.error(`Error fetching RSS for channel ${channelId}:`, err);
        return [];
      }
    },
    [subscriptions]
  );

  const loadFeed = useCallback(
    async (pageToLoad = 1, search = '') => {
      if (!settings || subscriptions.length === 0) {
        setFeed([]);
        setTotal(0);
        setHasMore(false);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const perChannel = settings.per_channel || 10;
        const concurrency = Math.max(1, Math.min(settings.concurrency || 6, 6));

        // Fetch feeds from all subscribed channels with controlled concurrency
        const allItems: FeedItem[] = [];

        // Process channels in batches to control concurrency
        const chunks: string[][] = [];
        for (let i = 0; i < subscriptions.length; i += concurrency) {
          chunks.push(subscriptions.slice(i, i + concurrency).map(sub => sub.channelId));
        }

        for (const chunk of chunks) {
          const chunkPromises = chunk.map(channelId => fetchRssFeed(channelId, perChannel));
          const chunkResults = await Promise.allSettled(chunkPromises);

          chunkResults.forEach(result => {
            if (result.status === 'fulfilled') {
              allItems.push(...result.value);
            }
          });
        }

        // Apply search filter
        let filtered = allItems;
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = allItems.filter(
            item =>
              item.title.toLowerCase().includes(searchLower) ||
              (item.description && item.description.toLowerCase().includes(searchLower)) ||
              (item.channelTitle && item.channelTitle.toLowerCase().includes(searchLower))
          );
        }

        // Apply content type filter
        const feedType = settings.defaultFeedType || 'all';
        if (feedType === 'video') {
          filtered = filtered.filter(item => !item.isShort);
        } else if (feedType === 'short') {
          filtered = filtered.filter(item => item.isShort);
        }

        // Sort by published date
        filtered.sort((a, b) => {
          const dateA = new Date(a.published).getTime() || 0;
          const dateB = new Date(b.published).getTime() || 0;
          const sortOrder = settings.sortOrder || 'newest';
          return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
        });

        // Handle pagination
        const perPage = settings.per_page || 20;
        const totalItems = filtered.length;
        const start = (pageToLoad - 1) * perPage;
        const pageItems = filtered.slice(start, start + perPage);

        if (pageToLoad === 1) {
          setFeed(pageItems);
        } else {
          setFeed(prev => [...prev, ...pageItems]);
        }

        setHasMore(start + pageItems.length < totalItems);
        setPage(pageToLoad);
        setTotal(totalItems);
        setSelectedId('all');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load feed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [settings, subscriptions, fetchRssFeed]
  );

  const loadChannelFeed = useCallback(
    async (channelId: string) => {
      if (!settings) return;

      setError(null);
      setLoading(true);
      setFeed([]);

      try {
        const limit = settings.per_channel || 10;
        const items = await fetchRssFeed(channelId, limit);

        // Apply content type filter
        const feedType = settings.defaultFeedType || 'all';
        let filtered = items;
        if (feedType === 'video') {
          filtered = items.filter(item => !item.isShort);
        } else if (feedType === 'short') {
          filtered = items.filter(item => item.isShort);
        }

        // Sort by published date
        filtered.sort((a, b) => {
          const dateA = new Date(a.published).getTime() || 0;
          const dateB = new Date(b.published).getTime() || 0;
          const sortOrder = settings.sortOrder || 'newest';
          return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
        });

        setFeed(filtered);
        setTotal(filtered.length);
        setHasMore(false);
        setPage(1);
        setSelectedId(channelId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load channel feed';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [settings, fetchRssFeed]
  );

  const refreshCurrentFeed = useCallback(async () => {
    if (selectedId === 'all') {
      await loadFeed(1, '');
    } else if (selectedId) {
      await loadChannelFeed(selectedId);
    }
  }, [selectedId, loadFeed, loadChannelFeed]);

  // Auto-load feed when settings and subscriptions are available
  useEffect(() => {
    if (settings && subscriptions.length > 0 && selectedId === null) {
      loadFeed(1, '');
    } else if (settings && subscriptions.length === 0) {
      setFeed([]);
      setTotal(0);
      setHasMore(false);
      setSelectedId('all');
    }
  }, [settings, subscriptions, selectedId, loadFeed]);

  return {
    feed: filteredFeed,
    loading,
    error,
    total,
    hasMore,
    page,
    loadFeed,
    loadChannelFeed,
    refreshCurrentFeed,
  };
}

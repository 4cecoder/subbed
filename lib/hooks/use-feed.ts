import { useState, useCallback, useMemo, useEffect } from "react";
import { FeedItem, UseFeedReturn, UserSettings, FeedType } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

export function useFeed(settings: UserSettings | null): UseFeedReturn {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Memoized filtered feed based on settings
  const filteredFeed = useMemo(() => {
    if (!settings) return feed;

    const feedType = settings.defaultFeedType;
    if (feedType === "all") return feed;

    return feed.filter((item) => {
      if (feedType === "video") return !item.isShort;
      if (feedType === "short") return !!item.isShort;
      return true;
    });
  }, [feed, settings]);

  const loadFeed = useCallback(async (pageToLoad = 1, search = "") => {
    if (!settings) return;
    
    setError(null);
    setLoading(true);

    try {
      const perPage = settings.per_page || 20;
      const feedType = settings.defaultFeedType || "all";

      const response = await apiClient.getFeed(pageToLoad, perPage, search, feedType);
      const data = response.data;

      const items: FeedItem[] = (data.items || []);
      if (pageToLoad === 1) {
        setFeed(items);
      } else {
        setFeed((prev) => [...prev, ...items]);
      }

      const totalCount = Number(data.total || 0);
      setHasMore(pageToLoad * perPage < totalCount);
      setPage(pageToLoad);
      setTotal(totalCount || null);
      setSelectedId("all");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load feed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const loadChannelFeed = useCallback(async (channelId: string) => {
    if (!settings) return;
    
    setError(null);
    setLoading(true);
    setFeed([]);

    try {
      const limit = settings.per_channel || 10;
      const feedType = settings.defaultFeedType || "all";

      const response = await apiClient.getRssFeed(channelId, limit, feedType);
      const data = response.data;

      const items: FeedItem[] = (data.items || []).map((item: any) => ({
        ...item,
        channelId: data.channelId,
        channelTitle: data.channelTitle,
      }));

      setFeed(items);
      setTotal(items.length);
      setHasMore(false);
      setPage(1);
      setSelectedId(channelId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load channel feed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const refreshCurrentFeed = useCallback(async () => {
    if (selectedId === "all") {
      await loadFeed(1, "");
    } else if (selectedId) {
      await loadChannelFeed(selectedId);
    }
  }, [selectedId, loadFeed, loadChannelFeed]);

  // Auto-load feed when settings are available
  useEffect(() => {
    if (settings && selectedId === null) {
      loadFeed(1, "");
    }
  }, [settings, selectedId, loadFeed]);

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
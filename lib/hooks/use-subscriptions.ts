import { useState, useCallback, useEffect } from "react";
import { Subscription, UseSubscriptionsReturn } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

export function useSubscriptions(): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getSubscriptions();
      setSubscriptions(response.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load subscriptions";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSubscription = useCallback(async (url: string) => {
    setError(null);
    if (!url.trim()) {
      setError("Please paste a channel URL, handle, or channel id.");
      return;
    }

    setLoading(true);
    try {
      const resolved = await apiClient.resolveChannel(url.trim());
      const { channelId, title } = resolved;

      await apiClient.addSubscription({
        id: channelId,
        title: title || null,
        url: `https://www.youtube.com/channel/${channelId}`,
      });

      await refreshSubscriptions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add subscription";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshSubscriptions]);

  const removeSubscription = useCallback(async (id: string) => {
    try {
      await apiClient.removeSubscription(id);
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove subscription";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearSubscriptions = useCallback(async () => {
    try {
      await apiClient.clearSubscriptions();
      setSubscriptions([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to clear subscriptions";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Load subscriptions on mount
  useEffect(() => {
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    addSubscription,
    removeSubscription,
    clearSubscriptions,
    refreshSubscriptions,
  };
}
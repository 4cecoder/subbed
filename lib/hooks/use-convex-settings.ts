import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UserSettings } from '@/lib/types';

const defaultSettings: UserSettings = {
  per_page: 20,
  per_channel: 10,
  showThumbnails: true,
  showDescriptions: true,
  defaultFeedType: 'all',
  sortOrder: 'newest',
  caching_ttl: 0,
  concurrency: 6,
};

export function useConvexSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex queries and mutations
  const convexSettings = useQuery(api.settings.getSettings);
  const updateConvexSettings = useMutation(api.settings.updateSettings);

  // Load settings from Convex on mount and when convexSettings changes
  useEffect(() => {
    if (convexSettings) {
      const convexSettingsFormatted: UserSettings = {
        per_page: convexSettings.per_page,
        per_channel: convexSettings.per_channel,
        showThumbnails: convexSettings.showThumbnails,
        showDescriptions: convexSettings.showDescriptions,
        defaultFeedType: convexSettings.defaultFeedType,
        sortOrder: convexSettings.sortOrder,
        caching_ttl: convexSettings.caching_ttl,
        concurrency: convexSettings.concurrency,
      };
      setSettings(convexSettingsFormatted);
    }
  }, [convexSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      setLoading(true);
      setError(null);

      try {
        // Update Convex
        await updateConvexSettings(newSettings);

        // Update local state immediately for responsive UI
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        // Also save to localStorage as fallback
        localStorage.setItem('user-settings', JSON.stringify(updatedSettings));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [settings, updateConvexSettings]
  );

  const refreshSettings = useCallback(async () => {
    // Convex will automatically refetch due to the useQuery hook
    // This function is kept for API consistency
    setLoading(true);
    setError(null);

    try {
      // Force a refetch by invalidating the query
      // The useQuery hook will automatically update when new data is available
      if (convexSettings) {
        const convexSettingsFormatted: UserSettings = {
          per_page: convexSettings.per_page,
          per_channel: convexSettings.per_channel,
          showThumbnails: convexSettings.showThumbnails,
          showDescriptions: convexSettings.showDescriptions,
          defaultFeedType: convexSettings.defaultFeedType,
          sortOrder: convexSettings.sortOrder,
          caching_ttl: convexSettings.caching_ttl,
          concurrency: convexSettings.concurrency,
        };
        setSettings(convexSettingsFormatted);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh settings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [convexSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
  };
}

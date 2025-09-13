import { useState, useCallback, useEffect } from "react";
import { UserSettings, UseSettingsReturn } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getSettings();
      setSettings(response.data.settings || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load settings";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const response = await apiClient.saveSettings(updatedSettings);
      setSettings(response.settings || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save settings";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Load settings on mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
  };
}
import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from 'convex/browser';
import { api as convexApi } from '../convex/_generated/api';

// Dynamic import to avoid build-time issues
let api: typeof convexApi | null = null;

async function loadApi() {
  if (api) return api;
  try {
    const convexApi = await import('../convex/_generated/api');
    api = convexApi.api;
    return api;
  } catch {
    return null;
  }
}

const SETTINGS_FILE =
  process.env.SUBBED_SETTINGS_FILE || path.resolve(process.cwd(), 'data', 'settings.json');

// Ensure data directory exists
const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

type Settings = {
  per_page: number;
  per_channel: number;
  showThumbnails: boolean;
  showDescriptions: boolean;
  defaultFeedType: 'all' | 'video' | 'short';
  sortOrder: 'newest' | 'oldest';
  caching_ttl: number;
  concurrency: number;
};

const DEFAULT_SETTINGS: Settings = {
  per_page: 20,
  per_channel: 10,
  showThumbnails: true,
  showDescriptions: true,
  defaultFeedType: 'all',
  sortOrder: 'newest',
  caching_ttl: 0,
  concurrency: 6,
};

// Local storage functions
function readLocalSettings(): Settings {
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeLocalSettings(s: Partial<Settings>): Settings {
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...((s || {}) as Record<string, unknown>),
  } as Settings;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Check if Convex is available
async function isConvexAvailable(): Promise<boolean> {
  try {
    const currentApi = await loadApi();
    if (!currentApi) return false;
    await convex.query(currentApi.settings.getSettings, {});
    return true;
  } catch {
    return false;
  }
}

// Convert Convex settings to local format
function convexToLocalSettings(convexSettings: Record<string, unknown>): Settings {
  return {
    per_page: (convexSettings.per_page as number) || 20,
    per_channel: (convexSettings.per_channel as number) || 10,
    showThumbnails: (convexSettings.showThumbnails as boolean) || true,
    showDescriptions: (convexSettings.showDescriptions as boolean) || true,
    defaultFeedType: (convexSettings.defaultFeedType as 'all' | 'video' | 'short') || 'all',
    sortOrder: (convexSettings.sortOrder as 'newest' | 'oldest') || 'newest',
    caching_ttl: (convexSettings.caching_ttl as number) || 300,
    concurrency: (convexSettings.concurrency as number) || 6,
  };
}

// Hybrid functions that try Convex first, fallback to local
export async function readSettings(): Promise<Settings> {
  const convexAvailable = await isConvexAvailable();
  const currentApi = await loadApi();

  if (convexAvailable && currentApi) {
    try {
      const convexSettings = await convex.query(currentApi.settings.getSettings, {});
      if (convexSettings) {
        return convexToLocalSettings(convexSettings);
      }
    } catch (error) {
      console.error('Error fetching settings from Convex, falling back to local:', error);
    }
  }

  // Fallback to local storage
  return readLocalSettings();
}

export async function writeSettings(s: Partial<Settings>): Promise<Settings> {
  const convexAvailable = await isConvexAvailable();
  const currentApi = await loadApi();

  // Update local storage immediately
  const merged = writeLocalSettings(s);

  // Try to sync with Convex
  if (convexAvailable && currentApi) {
    try {
      await convex.mutation(currentApi.settings.updateSettings, merged);
    } catch (error) {
      console.error('Error syncing settings to Convex:', error);
      // Add to sync queue for later
      try {
        await convex.mutation(currentApi.sync.addToSyncQueue, {
          operation: 'update',
          entityType: 'setting',
          entityId: 'user-settings',
          data: merged,
        });
      } catch (queueError) {
        console.error('Error adding to sync queue:', queueError);
      }
    }
  }

  return merged;
}

// Sync functions
export async function syncSettings() {
  const convexAvailable = await isConvexAvailable();
  const currentApi = await loadApi();
  if (!convexAvailable || !currentApi) return;

  try {
    const localSettings = readLocalSettings();
    const convexSettings = await convex.query(currentApi.settings.getSettings, {});

    if (!convexSettings) {
      // No settings in Convex, sync local settings
      await convex.mutation(currentApi.settings.syncSettings, localSettings);
    } else {
      // Merge settings (local takes precedence)
      const merged = { ...convexToLocalSettings(convexSettings), ...localSettings };
      await convex.mutation(currentApi.settings.syncSettings, merged);
      writeLocalSettings(merged);
    }

    //
  } catch (error) {
    console.error('Error syncing settings:', error);
  }
}

export { DEFAULT_SETTINGS };
export type { Settings };

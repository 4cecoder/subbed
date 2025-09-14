import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
// Dynamic import to avoid build-time issues
let api: any;
try {
  api = require("../convex/_generated/api").api;
} catch (error) {
  console.log("Convex API not available during build");
}

const SETTINGS_FILE = process.env.SUBBED_SETTINGS_FILE || path.resolve(process.cwd(), "data", "settings.json");
const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

type Settings = {
  per_page: number;
  per_channel: number;
  showThumbnails: boolean;
  showDescriptions: boolean;
  defaultFeedType: "all" | "video" | "short";
  sortOrder: "newest" | "oldest";
  caching_ttl: number;
  concurrency: number;
};

const DEFAULT_SETTINGS: Settings = {
  per_page: 20,
  per_channel: 10,
  showThumbnails: true,
  showDescriptions: true,
  defaultFeedType: "all",
  sortOrder: "newest",
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
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function writeLocalSettings(s: Partial<Settings>): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(s || {}) as any } as Settings;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Check if Convex is available
async function isConvexAvailable(): Promise<boolean> {
  try {
    if (!api) return false;
    await convex.query(api.settings.getSettings, {});
    return true;
  } catch (error) {
    console.log('Convex not available, using local storage:', error);
    return false;
  }
}

// Convert Convex settings to local format
function convexToLocalSettings(convexSettings: any): Settings {
  return {
    per_page: convexSettings.per_page,
    per_channel: convexSettings.per_channel,
    showThumbnails: convexSettings.showThumbnails,
    showDescriptions: convexSettings.showDescriptions,
    defaultFeedType: convexSettings.defaultFeedType,
    sortOrder: convexSettings.sortOrder,
    caching_ttl: convexSettings.caching_ttl,
    concurrency: convexSettings.concurrency,
  };
}

// Hybrid functions that try Convex first, fallback to local
export async function readSettings(): Promise<Settings> {
  const convexAvailable = await isConvexAvailable();
  
  if (convexAvailable && api) {
    try {
      const convexSettings = await convex.query(api.settings.getSettings, {});
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
  
  // Update local storage immediately
  const merged = writeLocalSettings(s);
  
  // Try to sync with Convex
  if (convexAvailable && api) {
    try {
      await convex.mutation(api.settings.updateSettings, merged);
    } catch (error) {
      console.error('Error syncing settings to Convex:', error);
      // Add to sync queue for later
      try {
        await convex.mutation(api.sync.addToSyncQueue, {
          operation: "update",
          entityType: "setting",
          entityId: "user-settings",
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
  if (!convexAvailable || !api) return;
  
  try {
    const localSettings = readLocalSettings();
    const convexSettings = await convex.query(api.settings.getSettings, {});
    
    if (!convexSettings) {
      // No settings in Convex, sync local settings
      await convex.mutation(api.settings.syncSettings, localSettings);
    } else {
      // Merge settings (local takes precedence)
      const merged = { ...convexToLocalSettings(convexSettings), ...localSettings };
      await convex.mutation(api.settings.syncSettings, merged);
      writeLocalSettings(merged);
    }
    
    console.log('Settings synced successfully');
  } catch (error) {
    console.error('Error syncing settings:', error);
  }
}

export { DEFAULT_SETTINGS };
export type { Settings };

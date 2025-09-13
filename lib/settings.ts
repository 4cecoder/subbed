import fs from "fs";
import path from "path";

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

function readSettings(): Settings {
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

function writeSettings(s: Partial<Settings>): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS, ...(s || {}) as any } as Settings;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

export { readSettings, writeSettings, DEFAULT_SETTINGS };
export type { Settings };

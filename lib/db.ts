import fs from "fs";
import path from "path";

const SUBSCRIPTIONS_FILE = process.env.SUBBED_DB_FILE || path.resolve(process.cwd(), "data", "subscriptions.json");
const dataDir = path.dirname(SUBSCRIPTIONS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function readSubscriptions() {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8'));
}

function writeSubscriptions(subs: any[]) {
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
}

const isNew = !fs.existsSync(SUBSCRIPTIONS_FILE);
if (isNew) {
  writeSubscriptions([]);
  // eslint-disable-next-line no-console
  console.log(`Subbed DB created at ${SUBSCRIPTIONS_FILE}`);
}

export function listSubscriptions() {
  return readSubscriptions().sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addSubscription({ id, title, url }: { id: string; title: string | null; url: string }) {
  const subs = readSubscriptions();
  const existingIndex = subs.findIndex((s: any) => s.id === id);
  const newSub = { id, title, url, created_at: new Date().toISOString() };
  if (existingIndex >= 0) {
    subs[existingIndex] = newSub;
  } else {
    subs.push(newSub);
  }
  writeSubscriptions(subs);
}

export function removeSubscription(id: string) {
  const subs = readSubscriptions().filter((s: any) => s.id !== id);
  writeSubscriptions(subs);
}

export function clearSubscriptions() {
  writeSubscriptions([]);
}

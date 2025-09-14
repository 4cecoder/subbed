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
import { Subscription } from "./types";

const SUBSCRIPTIONS_FILE = process.env.SUBBED_DB_FILE || path.resolve(process.cwd(), "data", "subscriptions.json");
const dataDir = path.dirname(SUBSCRIPTIONS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Local storage functions
function readSubscriptions(): Subscription[] {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) return [];
  try {
    const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (error) {
    console.error('Error reading subscriptions file:', error);
    return [];
  }
}

function writeSubscriptions(subs: Subscription[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2));
  } catch (error) {
    console.error('Error writing subscriptions file:', error);
  }
}

const isNew = !fs.existsSync(SUBSCRIPTIONS_FILE);
if (isNew) {
  writeSubscriptions([]);
   
  console.log(`Subbed DB created at ${SUBSCRIPTIONS_FILE}`);
}

// Check if Convex is available
async function isConvexAvailable(): Promise<boolean> {
  try {
    await convex.query(api.subscriptions.getSubscriptions, {});
    return true;
  } catch (error) {
    console.log('Convex not available, using local storage:', error);
    return false;
  }
}

// Convert Convex subscription to local format
function convexToLocalSubscription(convexSub: any): Subscription {
  return {
    id: convexSub.channelId,
    title: convexSub.channelName,
    url: convexSub.channelUrl,
    created_at: convexSub.createdAt,
  };
}

// Convert local subscription to Convex format
function localToConvexSubscription(localSub: Subscription) {
  return {
    channelId: localSub.id,
    channelName: localSub.title || '',
    channelLogoUrl: '', // Will be filled by API
    channelUrl: localSub.url,
    createdAt: localSub.created_at || new Date().toISOString(),
  };
}

// Hybrid functions that try Convex first, fallback to local
export async function listSubscriptions(): Promise<Subscription[]> {
  const convexAvailable = await isConvexAvailable();
  
  if (convexAvailable) {
    try {
      const convexSubs = await convex.query(api.subscriptions.getSubscriptions, {});
      return convexSubs.map(convexToLocalSubscription);
    } catch (error) {
      console.error('Error fetching from Convex, falling back to local:', error);
    }
  }
  
  // Fallback to local storage
  return readSubscriptions().sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

export async function addSubscription({ id, title, url }: { id: string; title: string | null; url: string }) {
  const convexAvailable = await isConvexAvailable();
  const newSub: Subscription = { id, title, url, created_at: new Date().toISOString() };
  
  // Update local storage immediately
  const subs = readSubscriptions();
  const existingIndex = subs.findIndex((s: Subscription) => s.id === id);
  if (existingIndex >= 0) {
    subs[existingIndex] = newSub;
  } else {
    subs.push(newSub);
  }
  writeSubscriptions(subs);
  
  // Try to sync with Convex
  if (convexAvailable) {
    try {
      await convex.mutation(api.subscriptions.addSubscription, localToConvexSubscription(newSub));
    } catch (error) {
      console.error('Error syncing subscription to Convex:', error);
      // Add to sync queue for later
      try {
        await convex.mutation(api.sync.addToSyncQueue, {
          operation: "create",
          entityType: "subscription",
          entityId: id,
          data: localToConvexSubscription(newSub),
        });
      } catch (queueError) {
        console.error('Error adding to sync queue:', queueError);
      }
    }
  }
}

export async function removeSubscription(id: string) {
  const convexAvailable = await isConvexAvailable();
  
  // Update local storage immediately
  const subs = readSubscriptions().filter((s: Subscription) => s.id !== id);
  writeSubscriptions(subs);
  
  // Try to sync with Convex
  if (convexAvailable) {
    try {
      await convex.mutation(api.subscriptions.removeSubscription, { channelId: id });
    } catch (error) {
      console.error('Error removing subscription from Convex:', error);
      // Add to sync queue for later
      try {
        await convex.mutation(api.sync.addToSyncQueue, {
          operation: "delete",
          entityType: "subscription",
          entityId: id,
          data: { channelId: id },
        });
      } catch (queueError) {
        console.error('Error adding to sync queue:', queueError);
      }
    }
  }
}

export async function clearSubscriptions() {
  const convexAvailable = await isConvexAvailable();
  
  // Update local storage immediately
  writeSubscriptions([]);
  
  // Try to sync with Convex
  if (convexAvailable) {
    try {
      await convex.mutation(api.subscriptions.clearSubscriptions, {});
    } catch (error) {
      console.error('Error clearing subscriptions from Convex:', error);
    }
  }
}

// Sync functions
export async function syncSubscriptions() {
  const convexAvailable = await isConvexAvailable();
  if (!convexAvailable) return;
  
  try {
    const localSubs = readSubscriptions();
    const convexSubs = await convex.query(api.subscriptions.getSubscriptions, {});
    
    // Sync local subscriptions to Convex
    for (const localSub of localSubs) {
      const convexSub = convexSubs.find((cs: any) => cs.channelId === localSub.id);
      if (!convexSub) {
        await convex.mutation(api.subscriptions.syncSubscription, localToConvexSubscription(localSub));
      }
    }
    
    // Sync Convex subscriptions to local (for any that might be missing locally)
    for (const convexSub of convexSubs) {
      const localSub = localSubs.find((ls: Subscription) => ls.id === convexSub.channelId);
      if (!localSub) {
        const newLocalSub = convexToLocalSubscription(convexSub);
        const subs = readSubscriptions();
        subs.push(newLocalSub);
        writeSubscriptions(subs);
      }
    }
    
    console.log('Subscriptions synced successfully');
  } catch (error) {
    console.error('Error syncing subscriptions:', error);
  }
}

// Process sync queue
export async function processSyncQueue() {
  const convexAvailable = await isConvexAvailable();
  if (!convexAvailable) return;
  
  try {
    const pendingOperations = await convex.query(api.sync.getPendingSyncOperations, {});
    
    for (const operation of pendingOperations) {
      try {
        if (operation.entityType === "subscription") {
          if (operation.operation === "create" || operation.operation === "update") {
            await convex.mutation(api.subscriptions.syncSubscription, operation.data);
          } else if (operation.operation === "delete") {
            await convex.mutation(api.subscriptions.removeSubscription, { channelId: operation.entityId });
          }
        } else if (operation.entityType === "setting") {
          await convex.mutation(api.settings.syncSettings, operation.data);
        }
        
        // Mark as processed
        await convex.mutation(api.sync.markSyncOperationProcessed, { syncId: operation._id });
      } catch (error) {
        console.error(`Error processing sync operation ${operation._id}:`, error);
        await convex.mutation(api.sync.markSyncOperationError, { 
          syncId: operation._id, 
          error: String(error) 
        });
      }
    }
    
    // Clear processed operations
    await convex.mutation(api.sync.clearProcessedSyncOperations, {});
  } catch (error) {
    console.error('Error processing sync queue:', error);
  }
}

import { syncSubscriptions, processSyncQueue } from './db';
import { syncSettings } from './settings';

// Sync manager for handling offline/online transitions
export class SyncManager {
  private static instance: SyncManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline() {
    console.log('App is online, starting sync...');
    this.isOnline = true;
    this.startSync();
  }

  private handleOffline() {
    console.log('App is offline, stopping sync...');
    this.isOnline = false;
    this.stopSync();
  }

  private startSync() {
    // Immediate sync when coming online
    this.performSync();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, 30000); // Sync every 30 seconds
  }

  private stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async performSync() {
    if (!this.isOnline) return;

    try {
      console.log('Performing sync...');

      // Sync subscriptions
      await syncSubscriptions();

      // Sync settings
      await syncSettings();

      // Process sync queue
      await processSyncQueue();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  // Public methods
  public async forceSync() {
    await this.performSync();
  }

  public isAppOnline(): boolean {
    return this.isOnline;
  }

  public start() {
    if (this.isOnline) {
      this.startSync();
    }
  }

  public stop() {
    this.stopSync();
  }
}

// Hook for using sync manager in React components
export function useSync() {
  const syncManager = SyncManager.getInstance();

  return {
    isOnline: syncManager.isAppOnline(),
    forceSync: () => syncManager.forceSync(),
    startSync: () => syncManager.start(),
    stopSync: () => syncManager.stop(),
  };
}

// Initialize sync manager on app start
if (typeof window !== 'undefined') {
  const syncManager = SyncManager.getInstance();
  syncManager.start();
}

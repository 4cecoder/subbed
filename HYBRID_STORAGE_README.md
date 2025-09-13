# Hybrid Storage System with ConvexDB and Offline Support

This document describes the implementation of a hybrid storage system that uses ConvexDB as the primary storage while maintaining offline capabilities with local JSON files as fallback.

## Architecture Overview

### Storage Layers

1. **ConvexDB (Primary Storage)**
   - Real-time database with automatic synchronization
   - User-specific data isolation
   - Built-in conflict resolution
   - Automatic offline-to-online sync

2. **Local JSON Files (Fallback Storage)**
   - Immediate local storage for offline access
   - Automatic sync when online
   - Data persistence across sessions

3. **Sync Queue System**
   - Tracks operations when offline
   - Processes pending operations when online
   - Handles sync conflicts and errors

### Data Models

#### Subscriptions
```typescript
// Convex Schema
{
  userId: string,
  channelId: string,
  channelName: string,
  channelLogoUrl: string,
  channelUrl: string,
  createdAt: string,
  lastSyncedAt: string?,
}
```

#### Settings
```typescript
// Convex Schema
{
  userId: string,
  per_page: number,
  per_channel: number,
  showThumbnails: boolean,
  showDescriptions: boolean,
  defaultFeedType: "all" | "video" | "short",
  sortOrder: "newest" | "oldest",
  caching_ttl: number,
  concurrency: number,
  lastSyncedAt: string?,
}
```

#### Sync Queue
```typescript
{
  userId: string,
  operation: "create" | "update" | "delete",
  entityType: "subscription" | "setting",
  entityId: string,
  data: any,
  createdAt: string,
  processedAt: string?,
  error: string?,
}
```

## How It Works

### 1. Data Access Pattern

```
Client Request → Hybrid Layer → ConvexDB (if online) → Local JSON (fallback)
                                    ↓
                              Sync Queue (if offline)
```

### 2. Write Operations

1. **Immediate Local Write**
   - Data is written to local JSON files immediately
   - UI updates instantly for better UX

2. **Convex Sync (if online)**
   - Data is synced to ConvexDB
   - If sync fails, operation is queued

3. **Queue Processing (when online)**
   - Pending operations are processed
   - Conflicts are resolved
   - Errors are logged and retried

### 3. Read Operations

1. **Online Mode**
   - Try ConvexDB first
   - Fallback to local if Convex unavailable
   - Merge results if needed

2. **Offline Mode**
   - Use local JSON files
   - Queue operations for later sync

### 4. Sync Process

1. **Automatic Sync**
   - Triggers when app comes online
   - Runs every 30 seconds when online
   - Processes all pending operations

2. **Manual Sync**
   - Can be triggered by user
   - Forces immediate sync of all data

## Implementation Details

### Updated Files

#### Core Storage Layer
- `lib/db.ts` - Hybrid subscription storage
- `lib/settings.ts` - Hybrid settings storage
- `lib/sync.ts` - Sync management system

#### Convex Backend
- `convex/schema.ts` - Updated database schema
- `convex/subscriptions.ts` - Subscription operations
- `convex/settings.ts` - Settings operations
- `convex/sync.ts` - Sync queue management

#### API Routes
- `app/api/subscriptions/route.ts` - Updated for async operations
- `app/api/settings/route.ts` - Updated for async operations
- `app/api/sync/route.ts` - New sync endpoint

#### React Hooks
- `lib/hooks/use-subscriptions.ts` - Updated for async
- `lib/hooks/use-settings.ts` - Updated for async
- `lib/hooks/use-feed.ts` - Updated for async
- `lib/hooks/use-sync.ts` - New sync hook

#### Client Utilities
- `lib/api-client.ts` - Added sync functionality
- `lib/types.ts` - Added sync types

### Key Features

#### 1. Offline-First Design
- App works without internet connection
- All operations are queued for later sync
- Seamless transition between online/offline

#### 2. Automatic Conflict Resolution
- Last-write-wins strategy
- Timestamp-based conflict detection
- User notification of conflicts

#### 3. Performance Optimizations
- Local cache for immediate reads
- Batch operations for efficiency
- Debounced sync to reduce network calls

#### 4. Error Handling
- Graceful degradation when Convex unavailable
- Retry mechanism for failed operations
- User-friendly error messages

## Usage Examples

### Basic Usage

```typescript
// Using subscriptions hook
const { subscriptions, addSubscription, removeSubscription } = useSubscriptions();

// Add a subscription (works offline)
await addSubscription('https://youtube.com/channel/UC...');

// Remove a subscription (works offline)
await removeSubscription('channelId');
```

### Sync Management

```typescript
// Using sync hook
const { isOnline, forceSync } = useSync();

// Check online status
if (isOnline) {
  // Force immediate sync
  await forceSync();
}
```

### Manual Sync

```typescript
// Trigger sync from anywhere
await apiClient.syncData();
```

## Configuration

### Environment Variables

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=your-convex-url
CONVEX_DEPLOYMENT=your-deployment-id

# Optional: Local storage paths
SUBBED_DB_FILE=./data/subscriptions.json
SUBBED_SETTINGS_FILE=./data/settings.json
```

### Sync Settings

The sync system can be configured through:

- **Sync Interval**: Currently 30 seconds (configurable)
- **Retry Count**: Failed operations are retried automatically
- **Batch Size**: Operations are processed in batches for efficiency

## Migration Guide

### From Local-Only Storage

1. **Install Dependencies**
   ```bash
   npm install convex
   ```

2. **Update Environment Variables**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   ```

3. **Run Convex Setup**
   ```bash
   npx convex dev
   ```

4. **Data Migration**
   - Existing local data is preserved
   - First sync will migrate data to Convex
   - No data loss during migration

### From Convex-Only Storage

1. **Update Data Access**
   - Replace direct Convex calls with hybrid layer
   - Add offline support hooks

2. **Add Sync Queue**
   - Implement sync queue for offline operations
   - Add conflict resolution logic

## Testing

### Offline Testing

1. **Disable Network**
   - Use browser dev tools to go offline
   - Test all operations work offline

2. **Sync Testing**
   - Go offline, make changes
   - Go online, verify sync works
   - Test conflict scenarios

### Performance Testing

1. **Load Testing**
   - Test with large datasets
   - Measure sync performance
   - Verify memory usage

2. **Concurrency Testing**
   - Multiple simultaneous operations
   - Race condition testing
   - Conflict resolution testing

## Troubleshooting

### Common Issues

#### Sync Not Working
1. Check Convex connection
2. Verify environment variables
3. Check browser console for errors

#### Data Not Updating
1. Verify online status
2. Check sync queue for pending operations
3. Look for sync errors in logs

#### Performance Issues
1. Check sync interval settings
2. Verify batch size configuration
3. Monitor network usage

### Debug Tools

#### Sync Status
```typescript
// Check sync status
const syncStatus = await apiClient.getSyncStatus();
console.log(syncStatus);
```

#### Queue Inspection
```typescript
// View pending sync operations
const pendingOps = await convex.query(api.sync.getPendingSyncOperations, {});
console.log(pendingOps);
```

## Future Enhancements

### Planned Features

1. **Advanced Conflict Resolution**
   - Per-field conflict resolution
   - User choice in conflicts
   - Merge strategies

2. **Background Sync**
   - Service Worker support
   - Periodic background sync
   - Push notification support

3. **Performance Optimizations**
   - Delta sync (only changes)
   - Compression for large datasets
   - IndexedDB for better local storage

4. **Enhanced Offline Features**
   - Offline analytics
   - Local search indexing
   - Offline notifications

## Contributing

When contributing to the hybrid storage system:

1. **Test Both Modes**
   - Always test online and offline scenarios
   - Verify sync behavior

2. **Handle Errors Gracefully**
   - Provide fallback for all operations
   - Log errors appropriately

3. **Performance Considerations**
   - Minimize network calls
   - Use efficient data structures
   - Implement proper caching

## License

This hybrid storage system is part of the Subbed project and follows the same license terms.
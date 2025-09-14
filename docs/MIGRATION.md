# Migration Guide

This guide covers data migration procedures, version upgrades, and transitioning between different storage systems in Subbed.

## 📋 Table of Contents

- [Version Migration](#version-migration)
- [Data Migration](#data-migration)
- [Storage Migration](#storage-migration)
- [API Migration](#api-migration)
- [Breaking Changes](#breaking-changes)

## 📈 Version Migration

### Migrating from v0.x to v1.0

#### Prerequisites

- Node.js 18+
- Convex account
- Clerk account
- Existing subscription data (if migrating)

#### Migration Steps

1. **Backup Existing Data**

   ```bash
   # If you have local data, back it up
   cp data/subscriptions.json data/subscriptions.backup.json
   cp data/settings.json data/settings.backup.json
   ```

2. **Update Dependencies**

   ```bash
   npm install convex@^1.27.0 @clerk/nextjs@^6.32.0
   ```

3. **Environment Setup**

   ```bash
   # Add new environment variables
   echo "NEXT_PUBLIC_CONVEX_URL=your-convex-url" >> .env.local
   echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_..." >> .env.local
   echo "CLERK_SECRET_KEY=sk_test_..." >> .env.local
   ```

4. **Convex Setup**

   ```bash
   npx convex dev
   npx convex deploy
   ```

5. **Data Migration**

   ```bash
   # Run migration script
   node scripts/migrate-subscriptions.js
   ```

6. **Update Code References**
   - Replace local storage calls with Convex hooks
   - Update component imports
   - Update API endpoints

#### Breaking Changes in v1.0

- **Storage System**: Migrated from local JSON to ConvexDB
- **Authentication**: Now requires Clerk authentication
- **API Endpoints**: Updated to support real-time sync
- **Component Structure**: Refactored for better performance

### Rolling Back from v1.0

If you need to rollback to v0.x:

1. **Restore Backup Data**

   ```bash
   cp data/subscriptions.backup.json data/subscriptions.json
   cp data/settings.backup.json data/settings.json
   ```

2. **Revert Dependencies**

   ```bash
   npm install convex@latest @clerk/nextjs@latest --save-dev
   ```

3. **Update Code**
   - Revert to local storage implementation
   - Remove Clerk authentication
   - Update component imports

## 🔄 Data Migration

### Migrating from Local Storage to Convex

#### Automatic Migration

The application includes automatic migration when you first run v1.0:

```typescript
// lib/migration.ts
export async function migrateLocalDataToConvex() {
  const localSubscriptions = await readLocalSubscriptions();
  const localSettings = await readLocalSettings();

  // Migrate to Convex
  for (const subscription of localSubscriptions) {
    await convex.mutation(api.subscriptions.addSubscription, subscription);
  }

  await convex.mutation(api.settings.updateSettings, localSettings);

  // Clear local data
  await clearLocalStorage();
}
```

#### Manual Migration

For custom migration scenarios:

```typescript
// Custom migration script
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function customMigration() {
  // Read from old system
  const oldData = await fetchOldSystemData();

  // Transform data
  const transformedData = transformDataForConvex(oldData);

  // Write to Convex
  for (const item of transformedData) {
    await convex.mutation(api.subscriptions.addSubscription, item);
  }
}
```

### Migrating Between Convex Deployments

#### Cross-Deployment Migration

```bash
# Export from source deployment
npx convex export --deployment source-deployment > data/export.json

# Import to target deployment
npx convex import --deployment target-deployment < data/export.json
```

#### Selective Data Migration

```typescript
// Migrate specific data types
async function migrateSubscriptionsOnly() {
  const subscriptions = await convex.query(api.subscriptions.getAll);

  // Transform if needed
  const transformed = subscriptions.map(transformSubscription);

  // Import to new deployment
  for (const sub of transformed) {
    await targetConvex.mutation(api.subscriptions.addSubscription, sub);
  }
}
```

## 💾 Storage Migration

### From JSON Files to ConvexDB

#### Migration Process

1. **Read Local Data**

   ```typescript
   const localData = JSON.parse(fs.readFileSync('data/subscriptions.json', 'utf8'));
   ```

2. **Validate Data Structure**

   ```typescript
   const validatedData = localData.map(item => ({
     userId: item.userId || 'default-user',
     channelId: item.channelId,
     channelName: item.channelName || item.title,
     channelLogoUrl: item.channelLogoUrl || '',
     channelUrl: item.channelUrl || `https://youtube.com/channel/${item.channelId}`,
     createdAt: item.createdAt || new Date().toISOString(),
     lastSyncedAt: item.lastSyncedAt || new Date().toISOString(),
   }));
   ```

3. **Batch Insert to Convex**

   ```typescript
   const batchSize = 10;
   for (let i = 0; i < validatedData.length; i += batchSize) {
     const batch = validatedData.slice(i, i + batchSize);
     await Promise.all(batch.map(item => convex.mutation(api.subscriptions.addSubscription, item)));
   }
   ```

4. **Verify Migration**

   ```typescript
   const convexCount = await convex.query(api.subscriptions.getCount);
   const localCount = localData.length;

   if (convexCount === localCount) {
     console.log('Migration successful');
   } else {
     console.error('Migration failed: count mismatch');
   }
   ```

### From Convex to External Database

#### Export Process

```typescript
async function exportToExternalDB() {
  const subscriptions = await convex.query(api.subscriptions.getAll);
  const settings = await convex.query(api.settings.getAll);

  // Transform for external DB
  const externalFormat = {
    subscriptions: subscriptions.map(transformForExternal),
    settings: settings.map(transformForExternal),
    exportedAt: new Date().toISOString(),
  };

  // Write to file or API
  fs.writeFileSync('migration-export.json', JSON.stringify(externalFormat, null, 2));
}
```

## 🔌 API Migration

### API Endpoint Changes

#### v0.x API Structure

```typescript
// Old API structure
app / api / subscriptions.ts; // Single file with all methods
settings.ts; // Single file with all methods
```

#### v1.0 API Structure

```typescript
// New API structure
app / api / subscriptions / route.ts; // GET, POST, DELETE methods
settings / route.ts; // GET, POST methods
sync / route.ts; // POST method for sync
```

#### Migration Guide

1. **Update API Calls**

   ```typescript
   // Before (v0.x)
   const response = await fetch('/api/subscriptions', {
     method: 'POST',
     body: JSON.stringify(subscription),
   });

   // After (v1.0)
   const response = await fetch('/api/subscriptions', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(subscription),
   });
   ```

2. **Update Error Handling**

   ```typescript
   // Before
   if (!response.ok) throw new Error('API Error');

   // After
   if (!response.ok) {
     const error = await response.json();
     throw new Error(error.error || 'API Error');
   }
   ```

### Authentication Migration

#### Adding Clerk Authentication

1. **Install Clerk**

   ```bash
   npm install @clerk/nextjs
   ```

2. **Update Environment**

   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Wrap Application**

   ```typescript
   // app/layout.tsx
   import { ClerkProvider } from '@clerk/nextjs'

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <ClerkProvider>
         <html lang="en">
           <body>{children}</body>
         </html>
       </ClerkProvider>
     )
   }
   ```

4. **Protect API Routes**

   ```typescript
   // app/api/subscriptions/route.ts
   import { auth } from '@clerk/nextjs/server';

   export async function GET() {
     const { userId } = await auth();
     if (!userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     // Continue with authenticated logic
   }
   ```

## ⚠️ Breaking Changes

### Major Breaking Changes in v1.0

#### 1. Authentication Required

- **Before**: No authentication required
- **After**: Clerk authentication mandatory
- **Migration**: Set up Clerk account and configure authentication

#### 2. Storage System Change

- **Before**: Local JSON file storage
- **After**: ConvexDB with real-time sync
- **Migration**: Automatic migration on first run

#### 3. API Response Format

- **Before**: Simple JSON responses
- **After**: Structured responses with error handling
- **Migration**: Update error handling in client code

#### 4. Component Props

- **Before**: Direct data passing
- **After**: Hook-based data fetching
- **Migration**: Replace prop drilling with hooks

### Handling Breaking Changes

#### Gradual Migration Strategy

1. **Feature Flags**

   ```typescript
   const USE_CONVEX = process.env.USE_CONVEX === 'true';

   if (USE_CONVEX) {
     // New Convex implementation
   } else {
     // Old local storage implementation
   }
   ```

2. **Backward Compatibility**

   ```typescript
   // Support both old and new API formats
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     const legacy = searchParams.get('legacy') === 'true';

     if (legacy) {
       return handleLegacyFormat();
     } else {
       return handleNewFormat();
     }
   }
   ```

3. **Migration Endpoints**
   ```typescript
   // Temporary migration endpoint
   export async function POST() {
     await migrateUserData();
     return NextResponse.json({ migrated: true });
   }
   ```

## 🧪 Testing Migration

### Migration Testing Checklist

- [ ] Test data integrity during migration
- [ ] Verify all subscriptions migrated correctly
- [ ] Check settings preservation
- [ ] Test authentication flow
- [ ] Verify API compatibility
- [ ] Test error scenarios
- [ ] Performance validation

### Automated Migration Tests

```typescript
describe('Data Migration', () => {
  it('should migrate subscriptions correctly', async () => {
    const testData = createTestSubscriptions();
    await writeLocalData(testData);

    await migrateLocalDataToConvex();

    const convexData = await convex.query(api.subscriptions.getAll);
    expect(convexData).toEqual(testData);
  });

  it('should handle migration errors gracefully', async () => {
    // Mock network failure
    mockNetworkFailure();

    await expect(migrateLocalDataToConvex()).rejects.toThrow();

    // Verify rollback
    const localData = await readLocalData();
    expect(localData).toBeDefined();
  });
});
```

## 🚀 Post-Migration Tasks

### Cleanup Tasks

1. **Remove Legacy Code**

   ```bash
   # Remove old files after migration
   rm data/subscriptions.json
   rm data/settings.json
   rm lib/local-storage.ts
   ```

2. **Update Documentation**
   - Update README with new setup instructions
   - Update API documentation
   - Update deployment guides

3. **Environment Cleanup**
   ```bash
   # Remove old environment variables
   unset OLD_API_KEY
   unset LEGACY_DATABASE_URL
   ```

### Monitoring and Validation

1. **Migration Success Metrics**

   ```typescript
   const migrationMetrics = {
     totalUsers: await getUserCount(),
     migratedUsers: await getMigratedUserCount(),
     failedMigrations: await getFailedMigrationCount(),
     dataIntegrity: await verifyDataIntegrity(),
   };
   ```

2. **Performance Monitoring**
   - Monitor API response times
   - Track error rates
   - Validate data consistency

3. **User Communication**
   - Notify users of migration
   - Provide migration status dashboard
   - Offer support for migration issues

## 🔧 Rollback Procedures

### Emergency Rollback

1. **Data Backup**

   ```bash
   # Create emergency backup
   npx convex export > emergency-backup.json
   ```

2. **Code Rollback**

   ```bash
   git checkout previous-version-tag
   npm install
   ```

3. **Environment Restore**

   ```bash
   # Restore old environment variables
   cp .env.backup .env.local
   ```

4. **Data Restore**
   ```bash
   # If needed, restore from backup
   npx convex import < emergency-backup.json
   ```

### Partial Rollback

For rolling back specific features:

```typescript
// Feature flag rollback
const ENABLE_NEW_FEATURE = false;

if (ENABLE_NEW_FEATURE) {
  // New implementation
} else {
  // Old implementation
}
```

## 📞 Support and Help

### Migration Support

- **Documentation**: Check migration guides in docs/
- **GitHub Issues**: Report migration problems
- **Community**: Ask questions in discussions

### Getting Help

If you encounter issues during migration:

1. Check the troubleshooting guide
2. Review migration logs
3. Verify environment configuration
4. Contact support with migration details

---

**Last Updated**: September 13, 2025
**Version**: 1.0.0</content>
<parameter name="filePath">docs/MIGRATION.md

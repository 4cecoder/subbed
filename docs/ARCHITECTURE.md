# Architecture Overview

This document provides a comprehensive overview of Subbed's system architecture, design patterns, and technical decisions.

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Convex)      │◄──►│   (ConvexDB)    │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Real-time     │    │ • NoSQL         │
│ • TypeScript    │    │ • Serverless    │    │ • ACID          │
│ • App Router    │    │ • Type-safe     │    │ • Indexed       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Authentication  │    │   External APIs │    │   Caching       │
│   (Clerk)       │    │   (YouTube)     │    │   (Local)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

```
Subbed Application
├── 📱 Frontend Layer
│   ├── 🎨 Presentation Layer
│   │   ├── Components (React)
│   │   ├── UI Library (Shadcn/ui)
│   │   └── Styling (Tailwind CSS)
│   ├── 🔄 State Management
│   │   ├── React Hooks
│   │   ├── Context Providers
│   │   └── Local Storage
│   └── 🌐 API Layer
│       ├── Convex Client
│       ├── REST APIs
│       └── External Services
│
├── 🔧 Backend Layer
│   ├── 🚀 Convex Functions
│   │   ├── Queries
│   │   ├── Mutations
│   │   └── Actions
│   ├── 📊 Database Schema
│   │   ├── Tables
│   │   ├── Indexes
│   │   └── Relationships
│   └── 🔐 Authentication
│       ├── Clerk Integration
│       └── User Management
│
└── 🛠️ Infrastructure Layer
    ├── ☁️ Hosting (Vercel)
    ├── 📈 Monitoring
    ├── 🔒 Security
    └── 🚀 CI/CD
```

## 📁 Project Structure

### Frontend Structure

```
app/                          # Next.js App Router
├── api/                     # API Routes
│   ├── feed/               # Feed data endpoint
│   ├── subscriptions/      # Subscription management
│   ├── settings/           # User settings
│   └── sync/               # Synchronization
├── layout.tsx              # Root layout with providers
└── page.tsx                # Home page

components/                  # React Components
├── ui/                     # Reusable UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── advanced-video-feed.tsx # Main feed component
├── subscription-list.tsx   # Subscription management
├── analytics-dashboard.tsx # Analytics display
└── ...

lib/                        # Utilities and Business Logic
├── hooks/                  # Custom React hooks
│   ├── use-subscriptions.ts
│   ├── use-feed.ts
│   ├── use-settings.ts
│   └── ...
├── context/                # React context providers
│   ├── app-context.tsx
│   └── convex-client-provider.tsx
├── api-client.ts           # API client utilities
├── cache.ts                # Caching utilities
├── types.ts                # TypeScript definitions
└── utils.ts                # General utilities
```

### Backend Structure

```
convex/                     # Convex Backend
├── _generated/            # Auto-generated types
├── schema.ts             # Database schema
├── subscriptions.ts      # Subscription operations
├── settings.ts           # Settings operations
├── sync.ts               # Sync operations
├── dev_subscriptions.ts  # Development helpers
└── auth.config.js        # Authentication config

Database Tables:
├── subscriptions         # User subscriptions
├── settings             # User preferences
└── sync_queue           # Offline sync operations
```

## 🔄 Data Flow Architecture

### Subscription Management Flow

```
1. User Action
   ↓
2. React Component
   ↓
3. Custom Hook (use-subscriptions)
   ↓
4. Convex Mutation/Query
   ↓
5. Database Operation
   ↓
6. Real-time Update
   ↓
7. UI Re-render
```

### Feed Loading Flow

```
1. Component Mount
   ↓
2. use-feed Hook
   ↓
3. API Client
   ↓
4. Cache Check
   ↓
5. YouTube API (if needed)
   ↓
6. Data Transformation
   ↓
7. State Update
   ↓
8. Virtual List Render
```

### Authentication Flow

```
1. User Login/Signup
   ↓
2. Clerk Authentication
   ↓
3. JWT Token Generation
   ↓
4. Convex User Context
   ↓
5. Database Queries
   ↓
6. Personalized Data
```

## 🏛️ Design Patterns

### Frontend Patterns

#### 1. Custom Hooks Pattern

```typescript
// Custom hook for subscription management
export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const data = await apiClient.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { subscriptions, loading, refetch: loadSubscriptions };
}
```

#### 2. Context Provider Pattern

```typescript
// App context for global state
export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);

  const value = {
    theme,
    setTheme,
    user,
    setUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
```

#### 3. Component Composition Pattern

```typescript
// Composable video card component
export function VideoCard({ video, onClick, showChannel = true }) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg">
      <CardContent className="p-4">
        <VideoThumbnail video={video} />
        <VideoInfo video={video} showChannel={showChannel} />
        <VideoActions video={video} />
      </CardContent>
    </Card>
  );
}
```

### Backend Patterns

#### 1. Repository Pattern

```typescript
// Convex query with repository-like structure
export const getSubscriptions = query({
  args: {},
  handler: async ctx => {
    const userId = await getCurrentUserId(ctx);
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();
  },
});
```

#### 2. Service Layer Pattern

```typescript
// Service for subscription operations
export class SubscriptionService {
  static async addSubscription(ctx: QueryCtx, data: SubscriptionData) {
    const userId = await getCurrentUserId(ctx);

    // Validate data
    this.validateSubscriptionData(data);

    // Check for duplicates
    const existing = await this.findSubscription(ctx, userId, data.channelId);
    if (existing) {
      throw new Error('Subscription already exists');
    }

    // Create subscription
    return await ctx.db.insert('subscriptions', {
      ...data,
      userId,
      createdAt: new Date().toISOString(),
    });
  }
}
```

## 🔧 Key Technologies

### Frontend Technologies

| Technology       | Purpose         | Version  |
| ---------------- | --------------- | -------- |
| **Next.js**      | React Framework | 14.x     |
| **React**        | UI Library      | 18.x     |
| **TypeScript**   | Type Safety     | 5.x      |
| **Tailwind CSS** | Styling         | 3.x      |
| **Shadcn/ui**    | UI Components   | Latest   |
| **React Query**  | Data Fetching   | Built-in |

### Backend Technologies

| Technology     | Purpose              | Version |
| -------------- | -------------------- | ------- |
| **Convex**     | Backend-as-a-Service | Latest  |
| **Clerk**      | Authentication       | Latest  |
| **TypeScript** | Type Safety          | 5.x     |

### Development Tools

| Tool                      | Purpose           |
| ------------------------- | ----------------- |
| **ESLint**                | Code Linting      |
| **Prettier**              | Code Formatting   |
| **Jest**                  | Testing Framework |
| **React Testing Library** | Component Testing |
| **Playwright**            | E2E Testing       |

## 📊 Performance Architecture

### Optimization Strategies

#### 1. Bundle Optimization

- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Remove unused code automatically
- **Compression**: Gzip/Brotli compression
- **Caching**: Aggressive caching strategies

#### 2. Runtime Optimization

- **Virtual Scrolling**: For large lists (>1000 items)
- **Memoization**: React.memo, useMemo, useCallback
- **Debouncing**: For search and API calls
- **Lazy Loading**: Components and images

#### 3. Data Optimization

- **Caching Layer**: Multi-level caching (memory, localStorage)
- **Request Deduplication**: Prevent duplicate API calls
- **Batch Operations**: Group multiple operations
- **Optimistic Updates**: Immediate UI feedback

### Performance Metrics

| Metric                     | Target | Current |
| -------------------------- | ------ | ------- |
| **First Contentful Paint** | <1.5s  | ~1.2s   |
| **Time to Interactive**    | <2.5s  | ~2.0s   |
| **Bundle Size**            | <400KB | ~320KB  |
| **Lighthouse Score**       | >90    | 95+     |

## 🔒 Security Architecture

### Authentication & Authorization

#### Clerk Integration

- **JWT Tokens**: Secure token-based authentication
- **User Management**: Profile management and preferences
- **Social Login**: Google, GitHub, and other providers
- **Session Management**: Secure session handling

#### Data Security

- **Row-Level Security**: Users can only access their own data
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy (CSP)

### API Security

#### Convex Security

- **Type-Safe APIs**: End-to-end type safety
- **Authentication Required**: All mutations require valid user
- **Rate Limiting**: Built-in rate limiting
- **Audit Logging**: All operations are logged

## 🚀 Deployment Architecture

### Vercel Deployment

```
GitHub → Vercel → Build → Deploy
    ↓       ↓       ↓       ↓
  Push   Detect  Optimize  Live
  Code   Changes  Bundle   Site
```

### Environment Management

#### Development

- **Local Development**: `npm run dev`
- **Hot Reload**: Automatic browser refresh
- **Debugging**: Source maps and dev tools

#### Production

- **Build Optimization**: Next.js production build
- **Static Generation**: ISR for dynamic content
- **CDN**: Global content delivery
- **Monitoring**: Performance and error tracking

## 🔄 Sync Architecture

### Hybrid Storage System

#### Online Mode

```
User Action → Local Storage → ConvexDB → Real-time Sync
```

#### Offline Mode

```
User Action → Local Storage → Sync Queue → Background Sync (when online)
```

#### Conflict Resolution

- **Last-Write-Wins**: Timestamp-based conflict resolution
- **Manual Resolution**: User can choose which version to keep
- **Merge Strategy**: Automatic merging for compatible changes

## 📈 Monitoring & Observability

### Application Monitoring

#### Performance Monitoring

- **Core Web Vitals**: FCP, LCP, CLS, FID, TBT
- **Custom Metrics**: API response times, error rates
- **User Experience**: Real user monitoring

#### Error Tracking

- **Error Boundaries**: React error boundaries
- **Global Handlers**: Unhandled error tracking
- **User Feedback**: Error reporting and feedback collection

### Business Metrics

#### User Engagement

- **Session Duration**: Time spent in app
- **Feature Usage**: Which features are most used
- **Conversion Rates**: Subscription additions, settings changes

#### Technical Metrics

- **API Performance**: Response times and success rates
- **Database Performance**: Query performance and throughput
- **Cache Hit Rates**: Effectiveness of caching strategies

## 🔮 Future Architecture Considerations

### Scalability Improvements

#### Database Scaling

- **Read Replicas**: For high-read workloads
- **Sharding**: Horizontal scaling for large datasets
- **Caching Layer**: Redis for frequently accessed data

#### API Scaling

- **Edge Computing**: Global API endpoints
- **Microservices**: Break down monolithic functions
- **Load Balancing**: Distribute load across regions

### Feature Enhancements

#### Advanced Features

- **Machine Learning**: Personalized recommendations
- **Real-time Collaboration**: Shared subscription lists
- **Mobile App**: Native mobile applications
- **Browser Extension**: Chrome/Firefox extensions

#### Integration Opportunities

- **Third-party APIs**: Additional video platforms
- **Social Features**: Share subscriptions with friends
- **Analytics**: Advanced usage analytics
- **Notifications**: Push notifications for new videos

This architecture provides a solid foundation for Subbed while maintaining flexibility for future enhancements and scaling requirements.

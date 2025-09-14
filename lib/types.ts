// Core data types for the YouTube subscription manager

export interface Subscription {
  id: string;
  title: string | null;
  url: string;
  created_at?: string;
}

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  published: string;
  thumbnail?: string;
  description?: string;
  channelId?: string;
  channelTitle?: string | null;
  isShort?: boolean;
}

export interface RawFeedItem {
  id: string;
  title: string;
  link: string;
  published: string;
  thumbnail?: string;
  description?: string;
  isShort?: boolean;
}

export type FeedType = 'all' | 'video' | 'short';
export type SortOrder = 'newest' | 'oldest';

export interface UserSettings {
  per_page: number;
  per_channel: number;
  showThumbnails: boolean;
  showDescriptions: boolean;
  defaultFeedType: FeedType;
  sortOrder: SortOrder;
  caching_ttl: number;
  concurrency: number;
}

export interface ApiResponse<T> {
  data: T;
  cached: boolean;
  timestamp: number;
}

export interface FeedResponse {
  items: FeedItem[];
  per_page: number;
  total: number;
  page: number;
}

export interface RssResponse {
  items: RawFeedItem[];
  channelId: string;
  channelTitle: string | null;
}

export interface ResolveResponse {
  channelId: string;
  title: string | null;
}

export interface SettingsResponse {
  settings: UserSettings | null;
}

// UI State types
export interface LoadingState {
  subscriptions: boolean;
  feed: boolean;
  settings: boolean;
  search: boolean;
}

export interface ErrorState {
  subscriptions?: string;
  feed?: string;
  settings?: string;
  general?: string;
}

// Component prop types
export interface SubscriptionListProps {
  subscriptions: Subscription[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onRefreshAll: () => void;
  onRemove: (id: string) => void;
  onOpenClearConfirm: () => void;
}

export interface FeedHeaderProps {
  selectedId: string | null;
  subscriptions: Subscription[];
  query: string;
  loading: boolean;
  total?: number | null;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  onClear: () => void;
}

export interface VirtualListProps {
  items: FeedItem[];
  itemHeight?: number;
  containerHeight?: number;
  showThumbnails?: boolean;
  showDescriptions?: boolean;
  onItemClick?: (item: FeedItem) => void;
}

export interface VideoCardProps {
  item: FeedItem;
  showThumbnail?: boolean;
  showDescription?: boolean;
  onClick?: (item: FeedItem) => void;
}

// Hook return types
export interface UseDebouncedSearchReturn {
  query: string;
  debouncedQuery: string;
  updateQuery: (query: string) => void;
  clearQuery: () => void;
  isSearching: boolean;
}

export interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  addSubscription: (url: string) => Promise<void>;
  removeSubscription: (id: string) => Promise<void>;
  clearSubscriptions: () => Promise<void>;
  refreshSubscriptions: () => Promise<void>;
}

export interface UseFeedReturn {
  feed: FeedItem[];
  loading: boolean;
  error: string | null;
  total: number | null;
  hasMore: boolean;
  page: number;
  loadFeed: (page?: number, search?: string) => Promise<void>;
  loadChannelFeed: (channelId: string) => Promise<void>;
  refreshCurrentFeed: () => Promise<void>;
}

export interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export interface UseSyncReturn {
  isOnline: boolean;
  forceSync: () => Promise<void>;
  startSync: () => void;
  stopSync: () => void;
}

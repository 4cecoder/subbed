import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedVideoFeed } from '../components/advanced-video-feed';
import { useConvexSettings } from '../lib/hooks/use-convex-settings';
import { useConvexSubscriptions } from '../lib/hooks/use-convex-subscriptions';
import { useFeed } from '../lib/hooks/use-feed';
import { useDebouncedSearch } from '../lib/hooks/use-debounced-search';
import type { Id } from '../convex/_generated/dataModel';

// Mock all the hooks
jest.mock('../lib/hooks/use-convex-settings');
jest.mock('../lib/hooks/use-convex-subscriptions');
jest.mock('../lib/hooks/use-feed');
jest.mock('../lib/hooks/use-debounced-search', () => ({
  useDebouncedSearch: () => ({
    query: '',
    debouncedQuery: '',
    updateQuery: jest.fn(),
    clearQuery: jest.fn(),
    isSearching: false,
  }),
}));

const mockUseConvexSettings = useConvexSettings as jest.MockedFunction<typeof useConvexSettings>;
const mockUseConvexSubscriptions = useConvexSubscriptions as jest.MockedFunction<
  typeof useConvexSubscriptions
>;
const mockUseFeed = useFeed as jest.MockedFunction<typeof useFeed>;

// Helper to create mock Id for testing
const createMockId = (tableName: 'subscriptions', id: string) => {
  return id as unknown as Id<'subscriptions'>;
};

describe('Settings Integration', () => {
  const mockSettings = {
    per_page: 20,
    per_channel: 10,
    showThumbnails: true,
    showDescriptions: true,
    defaultFeedType: 'all' as const,
    sortOrder: 'newest' as const,
    caching_ttl: 0,
    concurrency: 6,
  };

  const mockSubscriptions = [
    {
      _id: createMockId('subscriptions', 'sub1'),
      _creationTime: 1704067200000,
      userId: 'user1',
      channelId: 'channel1',
      channelName: 'Test Channel 1',
      channelLogoUrl: 'https://example.com/logo1.png',
      channelUrl: 'https://youtube.com/channel1',
      createdAt: '2024-01-01T00:00:00Z',
      lastSyncedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockFeedItems = [
    {
      id: 'video1',
      title: 'Test Video 1',
      link: 'https://youtube.com/watch?v=video1',
      published: '2024-01-01T00:00:00Z',
      thumbnail: 'https://example.com/thumb1.jpg',
      description: 'Test description 1',
      channelId: 'channel1',
      channelTitle: 'Test Channel 1',
      isShort: false,
    },
    {
      id: 'video2',
      title: 'Test Video 2',
      link: 'https://youtube.com/watch?v=video2',
      published: '2024-01-02T00:00:00Z',
      thumbnail: 'https://example.com/thumb2.jpg',
      description: 'Test description 2',
      channelId: 'channel1',
      channelTitle: 'Test Channel 1',
      isShort: true,
    },
  ];

  beforeEach(() => {
    mockUseConvexSettings.mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    mockUseConvexSubscriptions.mockReturnValue({
      subscriptions: mockSubscriptions,
      loading: false,
      error: null,
      addSubscription: jest.fn(),
      removeSubscription: jest.fn(),
      clearSubscriptions: jest.fn(),
      refreshSubscriptions: jest.fn(),
    });

    mockUseFeed.mockReturnValue({
      feed: mockFeedItems,
      loading: false,
      error: null,
      total: 2,
      hasMore: false,
      page: 1,
      loadFeed: jest.fn(),
      loadChannelFeed: jest.fn(),
      refreshCurrentFeed: jest.fn(),
    });
  });

  it('renders feed with thumbnails when showThumbnails is true', () => {
    render(<AdvancedVideoFeed />);

    // Should show thumbnails
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
  });

  it('renders feed without thumbnails when showThumbnails is false', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: { ...mockSettings, showThumbnails: false },
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    // Should still show video titles but thumbnails would be hidden
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
  });

  it('renders feed with descriptions when showDescriptions is true', () => {
    render(<AdvancedVideoFeed />);

    // Should show descriptions
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 2')).toBeInTheDocument();
  });

  it('renders feed without descriptions when showDescriptions is false', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: { ...mockSettings, showDescriptions: false },
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    // Should still show video titles but descriptions would be hidden
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    expect(screen.queryByText('Test description 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test description 2')).not.toBeInTheDocument();
  });

  it('applies default feed type filter', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: { ...mockSettings, defaultFeedType: 'video' },
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    // Should only show regular videos, not shorts
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Video 2')).not.toBeInTheDocument();
  });

  it('applies shorts filter when defaultFeedType is short', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: { ...mockSettings, defaultFeedType: 'short' },
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    // Should only show shorts, not regular videos
    expect(screen.queryByText('Test Video 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
  });

  it('applies sort order setting', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: { ...mockSettings, sortOrder: 'oldest' },
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    // With oldest sort, Test Video 1 should appear before Test Video 2
    const videoElements = screen.getAllByText(/Test Video/);
    expect(videoElements[0]).toHaveTextContent('Test Video 1');
    expect(videoElements[1]).toHaveTextContent('Test Video 2');
  });

  it('shows loading state when settings are loading', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: mockSettings,
      loading: true,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();
  });

  it('shows error state when settings have error', () => {
    mockUseConvexSettings.mockReturnValue({
      settings: mockSettings,
      loading: false,
      error: 'Failed to load settings',
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    expect(screen.getByText('Error loading feed')).toBeInTheDocument();
    expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
  });

  it('passes correct settings to feed hook', () => {
    render(<AdvancedVideoFeed />);

    expect(mockUseFeed).toHaveBeenCalledWith(mockSettings);
  });

  it('updates feed when settings change', () => {
    const { rerender } = render(<AdvancedVideoFeed />);

    // Update settings
    const newSettings = { ...mockSettings, showThumbnails: false };
    mockUseConvexSettings.mockReturnValue({
      settings: newSettings,
      loading: false,
      error: null,
      updateSettings: jest.fn(),
      refreshSettings: jest.fn(),
    });

    rerender(<AdvancedVideoFeed />);

    // Feed hook should be called with new settings
    expect(mockUseFeed).toHaveBeenCalledWith(newSettings);
  });

  it('handles empty subscriptions', () => {
    mockUseConvexSubscriptions.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: null,
      addSubscription: jest.fn(),
      removeSubscription: jest.fn(),
      clearSubscriptions: jest.fn(),
      refreshSubscriptions: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    expect(screen.getByText('No subscriptions yet')).toBeInTheDocument();
  });

  it('handles subscriptions loading state', () => {
    mockUseConvexSubscriptions.mockReturnValue({
      subscriptions: [],
      loading: true,
      error: null,
      addSubscription: jest.fn(),
      removeSubscription: jest.fn(),
      clearSubscriptions: jest.fn(),
      refreshSubscriptions: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();
  });

  it('handles subscriptions error state', () => {
    mockUseConvexSubscriptions.mockReturnValue({
      subscriptions: [],
      loading: false,
      error: 'Failed to load subscriptions',
      addSubscription: jest.fn(),
      removeSubscription: jest.fn(),
      clearSubscriptions: jest.fn(),
      refreshSubscriptions: jest.fn(),
    });

    render(<AdvancedVideoFeed />);

    expect(screen.getByText('Error loading feed')).toBeInTheDocument();
  });

  it('allows filtering by search query', async () => {
    const mockUseDebouncedSearch = useDebouncedSearch as jest.MockedFunction<
      typeof useDebouncedSearch
    >;
    mockUseDebouncedSearch.mockReturnValue({
      query: 'Test Video 1',
      debouncedQuery: 'Test Video 1',
      updateQuery: jest.fn(),
      clearQuery: jest.fn(),
      isSearching: false,
    });

    render(<AdvancedVideoFeed />);

    // Should only show matching video
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Video 2')).not.toBeInTheDocument();
  });

  it('allows changing content type filter', async () => {
    render(<AdvancedVideoFeed />);

    // Open filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // Change content type to videos only
    const contentTypeSelect = screen.getByLabelText('Content Type');
    fireEvent.change(contentTypeSelect, { target: { value: 'video' } });

    // Should only show regular videos
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Video 2')).not.toBeInTheDocument();
  });

  it('allows changing sort order', async () => {
    render(<AdvancedVideoFeed />);

    // Open filters
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);

    // Change sort order to oldest
    const sortOrderSelect = screen.getByLabelText('Sort By');
    fireEvent.change(sortOrderSelect, { target: { value: 'oldest' } });

    // Should re-sort the feed
    const videoElements = screen.getAllByText(/Test Video/);
    expect(videoElements[0]).toHaveTextContent('Test Video 1');
    expect(videoElements[1]).toHaveTextContent('Test Video 2');
  });
});

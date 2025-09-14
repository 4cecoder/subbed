import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImprovedSubscriptionManager } from '@/components/improved-subscription-manager';
import { useSubscriptionManager } from '@/lib/hooks/use-subscription-manager';
import { Doc } from '@/convex/_generated/dataModel';

// Mock the useSubscriptionManager hook
jest.mock('@/lib/hooks/use-subscription-manager');

const mockUseSubscriptionManager = useSubscriptionManager as jest.MockedFunction<
  typeof useSubscriptionManager
>;

describe('Enhanced Subscription Manager Scroll Area', () => {
  const mockSubscriptions: Doc<'subscriptions'>[] = Array.from({ length: 50 }, (_, i) => ({
    _id: `sub-${i}` as unknown as Doc<'subscriptions'>['_id'],
    _creationTime: Date.now() - i * 86400000,
    userId: 'test-user',
    channelId: `channel-${i}`,
    channelName: `Test Channel ${i + 1}`,
    channelLogoUrl: `https://example.com/logo-${i}.jpg`,
    channelUrl: `https://youtube.com/channel/channel-${i}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  const mockState = {
    addMode: false,
    inputValue: '',
    searchQuery: '',
    sortBy: 'newest' as const,
    groupBy: 'none' as const,
    viewMode: 'simple' as const,
    isResolving: false,
    resolveError: null,
    resolveSuccess: null,
    showClearConfirm: false,
    showRemoveConfirm: false,
    selectedForRemoval: null,
    expandedGroups: new Set(['all']),
  };

  const mockGroupedSubscriptions = [
    {
      title: 'All Subscriptions',
      subscriptions: mockSubscriptions,
      isExpanded: true,
    },
  ];

  beforeEach(() => {
    mockUseSubscriptionManager.mockReturnValue({
      state: mockState,
      subscriptions: mockSubscriptions,
      loading: false,
      filteredAndSortedSubscriptions: mockSubscriptions,
      groupedSubscriptions: mockGroupedSubscriptions,
      setAddMode: jest.fn(),
      setInputValue: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      setGroupBy: jest.fn(),
      setViewMode: jest.fn(),
      toggleGroup: jest.fn(),
      setShowClearConfirm: jest.fn(),
      setShowRemoveConfirm: jest.fn(),
      handleAddSubscription: jest.fn(),
      handleRemoveSubscription: jest.fn(),
      handleClearAll: jest.fn(),
      resetState: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders scroll area with proper height constraints', () => {
    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Check that scroll area is rendered with proper classes
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).toHaveClass('scroll-area-enhanced');
  });

  it('displays all subscription items within scroll area', () => {
    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Check that subscription items are rendered
    expect(screen.getByText(mockSubscriptions[0].channelName)).toBeInTheDocument();
    expect(screen.getByText(mockSubscriptions[1].channelName)).toBeInTheDocument();
  });

  it('maintains scroll behavior when switching view modes', async () => {
    const { rerender } = render(
      <ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />
    );

    // Switch to advanced mode
    const advancedState = { ...mockState, viewMode: 'advanced' as const };
    mockUseSubscriptionManager.mockReturnValue({
      ...mockUseSubscriptionManager(),
      state: advancedState,
    });

    rerender(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Check that scroll area is still properly configured
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).toHaveClass('scroll-area-enhanced');
  });

  it('handles grouped subscriptions with scroll area', async () => {
    const groupedState = { ...mockState, groupBy: 'date' as const };
    const mockDateGroupedSubscriptions = [
      {
        title: 'Recent (This Week)',
        subscriptions: mockSubscriptions.slice(0, 5),
        isExpanded: true,
      },
      {
        title: 'This Month',
        subscriptions: mockSubscriptions.slice(5, 10),
        isExpanded: true,
      },
    ];

    mockUseSubscriptionManager.mockReturnValue({
      ...mockUseSubscriptionManager(),
      state: groupedState,
      groupedSubscriptions: mockDateGroupedSubscriptions,
    });

    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Check that group headers are rendered
    expect(screen.getByText('Recent (This Week)')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();

    // Check that subscription items are still scrollable
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toBeInTheDocument();
  });

  it('applies enhanced scroll styling classes', () => {
    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea).toHaveClass('scroll-area-enhanced');

    // Check viewport has smooth scrolling
    const viewport = document.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveClass('scroll-smooth-enhanced');
  });

  it('maintains proper layout with empty state', () => {
    mockUseSubscriptionManager.mockReturnValue({
      ...mockUseSubscriptionManager(),
      subscriptions: [],
      filteredAndSortedSubscriptions: [],
      groupedSubscriptions: [],
    });

    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Should show empty state instead of scroll area
    expect(screen.getByText('No subscriptions yet')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="scroll-area"]')).not.toBeInTheDocument();
  });

  it('handles loading state properly', () => {
    mockUseSubscriptionManager.mockReturnValue({
      ...mockUseSubscriptionManager(),
      loading: true,
    });

    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Should show loading state instead of scroll area
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="scroll-area"]')).not.toBeInTheDocument();
  });

  it('preserves subscription item functionality within scroll area', async () => {
    const onOpenChange = jest.fn();
    render(<ImprovedSubscriptionManager open={true} onOpenChange={onOpenChange} />);

    // Find the first subscription item's remove button
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    const firstRemoveButton = removeButtons[0];

    // Click remove button
    fireEvent.click(firstRemoveButton);

    // Should trigger remove confirmation
    await waitFor(() => {
      expect(mockUseSubscriptionManager().setShowRemoveConfirm).toHaveBeenCalledWith(
        true,
        mockSubscriptions[0]
      );
    });
  });

  it('has proper scroll area container structure', () => {
    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Check that the scroll area is wrapped in a container with proper classes
    const scrollContainer = document.querySelector('.subscription-list-container');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass('flex-1', 'min-h-0', 'overflow-hidden');

    // Check that the scroll area has proper height constraints
    const scrollArea = document.querySelector('[data-slot="scroll-area"]');
    expect(scrollArea).toBeInTheDocument();
    expect(scrollArea?.parentElement).toHaveClass('h-full', 'w-full');
  });

  it('includes scroll indicator for better UX', () => {
    render(<ImprovedSubscriptionManager open={true} onOpenChange={jest.fn()} />);

    // Check that scroll indicator is present
    const scrollIndicator = document.querySelector('.scroll-indicator');
    expect(scrollIndicator).toBeInTheDocument();
    expect(scrollIndicator).toHaveClass('absolute', 'bottom-0', 'left-0', 'right-0');
  });
});

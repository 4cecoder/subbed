import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionList from '../components/subscription-list';
import { EnhancedSubscriptionList } from '../components/enhanced-subscription-list';
import type { Id } from '../convex/_generated/dataModel';

// Mock ScrollArea component to test scrolling behavior
jest.mock('../components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}));

describe('Subscription List Scrolling', () => {
  // Helper to create mock Id for testing
  const createMockId = (tableName: 'subscriptions', id: string) => {
    return id as unknown as Id<'subscriptions'>;
  };
  const mockSubscriptions = Array.from({ length: 50 }, (_, i) => ({
    id: `channel-${i}`,
    title: `Test Channel ${i + 1}`,
    url: `https://youtube.com/channel/test${i}`,
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const mockConvexSubscriptions = Array.from({ length: 50 }, (_, i) => ({
    _id: createMockId('subscriptions', `convex-${i}`),
    _creationTime: Date.now() - i * 24 * 60 * 60 * 1000,
    userId: 'test-user',
    channelId: `channel-${i}`,
    channelName: `Test Channel ${i + 1}`,
    channelLogoUrl: `https://example.com/logo${i}.jpg`,
    channelUrl: `https://youtube.com/channel/test${i}`,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  }));

  const mockEnhancedProps = {
    subs: mockSubscriptions,
    selected: null,
    loading: false,
    onSelect: jest.fn(),
    onRefreshAll: jest.fn(),
    onRemove: jest.fn(),
    onOpenClearConfirm: jest.fn(),
  };

  const mockSubscriptionListProps = {
    subscriptions: mockConvexSubscriptions,
    selectedId: null,
    loading: false,
    onSelect: jest.fn(),
    onRefreshAll: jest.fn(),
    onOpenClearConfirm: jest.fn(),
  };

  describe('SubscriptionList (Enhanced)', () => {
    it('renders with ScrollArea for many subscriptions', () => {
      render(<SubscriptionList {...mockSubscriptionListProps} />);

      // Check if ScrollArea is rendered
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();

      // Check if all subscriptions are rendered
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(50);

      // Check if component has proper height classes
      const card = screen
        .getByRole('heading', { name: /subscriptions/i })
        .closest('.border-border\\/60');
      expect(card).toHaveClass('h-full', 'flex', 'flex-col');
    });

    it('maintains proper layout with many items', () => {
      render(<SubscriptionList {...mockSubscriptionListProps} />);

      // Check if content area has flex layout
      const cardContent = screen.getByTestId('scroll-area').closest('.flex-1');
      expect(cardContent).toBeInTheDocument();

      // Check if subscription items are properly spaced
      const subscriptionItems = screen.getAllByRole('listitem');
      subscriptionItems.forEach(item => {
        expect(item).toHaveClass('border', 'rounded-xl');
      });
    });

    it('handles empty state without scrolling issues', () => {
      render(<SubscriptionList {...mockSubscriptionListProps} subscriptions={[]} />);

      expect(screen.getByText('No subscriptions yet')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });

    it('handles search functionality', async () => {
      render(<SubscriptionList {...mockSubscriptionListProps} />);

      // Find search input
      const searchInput = screen.getByPlaceholderText('Search subscriptions...');

      // Search for a specific channel
      fireEvent.change(searchInput, { target: { value: 'Test Channel 5' } });

      // Should show filtered results
      await waitFor(() => {
        expect(screen.getByText('Test Channel 5')).toBeInTheDocument();
        expect(screen.queryByText('Test Channel 1')).not.toBeInTheDocument();
      });
    });

    it('handles sorting functionality', async () => {
      render(<SubscriptionList {...mockSubscriptionListProps} />);

      // Find and click filter button
      const filterButton = screen.getByRole('button', { name: /toggle filters/i });
      fireEvent.click(filterButton);

      // Change sort to 'name'
      const sortSelect = screen.getByLabelText('Sort subscriptions');
      fireEvent.change(sortSelect, { target: { value: 'name' } });

      // Should still show all subscriptions but sorted
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(50);
    });

    it('handles grouping functionality', async () => {
      render(<SubscriptionList {...mockSubscriptionListProps} />);

      // Find and click filter button
      const filterButton = screen.getByRole('button', { name: /toggle filters/i });
      fireEvent.click(filterButton);

      // Change grouping to 'alphabetical'
      const groupSelect = screen.getByLabelText('Group subscriptions');
      fireEvent.change(groupSelect, { target: { value: 'alphabetical' } });

      // Should show grouped subscriptions
      await waitFor(() => {
        // Look for any alphabetical grouping buttons
        const groupButtons = screen.getAllByRole('button', { name: /[A-Z]/ });
        expect(groupButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('EnhancedSubscriptionList', () => {
    it('renders with proper height constraints and ScrollArea', () => {
      render(<EnhancedSubscriptionList {...mockEnhancedProps} />);

      // Check if ScrollArea is rendered
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();

      // Check if card has max height constraint
      const card = screen
        .getByRole('heading', { name: /subscriptions/i })
        .closest('.border-border\\/60');
      expect(card).toHaveClass('max-h-[calc(100vh-200px)]');

      // Check if all subscriptions are rendered
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(50);
    });

    it('maintains responsive layout with many items', () => {
      render(<EnhancedSubscriptionList {...mockEnhancedProps} />);

      // Check if header is not scrollable (flex-shrink-0)
      const header = screen
        .getByRole('heading', { name: /subscriptions/i })
        .closest('.flex-shrink-0');
      expect(header).toBeInTheDocument();

      // Check if action buttons area is not scrollable
      const actionButtons = screen.getByText('Refresh All').closest('.flex-shrink-0');
      expect(actionButtons).toBeInTheDocument();

      // Check if scroll area takes remaining space
      const scrollArea = screen.getByTestId('scroll-area');
      expect(scrollArea).toHaveClass('flex-1', 'min-h-0');
    });

    it('handles search and filtering with many items', async () => {
      render(<EnhancedSubscriptionList {...mockEnhancedProps} />);

      // Find search input
      const searchInput = screen.getByPlaceholderText('Search subscriptions...');

      // Search for a specific channel
      fireEvent.change(searchInput, { target: { value: 'Test Channel 5' } });

      // Should show filtered results
      await waitFor(() => {
        expect(screen.getByText('Test Channel 5')).toBeInTheDocument();
        expect(screen.queryByText('Test Channel 1')).not.toBeInTheDocument();
      });

      // ScrollArea should still be present
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });

    it('handles grouping with many items', async () => {
      render(<EnhancedSubscriptionList {...mockEnhancedProps} />);

      // Find and click filter button
      const filterButton = screen.getByRole('button', { name: /toggle filters/i });
      fireEvent.click(filterButton);

      // Change grouping to 'date'
      const groupSelect = screen.getByLabelText('Group subscriptions');
      fireEvent.change(groupSelect, { target: { value: 'date' } });

      // Should show grouped subscriptions
      await waitFor(() => {
        expect(screen.getByText(/Recent \(This Week\)/i)).toBeInTheDocument();
        expect(screen.getByText(/This Month/i)).toBeInTheDocument();
        expect(screen.getByText(/Older/i)).toBeInTheDocument();
      });

      // ScrollArea should still be present
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });

    it('handles empty state with enhanced features', () => {
      render(<EnhancedSubscriptionList {...mockEnhancedProps} subs={[]} />);

      expect(screen.getByText('No subscriptions yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first YouTube channel above')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });
  });

  describe('Performance with many items', () => {
    it('renders 100+ subscriptions without performance issues', () => {
      const manySubscriptions = Array.from({ length: 100 }, (_, i) => ({
        id: `channel-${i}`,
        title: `Test Channel ${i + 1}`,
        url: `https://youtube.com/channel/test${i}`,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const startTime = performance.now();
      render(<EnhancedSubscriptionList {...mockEnhancedProps} subs={manySubscriptions} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);

      // Should render all items
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(100);

      // ScrollArea should be present
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument();
    });
  });
});

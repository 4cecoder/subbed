import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SubscriptionList } from '../components/subscription-list'
import { EnhancedSubscriptionList } from '../components/enhanced-subscription-list'

// Mock the ScrollArea component to test scrolling behavior
jest.mock('../components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="scroll-area" className={className}>
      {children}
    </div>
  ),
}))

describe('Subscription List Scrolling', () => {
  const mockSubscriptions = Array.from({ length: 50 }, (_, i) => ({
    id: `channel-${i}`,
    title: `Test Channel ${i + 1}`,
    url: `https://youtube.com/channel/test${i}`,
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const mockProps = {
    subs: mockSubscriptions,
    selected: null,
    loading: false,
    onSelect: jest.fn(),
    onRefreshAll: jest.fn(),
    onRemove: jest.fn(),
    onOpenClearConfirm: jest.fn(),
  }

  describe('SubscriptionList', () => {
    it('renders with ScrollArea for many subscriptions', () => {
      render(<SubscriptionList {...mockProps} />)
      
      // Check if ScrollArea is rendered
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
      
      // Check if all subscriptions are rendered
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(50)
      
      // Check if the component has proper height classes
      const card = screen.getByRole('heading', { name: /subscriptions/i }).closest('.card')
      expect(card).toHaveClass('h-full', 'flex', 'flex-col')
    })

    it('maintains proper layout with many items', () => {
      render(<SubscriptionList {...mockProps} />)
      
      // Check if the content area has flex layout
      const cardContent = screen.getByTestId('scroll-area').closest('.flex-1')
      expect(cardContent).toBeInTheDocument()
      
      // Check if subscription items are properly spaced
      const subscriptionItems = screen.getAllByRole('listitem')
      subscriptionItems.forEach(item => {
        expect(item).toHaveClass('border', 'rounded-lg')
      })
    })

    it('handles empty state without scrolling issues', () => {
      render(<SubscriptionList {...mockProps} subs={[]} />)
      
      expect(screen.getByText('No subscriptions yet.')).toBeInTheDocument()
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('EnhancedSubscriptionList', () => {
    it('renders with proper height constraints and ScrollArea', () => {
      render(<EnhancedSubscriptionList {...mockProps} />)
      
      // Check if ScrollArea is rendered
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
      
      // Check if the card has max height constraint
      const card = screen.getByRole('heading', { name: /subscriptions/i }).closest('.card')
      expect(card).toHaveClass('max-h-[calc(100vh-200px)]')
      
      // Check if all subscriptions are rendered
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(50)
    })

    it('maintains responsive layout with many items', () => {
      render(<EnhancedSubscriptionList {...mockProps} />)
      
      // Check if the header is not scrollable (flex-shrink-0)
      const header = screen.getByRole('heading', { name: /subscriptions/i }).closest('.flex-shrink-0')
      expect(header).toBeInTheDocument()
      
      // Check if action buttons area is not scrollable
      const actionButtons = screen.getByText('Refresh All').closest('.flex-shrink-0')
      expect(actionButtons).toBeInTheDocument()
      
      // Check if scroll area takes remaining space
      const scrollArea = screen.getByTestId('scroll-area')
      expect(scrollArea).toHaveClass('flex-1', 'min-h-0')
    })

    it('handles search and filtering with many items', async () => {
      render(<EnhancedSubscriptionList {...mockProps} />)
      
      // Find search input
      const searchInput = screen.getByPlaceholderText('Search subscriptions...')
      
      // Search for a specific channel
      fireEvent.change(searchInput, { target: { value: 'Test Channel 5' } })
      
      // Should show filtered results
      await waitFor(() => {
        expect(screen.getByText('Test Channel 5')).toBeInTheDocument()
        expect(screen.queryByText('Test Channel 1')).not.toBeInTheDocument()
      })
      
      // ScrollArea should still be present
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('handles grouping with many items', async () => {
      render(<EnhancedSubscriptionList {...mockProps} />)
      
      // Find and click the filter button
      const filterButton = screen.getByRole('button', { name: /toggle filters/i })
      fireEvent.click(filterButton)
      
      // Change grouping to 'date'
      const groupSelect = screen.getByLabelText('Group subscriptions')
      fireEvent.change(groupSelect, { target: { value: 'date' } })
      
      // Should show grouped subscriptions
      await waitFor(() => {
        expect(screen.getByText(/Recent \(This Week\)/i)).toBeInTheDocument()
        expect(screen.getByText(/This Month/i)).toBeInTheDocument()
        expect(screen.getByText(/Older/i)).toBeInTheDocument()
      })
      
      // ScrollArea should still be present
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })

    it('handles empty state with enhanced features', () => {
      render(<EnhancedSubscriptionList {...mockProps} subs={[]} />)
      
      expect(screen.getByText('No subscriptions yet')).toBeInTheDocument()
      expect(screen.getByText('Add your first YouTube channel above')).toBeInTheDocument()
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })

  describe('Performance with many items', () => {
    it('renders 100+ subscriptions without performance issues', () => {
      const manySubscriptions = Array.from({ length: 100 }, (_, i) => ({
        id: `channel-${i}`,
        title: `Test Channel ${i + 1}`,
        url: `https://youtube.com/channel/test${i}`,
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      }))

      const startTime = performance.now()
      render(<EnhancedSubscriptionList {...mockProps} subs={manySubscriptions} />)
      const endTime = performance.now()

      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should render all items
      expect(screen.getAllByText(/Test Channel/)).toHaveLength(100)
      
      // ScrollArea should be present
      expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    })
  })
})
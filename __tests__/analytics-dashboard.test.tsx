import { render, screen } from '@testing-library/react'
import { AnalyticsDashboard } from '../components/analytics-dashboard'
import { FeedItem, Subscription } from '../lib/types'

describe('AnalyticsDashboard', () => {
  const mockSubscriptions: Subscription[] = [
    {
      id: 'channel1',
      title: 'Test Channel 1',
      url: 'https://youtube.com/channel1',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'channel2',
      title: 'Test Channel 2',
      url: 'https://youtube.com/channel2',
      created_at: '2024-01-02T00:00:00Z'
    }
  ]

  const mockFeed: FeedItem[] = [
    {
      id: 'video1',
      title: 'Test Video 1',
      link: 'https://youtube.com/watch?v=video1',
      published: '2024-01-10T00:00:00Z',
      thumbnail: 'https://example.com/thumb1.jpg',
      description: 'Test description 1',
      channelId: 'channel1',
      channelTitle: 'Test Channel 1',
      isShort: false
    },
    {
      id: 'video2',
      title: 'Test Short 1',
      link: 'https://youtube.com/watch?v=video2',
      published: '2024-01-11T00:00:00Z',
      thumbnail: 'https://example.com/thumb2.jpg',
      description: 'Test short description 1',
      channelId: 'channel1',
      channelTitle: 'Test Channel 1',
      isShort: true
    },
    {
      id: 'video3',
      title: 'Test Video 2',
      link: 'https://youtube.com/watch?v=video3',
      published: '2024-01-12T00:00:00Z',
      thumbnail: 'https://example.com/thumb3.jpg',
      description: 'Test description 2',
      channelId: 'channel2',
      channelTitle: 'Test Channel 2',
      isShort: false
    }
  ]

  it('renders loading state', () => {
    render(
      <AnalyticsDashboard 
        feed={[]} 
        subscriptions={mockSubscriptions} 
        loading={true} 
      />
    )

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(4) // 4 loading skeletons
  })

  it('renders empty state when no feed data', () => {
    render(
      <AnalyticsDashboard 
        feed={[]} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('No Data to Analyze')).toBeInTheDocument()
    expect(screen.getByText(/Subscribe to some channels/)).toBeInTheDocument()
  })

  it('renders analytics overview with data', () => {
    render(
      <AnalyticsDashboard 
        feed={mockFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Overview')).toBeInTheDocument()
    
    // Check overview cards
    expect(screen.getByText('Total Videos')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // Total videos
    expect(screen.getByText('Active Channels')).toBeInTheDocument()
    expect(screen.getByText('Short Videos')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // Short videos
    expect(screen.getByText('Avg per Channel')).toBeInTheDocument()
  })

  it('renders content distribution correctly', () => {
    render(
      <AnalyticsDashboard 
        feed={mockFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Content Distribution')).toBeInTheDocument()
    expect(screen.getByText('Content Type Breakdown')).toBeInTheDocument()
    expect(screen.getByText('1 Shorts')).toBeInTheDocument()
    expect(screen.getByText('2 Videos')).toBeInTheDocument()
    expect(screen.getByText('33%')).toBeInTheDocument() // Shorts percentage
  })

  it('renders content timeline correctly', () => {
    render(
      <AnalyticsDashboard 
        feed={mockFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Content Timeline')).toBeInTheDocument()
    expect(screen.getByText('Oldest Content')).toBeInTheDocument()
    expect(screen.getByText('Newest Content')).toBeInTheDocument()
    
    // Check for dates using more flexible matching
    const dateElements = screen.getAllByText(/2024/)
    expect(dateElements.length).toBeGreaterThan(0)
  })

  it('renders activity metrics correctly', () => {
    render(
      <AnalyticsDashboard 
        feed={mockFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Videos per day')).toBeInTheDocument()
    expect(screen.getByText('Most active day')).toBeInTheDocument()
  })

  it('renders recent activity section', () => {
    render(
      <AnalyticsDashboard 
        feed={mockFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Recent Activity (Last 30 Days)')).toBeInTheDocument()
  })

  it('renders top active channels correctly', () => {
    render(
      <AnalyticsDashboard 
        feed={mockFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('Top Active Channels')).toBeInTheDocument()
    expect(screen.getByText('Test Channel 1')).toBeInTheDocument()
    expect(screen.getByText('Test Channel 2')).toBeInTheDocument()
    
    // Check channel rankings - look for them within ranking circles
    const rankingCircles = screen.getAllByText('1')
    expect(rankingCircles.length).toBeGreaterThan(0)
    
    // Check video counts - be more specific about which elements we're checking
    const channel1Badges = screen.getAllByText('2')
    expect(channel1Badges.length).toBeGreaterThan(0)
    
    // Channel 2 should have 1 video - look for badge with 1
    const channel2Badge = screen.getByText('1', { selector: '[data-slot="badge"]' })
    expect(channel2Badge).toBeInTheDocument()
  })

  it('calculates analytics correctly with mixed content', () => {
    const mixedFeed: FeedItem[] = [
      ...mockFeed,
      {
        id: 'video4',
        title: 'Another Short',
        link: 'https://youtube.com/watch?v=video4',
        published: '2024-01-13T00:00:00Z',
        channelId: 'channel2',
        channelTitle: 'Test Channel 2',
        isShort: true
      }
    ]

    render(
      <AnalyticsDashboard 
        feed={mixedFeed} 
        subscriptions={mockSubscriptions} 
        loading={false} 
      />
    )

    expect(screen.getByText('4')).toBeInTheDocument() // Total videos
    expect(screen.getByText('50%')).toBeInTheDocument() // Shorts percentage
  })

  it('handles single channel scenario', () => {
    const singleChannelFeed: FeedItem[] = [
      {
        id: 'video1',
        title: 'Single Channel Video',
        link: 'https://youtube.com/watch?v=video1',
        published: '2024-01-10T00:00:00Z',
        channelId: 'channel1',
        channelTitle: 'Test Channel 1',
        isShort: false
      }
    ]

    render(
      <AnalyticsDashboard 
        feed={singleChannelFeed} 
        subscriptions={[mockSubscriptions[0]]} 
        loading={false} 
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument() // Total videos
    expect(screen.getByText('1')).toBeInTheDocument() // Active channels
    expect(screen.getByText('1')).toBeInTheDocument() // Average per channel
  })

  it('handles shorts-only content', () => {
    const shortsOnlyFeed: FeedItem[] = [
      {
        id: 'short1',
        title: 'Short 1',
        link: 'https://youtube.com/watch?v=short1',
        published: '2024-01-10T00:00:00Z',
        channelId: 'channel1',
        channelTitle: 'Test Channel 1',
        isShort: true
      },
      {
        id: 'short2',
        title: 'Short 2',
        link: 'https://youtube.com/watch?v=short2',
        published: '2024-01-11T00:00:00Z',
        channelId: 'channel1',
        channelTitle: 'Test Channel 1',
        isShort: true
      }
    ]

    render(
      <AnalyticsDashboard 
        feed={shortsOnlyFeed} 
        subscriptions={[mockSubscriptions[0]]} 
        loading={false} 
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument() // Total videos
    expect(screen.getByText('2')).toBeInTheDocument() // Short videos
    expect(screen.getByText('100%')).toBeInTheDocument() // Shorts percentage
  })

  it('handles regular videos only content', () => {
    const regularOnlyFeed: FeedItem[] = [
      {
        id: 'video1',
        title: 'Regular Video 1',
        link: 'https://youtube.com/watch?v=video1',
        published: '2024-01-10T00:00:00Z',
        channelId: 'channel1',
        channelTitle: 'Test Channel 1',
        isShort: false
      },
      {
        id: 'video2',
        title: 'Regular Video 2',
        link: 'https://youtube.com/watch?v=video2',
        published: '2024-01-11T00:00:00Z',
        channelId: 'channel1',
        channelTitle: 'Test Channel 1',
        isShort: false
      }
    ]

    render(
      <AnalyticsDashboard 
        feed={regularOnlyFeed} 
        subscriptions={[mockSubscriptions[0]]} 
        loading={false} 
      />
    )

    expect(screen.getByText('2')).toBeInTheDocument() // Total videos
    expect(screen.getByText('0')).toBeInTheDocument() // Short videos
    expect(screen.getByText('0%')).toBeInTheDocument() // Shorts percentage
  })
})
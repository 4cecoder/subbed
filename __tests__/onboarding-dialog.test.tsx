import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingDialog } from '../components/onboarding-dialog'

describe('OnboardingDialog', () => {
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    mockOnOpenChange.mockClear()
  })

  it('renders dialog when open', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    expect(screen.getByText('Welcome to Subbed!')).toBeInTheDocument()
    expect(screen.getByText('Your personal YouTube subscription manager')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<OnboardingDialog open={false} onOpenChange={mockOnOpenChange} />)
    
    expect(screen.queryByText('Welcome to Subbed!')).not.toBeInTheDocument()
  })

  it('shows first step by default', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    expect(screen.getByText('What is Subbed?')).toBeInTheDocument()
    expect(screen.getByText('Add Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Refresh Feeds')).toBeInTheDocument()
  })

  it('navigates to second step when Next is clicked', async () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Why Choose Subbed?')).toBeInTheDocument()
      expect(screen.getByText('Privacy First')).toBeInTheDocument()
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument()
    })
  })

  it('navigates back to first step when Previous is clicked', async () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    // Go to second step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Why Choose Subbed?')).toBeInTheDocument()
    })

    // Go back to first step
    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)

    await waitFor(() => {
      expect(screen.getByText('What is Subbed?')).toBeInTheDocument()
    })
  })

  it('closes dialog when Get Started is clicked on last step', async () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    // Go to second step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Why Choose Subbed?')).toBeInTheDocument()
    })

    // Click Get Started
    const getStartedButton = screen.getByText('Get Started')
    fireEvent.click(getStartedButton)

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('shows progress indicator', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    const progressDots = screen.getAllByRole('presentation').filter(
      element => element.className.includes('rounded-full')
    )
    
    expect(progressDots).toHaveLength(2)
  })

  it('shows step counter', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })

  it('updates step counter when navigating', async () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    // Check first step
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    
    // Go to second step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    })
  })

  it('displays all features in first step', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    expect(screen.getByText('Add Subscriptions')).toBeInTheDocument()
    expect(screen.getByText('Refresh Feeds')).toBeInTheDocument()
    expect(screen.getByText('Search & Filter')).toBeInTheDocument()
    expect(screen.getByText('Customize Experience')).toBeInTheDocument()
  })

  it('displays all benefits in second step', async () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    // Go to second step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Privacy First')).toBeInTheDocument()
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument()
      expect(screen.getByText('Open Source')).toBeInTheDocument()
    })
  })

  it('shows badges for features', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    expect(screen.getByText('Easy Setup')).toBeInTheDocument()
    expect(screen.getByText('Real-time')).toBeInTheDocument()
    expect(screen.getByText('Powerful')).toBeInTheDocument()
    expect(screen.getByText('Flexible')).toBeInTheDocument()
  })

  it('shows call-to-action section in second step', async () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    // Go to second step
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Ready to get started?')).toBeInTheDocument()
      expect(screen.getByText('Add your first YouTube subscription and see the difference!')).toBeInTheDocument()
      expect(screen.getByText('No YouTube account required')).toBeInTheDocument()
    })
  })

  it('has proper accessibility attributes', () => {
    render(<OnboardingDialog open={true} onOpenChange={mockOnOpenChange} />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    
    const title = screen.getByText('Welcome to Subbed!')
    expect(title).toBeInTheDocument()
  })
})
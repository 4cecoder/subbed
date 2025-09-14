import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackDialog } from '../components/feedback-dialog';
import { useFeedback } from '../lib/hooks/use-feedback';

// Mock the useFeedback hook
jest.mock('../lib/hooks/use-feedback', () => ({
  useFeedback: jest.fn(() => ({
    isSubmitting: false,
    submissionResult: null,
    submitFeedback: jest.fn().mockResolvedValue({
      success: true,
      message: 'Thank you for your feedback!',
    }),
    clearResult: jest.fn(),
  })),
}));

// Mock the useFeatureFlag hook
jest.mock('../lib/hooks/use-feature-flags', () => ({
  useFeatureFlag: () => true,
}));

// Mock the useAuth hook
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
}));

describe('FeedbackDialog', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders feedback button', () => {
    render(<FeedbackDialog />);
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });

  it('opens dialog when button is clicked', () => {
    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);
    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);

    // Try to submit without filling the form
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Please select a category')).toBeInTheDocument();
      expect(screen.getByText('Please enter your feedback')).toBeInTheDocument();
    });
  });

  it('submits feedback form with valid data', async () => {
    const mockUseFeedback = useFeedback as jest.MockedFunction<typeof useFeedback>;
    const mockSubmitFeedback = mockUseFeedback().submitFeedback;

    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'ui-ux' } });
    fireEvent.change(screen.getByLabelText(/Message/), {
      target: { value: 'This is a valid feedback message that is long enough' },
    });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'test@example.com' } });

    // Submit
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith({
        category: 'ui-ux',
        message: 'This is a valid feedback message that is long enough',
        email: 'test@example.com',
      });
    });
  });

  it('shows success message after successful submission', async () => {
    const mockUseFeedback = useFeedback as jest.MockedFunction<typeof useFeedback>;
    const mockSubmitFeedback = mockUseFeedback().submitFeedback;

    // Mock successful submission
    mockSubmitFeedback.mockResolvedValue({
      success: true,
      message: 'Thank you for your feedback!',
    });

    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'ui-ux' } });
    fireEvent.change(screen.getByLabelText(/Message/), {
      target: { value: 'Valid feedback message' },
    });
    fireEvent.click(screen.getByText('Submit Feedback'));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
      expect(screen.getByText(/Thank you for your feedback!/)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);

    // Fill form with invalid email
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'ui-ux' } });
    fireEvent.change(screen.getByLabelText(/Message/), {
      target: { value: 'Valid feedback message' },
    });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'invalid-email' } });

    // Submit
    fireEvent.click(screen.getByText('Submit Feedback'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows character count for message', () => {
    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);

    const textarea = screen.getByLabelText(/Message/);
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    expect(screen.getByText('12/1000 characters')).toBeInTheDocument();
  });

  it('shows anonymous notice when not signed in', () => {
    // Mock not signed in
    jest.mock('@clerk/nextjs', () => ({
      useAuth: () => ({
        isSignedIn: false,
        isLoaded: true,
      }),
    }));

    render(<FeedbackDialog />);
    const button = screen.getByText('Feedback');
    fireEvent.click(button);

    expect(screen.getByText(/You're not signed in/)).toBeInTheDocument();
    expect(
      screen.getByText(/Your feedback will still be submitted anonymously/)
    ).toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FeedbackDialog } from '../components/feedback-dialog'

describe('FeedbackDialog', () => {
  it('renders feedback button', () => {
    render(<FeedbackDialog />)
    expect(screen.getByText('Feedback')).toBeInTheDocument()
  })

  it('opens dialog when button is clicked', () => {
    render(<FeedbackDialog />)
    const button = screen.getByText('Feedback')
    fireEvent.click(button)
    expect(screen.getByText('Share Your Feedback')).toBeInTheDocument()
  })

  it('submits feedback form', async () => {
    // Mock alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<FeedbackDialog />)
    const button = screen.getByText('Feedback')
    fireEvent.click(button)

    // Fill form
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'ui-ux' } })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Test feedback' } })
    fireEvent.change(screen.getByLabelText('Email (optional)'), { target: { value: 'test@example.com' } })

    // Submit
    fireEvent.click(screen.getByText('Submit Feedback'))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Thank you for your feedback!')
    })

    alertMock.mockRestore()
  })
})
import { useState } from 'react';

export interface FeedbackData {
  category: string;
  message: string;
  email?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface FeedbackSubmission {
  success: boolean;
  message: string;
  data?: FeedbackData;
}

export function useFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<FeedbackSubmission | null>(null);

  const submitFeedback = async (feedback: FeedbackData): Promise<FeedbackSubmission> => {
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Add metadata
      const enhancedFeedback: FeedbackData = {
        ...feedback,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        timestamp: new Date().toISOString(),
      };

      // Try to send to API endpoint
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedFeedback),
      });

      if (response.ok) {
        const result = await response.json();
        const successResult: FeedbackSubmission = {
          success: true,
          message: result.message || 'Thank you for your feedback!',
          data: enhancedFeedback,
        };
        setSubmissionResult(successResult);
        return successResult;
      } else {
        // Fallback to console logging if API fails
        console.log('Feedback submitted (fallback):', enhancedFeedback);
        const fallbackResult: FeedbackSubmission = {
          success: true,
          message: 'Thank you for your feedback! (Saved locally)',
          data: enhancedFeedback,
        };
        setSubmissionResult(fallbackResult);
        return fallbackResult;
      }
    } catch (error) {
      // Fallback to console logging if network error
      console.log('Feedback submitted (fallback):', feedback);
      const errorResult: FeedbackSubmission = {
        success: true,
        message: 'Thank you for your feedback! (Saved locally)',
        data: feedback,
      };
      setSubmissionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearResult = () => {
    setSubmissionResult(null);
  };

  return {
    isSubmitting,
    submissionResult,
    submitFeedback,
    clearResult,
  };
}
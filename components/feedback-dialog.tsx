'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useFeatureFlag } from '@/lib/hooks/use-feature-flags';
import { useFeedback } from '@/lib/hooks/use-feedback';
import { useAuth } from '@clerk/nextjs';

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
}

const CATEGORIES = [
  { value: 'ui-ux', label: 'UI/UX Design' },
  { value: 'performance', label: 'Performance' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'features', label: 'New Features' },
  { value: 'bugs', label: 'Bug Reports' },
  { value: 'other', label: 'Other' },
];

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const isEnabled = useFeatureFlag('feedback_dialog');
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isSubmitting, submissionResult, submitFeedback, clearResult } = useFeedback();

  if (!isEnabled) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!message.trim()) {
      newErrors.message = 'Please enter your feedback';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Feedback must be at least 10 characters long';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await submitFeedback({
      category,
      message: message.trim(),
      email: email.trim() || undefined,
    });

    if (result.success) {
      // Reset form
      setCategory('');
      setMessage('');
      setEmail('');
      setErrors({});

      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        clearResult();
      }, 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrors({});
    clearResult();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        {submissionResult?.success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Thank you!</h3>
              <p className="text-sm text-muted-foreground">{submissionResult.message}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                rows={4}
                className={errors.message ? 'border-red-500' : ''}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              <div className="flex justify-between items-center">
                {errors.message && (
                  <p id="message-error" className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.message}
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {message.length}/1000 characters
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email (optional)
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? 'border-red-500' : ''}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Provide your email if you&apos;d like us to follow up with you
              </p>
            </div>

            {!isSignedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  You&apos;re not signed in. Your feedback will still be submitted anonymously.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isCompleted: boolean;
  lastSeenVersion: string | null;
}

const ONBOARDING_STORAGE_KEY = 'subbed_onboarding_state';
const CURRENT_VERSION = '1.0.0';

export function useOnboarding() {
  const { isSignedIn, isLoaded } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    hasSeenOnboarding: false,
    isCompleted: false,
    lastSeenVersion: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (error) {
      console.warn('Failed to load onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save onboarding state to localStorage
  const saveState = (newState: Partial<OnboardingState>) => {
    if (typeof window === 'undefined') return;

    const updatedState = { ...state, ...newState };
    setState(updatedState);

    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  };

  // Check if onboarding should be shown
  const shouldShowOnboarding = () => {
    if (!isLoaded || isLoading) return false;
    if (!isSignedIn) return false;

    // Show if never seen or version changed
    return !state.hasSeenOnboarding || state.lastSeenVersion !== CURRENT_VERSION;
  };

  // Mark onboarding as seen
  const markAsSeen = () => {
    saveState({
      hasSeenOnboarding: true,
      lastSeenVersion: CURRENT_VERSION,
    });
  };

  // Mark onboarding as completed
  const markAsCompleted = () => {
    saveState({
      isCompleted: true,
      hasSeenOnboarding: true,
      lastSeenVersion: CURRENT_VERSION,
    });
  };

  // Reset onboarding (for testing or manual trigger)
  const resetOnboarding = () => {
    saveState({
      hasSeenOnboarding: false,
      isCompleted: false,
      lastSeenVersion: null,
    });
  };

  return {
    state,
    isLoading,
    shouldShowOnboarding,
    markAsSeen,
    markAsCompleted,
    resetOnboarding,
  };
}

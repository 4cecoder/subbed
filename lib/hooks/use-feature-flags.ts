import { useState, useEffect } from 'react';

interface FeatureFlags {
  [key: string]: boolean;
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlags = {
  feedback_dialog: true,
  advanced_search: false,
  dark_mode: true,
  performance_monitoring: true,
  analytics: true,
  a_b_testing: false,
};

class FeatureFlagManager {
  private flags: FeatureFlags = { ...DEFAULT_FLAGS };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  getFlag(key: string): boolean {
    return this.flags[key] ?? false;
  }

  setFlag(key: string, value: boolean): void {
    this.flags[key] = value;
    this.saveToStorage();
    this.notifyListeners();
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...DEFAULT_FLAGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('feature_flags', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  // A/B testing support
  setVariant(flagKey: string, variant: string): void {
    // Simple A/B testing - in real app, use proper A/B testing service
    const variants = ['control', 'variant_a', 'variant_b'];
    const index = variants.indexOf(variant);
    if (index === -1) return;

    this.setFlag(`${flagKey}_variant_${variant}`, true);
  }

  getVariant(flagKey: string): string {
    // Return active variant or 'control'
    const variants = ['variant_a', 'variant_b'];
    for (const variant of variants) {
      if (this.getFlag(`${flagKey}_variant_${variant}`)) {
        return variant;
      }
    }
    return 'control';
  }
}

export const featureFlagManager = new FeatureFlagManager();

export function useFeatureFlag(flagKey: string): boolean {
  const [value, setValue] = useState(() => featureFlagManager.getFlag(flagKey));

  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(() => {
      setValue(featureFlagManager.getFlag(flagKey));
    });

    return unsubscribe;
  }, [flagKey]);

  return value;
}

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState(() => featureFlagManager.getAllFlags());

  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(() => {
      setFlags(featureFlagManager.getAllFlags());
    });

    return unsubscribe;
  }, []);

  return flags;
}

export function useABTest(flagKey: string): string {
  const [variant, setVariant] = useState(() => featureFlagManager.getVariant(flagKey));

  useEffect(() => {
    const unsubscribe = featureFlagManager.subscribe(() => {
      setVariant(featureFlagManager.getVariant(flagKey));
    });

    return unsubscribe;
  }, [flagKey]);

  return variant;
}

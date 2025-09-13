import { useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp?: number;
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private userId?: string;

  setUserId(id: string) {
    this.userId = id;
  }

  trackEvent(event: AnalyticsEvent) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    });

    // In a real app, send to analytics service
    console.log('Analytics event:', event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getUserMetrics() {
    const events = this.events;
    return {
      totalEvents: events.length,
      categories: [...new Set(events.map(e => e.category))],
      sessionDuration: this.calculateSessionDuration(),
      featureUsage: this.calculateFeatureUsage(),
    };
  }

  private calculateSessionDuration(): number {
    if (this.events.length === 0) return 0;
    const firstEvent = Math.min(...this.events.map(e => (e as any).timestamp));
    const lastEvent = Math.max(...this.events.map(e => (e as any).timestamp));
    return lastEvent - firstEvent;
  }

  private calculateFeatureUsage() {
    const usage: Record<string, number> = {};
    this.events.forEach(event => {
      usage[event.category] = (usage[event.category] || 0) + 1;
    });
    return usage;
  }
}

export const analyticsTracker = new AnalyticsTracker();

export function useAnalytics() {
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analyticsTracker.trackEvent(event);
  }, []);

  const trackPageView = useCallback((page: string) => {
    trackEvent({
      category: 'navigation',
      action: 'page_view',
      label: page,
    });
  }, [trackEvent]);

  const trackUserAction = useCallback((action: string, label?: string, value?: number) => {
    trackEvent({
      category: 'user_action',
      action,
      label,
      value,
    });
  }, [trackEvent]);

  const trackError = useCallback((error: string, context?: string) => {
    trackEvent({
      category: 'error',
      action: 'occurred',
      label: `${context || 'unknown'}: ${error}`,
    });
  }, [trackEvent]);

  const trackPerformance = useCallback((metric: string, value: number) => {
    trackEvent({
      category: 'performance',
      action: 'metric',
      label: metric,
      value,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackError,
    trackPerformance,
  };
}

// Hook to track component interactions
export function useComponentAnalytics(componentName: string) {
  const { trackUserAction } = useAnalytics();

  const trackClick = useCallback((element: string) => {
    trackUserAction('click', `${componentName}:${element}`);
  }, [trackUserAction, componentName]);

  const trackView = useCallback(() => {
    trackUserAction('view', componentName);
  }, [trackUserAction, componentName]);

  useEffect(() => {
    trackView();
  }, [trackView]);

  return { trackClick, trackView };
}
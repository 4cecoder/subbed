import React from 'react';

// Performance monitoring utility
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  startTiming(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  endTiming(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.recordMetric(label, duration);
    this.startTimes.delete(label);
    return duration;
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(label)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getAverage(label: string): number {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) return 0;

    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  }

  getMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};

    for (const [label, measurements] of this.metrics.entries()) {
      result[label] = {
        average: this.getAverage(label),
        count: measurements.length,
        latest: measurements[measurements.length - 1] || 0,
      };
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  // Web Vitals tracking
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals
    if ('web-vitals' in window) {
      // This would require installing web-vitals package
      // For now, we'll use basic Performance API
    }

    // Track navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.recordMetric('navigation_time', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.recordMetric('first_paint', navigation.responseStart - navigation.fetchStart);
      }
    }
  }

  // Memory usage tracking
  getMemoryUsage(): { used: number; total: number; limit: number } | null {
    if (typeof window === 'undefined') return null;

    // @ts-expect-error - performance.memory is not in types but available in Chrome
    const memory = (performance as any).memory;
    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }

  // Bundle size estimation
  estimateBundleSize(): void {
    if (typeof window === 'undefined') return;

    // Get all script tags and estimate sizes
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      // This is a rough estimation - in practice you'd need to track actual sizes
      if (src.includes('.js')) {
        totalSize += 100000; // Rough estimate
      }
    });

    this.recordMetric('estimated_bundle_size', totalSize);
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Performance tracking hooks
export function usePerformanceTracking(label: string) {
  const start = () => performanceMonitor.startTiming(label);
  const end = () => performanceMonitor.endTiming(label);

  return { start, end };
}

// React component performance tracking hook
export function useComponentPerformanceTracking(componentName: string) {
  React.useEffect(() => {
    performanceMonitor.startTiming(`render_${componentName}`);

    return () => {
      performanceMonitor.endTiming(`render_${componentName}`);
    };
  }, [componentName]);
}

// API call performance tracking
export function trackApiCall<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  label: string
) {
  return async (...args: T): Promise<R> => {
    performanceMonitor.startTiming(`api_${label}`);
    try {
      const result = await fn(...args);
      performanceMonitor.endTiming(`api_${label}`);
      return result;
    } catch (error) {
      performanceMonitor.endTiming(`api_${label}`);
      throw error;
    }
  };
}
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface PerformanceMetrics {
  componentName: string;
  mountTime: number;
  renderCount: number;
  lastRenderDuration?: number;
}

/**
 * Hook to monitor component performance
 * Tracks mount time, render count, and render duration
 * 
 * @param componentName - Name of the component for logging
 * @param enabled - Whether to enable performance monitoring (default: __DEV__)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent');
 *   // ... rest of component
 * }
 * ```
 */
export function usePerformanceMonitor(
  componentName: string,
  enabled: boolean = __DEV__
) {
  const [metrics] = useState<PerformanceMetrics>(() => ({
    componentName,
    mountTime: 0,
    renderCount: 0,
  }));

  const renderStartTimeRef = useRef<number>(0);

  // Track mount time
  useEffect(() => {
    if (!enabled) return;

    const mountTime = Date.now();
    metrics.mountTime = mountTime;

    if (__DEV__) {
      console.log(`[Performance] ${componentName} mounted`);
    }

    return () => {
      const unmountTime = Date.now();
      const lifetime = unmountTime - mountTime;

      if (__DEV__) {
        console.log(
          `[Performance] ${componentName} unmounted after ${lifetime}ms (${metrics.renderCount} renders)`
        );
      }
    };
  }, [componentName, enabled, metrics]);

  // Track render count and duration
  useEffect(() => {
    if (!enabled) return;

    metrics.renderCount += 1;

    if (renderStartTimeRef.current > 0) {
      const renderDuration = Date.now() - renderStartTimeRef.current;
      metrics.lastRenderDuration = renderDuration;

      // Warn if render takes too long
      if (renderDuration > 16 && __DEV__) {
        console.warn(
          `[Performance] ${componentName} render #${metrics.renderCount} took ${renderDuration}ms (>16ms)`
        );
      }
    }
  });

  // Mark render start
  useEffect(() => {
    if (enabled) {
      renderStartTimeRef.current = Date.now();
    }
  });

  return metrics;
}

/**
 * Hook to measure async operation performance
 * 
 * @param operationName - Name of the operation for logging
 * @returns A function to track async operations
 * 
 * @example
 * ```tsx
 * const trackOperation = useAsyncPerformance('fetchData');
 * 
 * const fetchData = async () => {
 *   const endTracking = trackOperation();
 *   try {
 *     const data = await api.getData();
 *     endTracking('success');
 *     return data;
 *   } catch (error) {
 *     endTracking('error');
 *     throw error;
 *   }
 * };
 * ```
 */
export function useAsyncPerformance(operationName: string) {
  return () => {
    const startTime = Date.now();

    return (status: 'success' | 'error' = 'success') => {
      const duration = Date.now() - startTime;

      if (__DEV__) {
        console.log(
          `[Performance] ${operationName} ${status} in ${duration}ms`
        );
      }

      // Warn if operation takes too long
      if (duration > 1000 && __DEV__) {
        console.warn(
          `[Performance] ${operationName} took ${duration}ms (>1s)`
        );
      }

      return duration;
    };
  };
}

/**
 * Hook to detect and warn about unnecessary re-renders
 * Compares previous props/state to detect what changed
 * 
 * @param componentName - Name of the component
 * @param props - Props to monitor for changes
 * 
 * @example
 * ```tsx
 * function MyComponent({ user, items, onPress }) {
 *   useWhyDidYouUpdate('MyComponent', { user, items, onPress });
 *   // ...
 * }
 * ```
 */
export function useWhyDidYouUpdate(
  componentName: string,
  props: Record<string, any>
) {
  const previousPropsRef = useRef<Record<string, any> | undefined>(undefined);

  useEffect(() => {
    if (previousPropsRef.current && __DEV__) {
      const allKeys = Object.keys({ ...previousPropsRef.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousPropsRef.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousPropsRef.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${componentName}`, changedProps);
      }
    }

    previousPropsRef.current = props;
  });
}

/**
 * Hook to measure initial page load performance
 * Only runs once on mount
 * 
 * @param pageName - Name of the page/screen
 * 
 * @example
 * ```tsx
 * function HomeScreen() {
 *   usePageLoadPerformance('HomeScreen');
 *   // ...
 * }
 * ```
 */
export function usePageLoadPerformance(pageName: string) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Use Performance API on web
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as any;
        if (perfData && __DEV__) {
          console.log(`[Performance] ${pageName} load times:`, {
            dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
            tcp: Math.round(perfData.connectEnd - perfData.connectStart),
            request: Math.round(perfData.responseStart - perfData.requestStart),
            response: Math.round(perfData.responseEnd - perfData.responseStart),
            dom: Math.round(perfData.domContentLoadedEventEnd - perfData.responseEnd),
            total: Math.round(perfData.loadEventEnd - perfData.fetchStart),
          });
        }
      });
    } else {
      // Simple timing for native
      const mountTime = Date.now();
      setTimeout(() => {
        const loadTime = Date.now() - mountTime;
        if (__DEV__) {
          console.log(`[Performance] ${pageName} rendered in ${loadTime}ms`);
        }
      }, 0);
    }
  }, [pageName]);
}

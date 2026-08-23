import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface IntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

/**
 * Custom hook for intersection observer (web-only)
 * Detects when an element is visible in the viewport
 * 
 * @param options - Configuration options
 * @returns [ref, isVisible] - Ref to attach to element and visibility state
 * 
 * @example
 * ```tsx
 * function LazySection() {
 *   const [ref, isVisible] = useIntersectionObserver({ 
 *     threshold: 0.1,
 *     rootMargin: '200px',
 *     triggerOnce: true 
 *   });
 *   
 *   return (
 *     <div ref={ref}>
 *       {isVisible ? <HeavyContent /> : <Placeholder />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverOptions = {}
): [React.RefObject<T | null>, boolean] {
  const {
    threshold = 0.1,
    rootMargin = '200px', // Start loading 200px before entering viewport
    triggerOnce = true,
    enabled = Platform.OS === 'web',
  } = options;

  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(!enabled); // If not enabled (native), always visible

  useEffect(() => {
    // Only run on web
    if (!enabled || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting) {
          setIsVisible(true);
          
          // If triggerOnce, disconnect after first intersection
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}

/**
 * Hook for scroll-based lazy loading on React Native
 * Since native doesn't have IntersectionObserver, we use a simple timer-based approach
 * 
 * @param delay - Delay in ms before showing content (default: 100ms)
 * @returns boolean indicating if content should be shown
 */
export function useNativeLazyLoad(delay: number = 100): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isVisible;
}

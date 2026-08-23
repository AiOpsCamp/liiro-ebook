import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Debounced version of useWindowDimensions to prevent excessive re-renders
 * on window resize (especially important for web)
 * 
 * @param delay - Debounce delay in milliseconds (default: 150ms)
 * @returns Debounced window dimensions
 */
export function useDebouncedWindowDimensions(delay: number = 150) {
  const dimensions = useWindowDimensions();
  const [debouncedDimensions, setDebouncedDimensions] = useState(dimensions);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDimensions(dimensions);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [dimensions, delay]);

  return debouncedDimensions;
}

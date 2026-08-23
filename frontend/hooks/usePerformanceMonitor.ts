/**
 * usePerformanceMonitor.ts
 * ─────────────────────────────────────────────────────────
 * Monitor rendering performance for explore route
 * - Track render times
 * - FPS monitoring
 * - Memory usage
 */

import { useEffect, useRef, useCallback } from "react";

interface PerformanceMetrics {
  renderTime: number;
  fps: number;
  frameCount: number;
  memoryUsage: number;
}

export function usePerformanceMonitor(enabled: boolean = false) {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    frameCount: 0,
    memoryUsage: 0,
  });

  const startTimeRef = useRef<number>(0);

  const startMeasure = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endMeasure = useCallback(() => {
    if (startTimeRef.current > 0) {
      const renderTime = performance.now() - startTimeRef.current;
      metricsRef.current.renderTime = renderTime;

      if (enabled && renderTime > 50) {
        // Log slow renders (> 50ms)
        console.warn(`[Performance] Slow render detected: ${renderTime.toFixed(2)}ms`);
      }

      startTimeRef.current = 0;
    }
  }, [enabled]);

  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      fps: 60,
      frameCount: 0,
      memoryUsage: 0,
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Log metrics periodically
    const interval = setInterval(() => {
      const metrics = getMetrics();
      console.log("[Performance Metrics]", {
        renderTime: `${metrics.renderTime.toFixed(2)}ms`,
        fps: metrics.fps,
        frameCount: metrics.frameCount,
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [enabled, getMetrics]);

  return {
    startMeasure,
    endMeasure,
    getMetrics,
    resetMetrics,
  };
}

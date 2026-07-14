import { logger } from "./logger";

/**
 * Enterprise Performance Instrumentation Tracker.
 * Allows simple code tracing block measurements, outputting durations in milliseconds.
 */
export class PerformanceTracker {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  /**
   * Starts a new timer.
   */
  static start(name: string): PerformanceTracker {
    return new PerformanceTracker(name);
  }

  /**
   * Stops the timer and writes a performance log.
   * Returns the duration in milliseconds.
   */
  stop(context?: Record<string, unknown>): number {
    const duration = performance.now() - this.startTime;
    logger.info(`Performance: [${this.name}] took ${duration.toFixed(2)}ms`, {
      metricName: this.name,
      durationMs: duration,
      ...context,
    });
    return duration;
  }
}

/**
 * Decorator pattern or wrapper helper to measure execution time of functions.
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T,
  context?: Record<string, unknown>
): Promise<T> {
  const tracker = PerformanceTracker.start(name);
  try {
    return await fn();
  } finally {
    tracker.stop(context);
  }
}

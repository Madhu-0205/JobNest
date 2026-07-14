import { logger } from "./logger";

/**
 * Enterprise Metrics Logging Abstraction.
 * Captures numeric values, operational statuses, and semantic tags,
 * structured for later integration with Prometheus, Datadog, or AWS CloudWatch.
 */
export class Metrics {
  /**
   * Increments a count metric.
   */
  static counter(name: string, value = 1, tags?: Record<string, string>): void {
    logger.info(`Metric [Counter] [${name}] incremented by ${value}`, {
      metric: {
        name,
        type: "counter",
        value,
        tags,
      },
    });
  }

  /**
   * Sets a gauge metric value.
   */
  static gauge(name: string, value: number, tags?: Record<string, string>): void {
    logger.info(`Metric [Gauge] [${name}] set to ${value}`, {
      metric: {
        name,
        type: "gauge",
        value,
        tags,
      },
    });
  }

  /**
   * Records a duration metric value.
   */
  static histogram(name: string, value: number, tags?: Record<string, string>): void {
    logger.info(`Metric [Histogram] [${name}] recorded value ${value}`, {
      metric: {
        name,
        type: "histogram",
        value,
        tags,
      },
    });
  }
}

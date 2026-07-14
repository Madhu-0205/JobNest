import { logger } from "./logger";
import { PerformanceTracker } from "./performance";

/**
 * Enterprise Request Logging Utility.
 * Wraps service executions and logs trace state, execution results, and durations.
 */
export async function logRequestLifecycle<T>(
  operationName: string,
  fn: () => Promise<T> | T,
  context?: Record<string, unknown>
): Promise<T> {
  const tracker = PerformanceTracker.start(operationName);
  logger.info(`Operation [START]: ${operationName}`, context);
  
  try {
    const result = await fn();
    logger.info(`Operation [SUCCESS]: ${operationName}`, context);
    return result;
  } catch (error) {
    logger.error(`Operation [FAILURE]: ${operationName}`, error, context);
    throw error;
  } finally {
    tracker.stop(context);
  }
}

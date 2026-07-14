import { runInMockContext } from "../mocks/infra.mock";
import { RequestContext } from "@/lib/observability/request-context";
import { Result } from "@/lib/api/result";

/**
 * Validates request context propagation inside the mock container.
 */
export function verifyRequestContextPropagation(): boolean {
  return runInMockContext(() => {
    const reqId = RequestContext.requestId;
    const corrId = RequestContext.correlationId;

    if (reqId !== "mock-request-id-123") {
      throw new Error(`Context failure: expected 'mock-request-id-123' but got '${reqId}'`);
    }

    if (corrId !== "mock-correlation-id-456") {
      throw new Error(`Context failure: expected 'mock-correlation-id-456' but got '${corrId}'`);
    }

    return true;
  });
}

/**
 * Validates that the Result monad wraps success values correctly.
 */
export function verifyResultMonadSuccess(): boolean {
  const payload = "operation-payload-value";
  const result = Result.ok<string>(payload);

  if (result.isFailure) {
    throw new Error("Result monad: expected success status to be true.");
  }

  if (result.unwrap() !== payload) {
    throw new Error(`Result unwrap value mismatch: expected '${payload}'`);
  }

  return true;
}

/**
 * Validates that the Result monad wraps errors correctly.
 */
export function verifyResultMonadFailure(): boolean {
  const rawError = new Error("Mock operation database failure");
  const result = Result.fail<string, Error>(rawError);

  if (result.isSuccess) {
    throw new Error("Result monad: expected success status to be false.");
  }

  if (result.error() !== rawError) {
    throw new Error("Result error mismatch: reference object does not match.");
  }

  return true;
}

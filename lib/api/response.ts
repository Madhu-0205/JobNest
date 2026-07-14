import { NextResponse } from "next/server";

export interface ApiResponsePayload<T> {
  success: boolean;
  timestamp: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    nextCursor?: string | null;
  };
}

/**
 * Enterprise API Response Formatter.
 * Enforces unified contract structures for all JSON REST endpoints.
 * Supports standard envelopes and RFC 7807 Problem Details for errors.
 */
export class ApiResponse {
  /**
   * Formats a successful API response envelope.
   */
  static success<T>(
    data: T,
    meta?: ApiResponsePayload<T>["meta"],
    status = 200
  ): NextResponse<ApiResponsePayload<T>> {
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        data,
        meta,
      },
      { status }
    );
  }

  /**
   * Formats a standardized error envelope.
   */
  static error(
    message: string,
    code = "BAD_REQUEST",
    details?: unknown,
    status = 400
  ): NextResponse<ApiResponsePayload<never>> {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          code,
          message,
          details,
        },
      },
      { status }
    );
  }

  /**
   * RFC 7807 Compliant Problem Details formatter.
   * Used for returning machine-readable, structured security and service errors.
   */
  static problem(
    title: string,
    detail: string,
    status: number,
    instance?: string,
    extensions?: Record<string, unknown>
  ): NextResponse {
    const payload = {
      type: `https://jobnest.dev/errors/http-${status}`,
      title,
      status,
      detail,
      instance,
      timestamp: new Date().toISOString(),
      ...extensions,
    };

    return new NextResponse(JSON.stringify(payload), {
      status,
      headers: {
        "Content-Type": "application/problem+json",
      },
    });
  }
}

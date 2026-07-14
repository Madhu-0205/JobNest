import { logger } from "@/services/logger";
import { AppError } from "../errors";
import { Tracing } from "../observability/tracing";

export interface HttpRequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
}

export type RequestInterceptor = (config: HttpRequestConfig) => Promise<HttpRequestConfig> | HttpRequestConfig;
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

/**
 * Enterprise HTTP Client.
 * Abstracts standard native fetch requests, implementing:
 * - Dynamic timeout controls
 * - Request cancellation (AbortController)
 * - Exponential backoff retries
 * - Request/Response interceptors
 * - Trace propagation headers integration
 */
export class HttpClient {
  private baseURL: string;
  private defaultTimeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL = "", defaultTimeout = 10000) {
    this.baseURL = baseURL;
    this.defaultTimeout = defaultTimeout;
    
    // Auto-inject Tracecontext headers as default interceptor
    this.useRequestInterceptor((config) => {
      const traceHeaders = Tracing.getTraceHeaders();
      return {
        ...config,
        headers: {
          ...config.headers,
          ...traceHeaders,
        },
      };
    });
  }

  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request(path: string, config: HttpRequestConfig = {}): Promise<Response> {
    let requestConfig: HttpRequestConfig = {
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    // Apply request interceptors sequentially
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    const url = this.baseURL ? `${this.baseURL}${path}` : path;
    const timeout = requestConfig.timeout ?? this.defaultTimeout;
    const retries = requestConfig.retries ?? 0;
    const retryDelay = requestConfig.retryDelayMs ?? 1000;

    let attempt = 0;

    while (attempt <= retries) {
      const controller = new AbortController();
      const signal = controller.signal;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        logger.debug(`HTTP Request: [${requestConfig.method || "GET"}] ${url} (Attempt ${attempt + 1}/${retries + 1})`);

        const response = await fetch(url, {
          ...requestConfig,
          signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Retry on server failures (5xx status codes)
          if (response.status >= 500 && attempt < retries) {
            attempt++;
            await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }
          throw new AppError(`HTTP request failed with status ${response.status}`, response.status, "HTTP_ERROR");
        }

        // Apply response interceptors sequentially
        let interceptedResponse = response;
        for (const interceptor of this.responseInterceptors) {
          interceptedResponse = await interceptor(interceptedResponse);
        }

        return interceptedResponse;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          logger.warn(`HTTP Timeout: Request to ${url} timed out after ${timeout}ms`);
          if (attempt < retries) {
            attempt++;
            await this.sleep(retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw new AppError(`HTTP request timed out after ${timeout}ms`, 408, "TIMEOUT_ERROR");
        }

        if (attempt < retries) {
          attempt++;
          await this.sleep(retryDelay * Math.pow(2, attempt));
          continue;
        }

        throw error;
      }
    }

    throw new AppError("HTTP request failed after maximum retries", 500, "HTTP_RETRY_ERROR");
  }

  async get(path: string, config?: HttpRequestConfig): Promise<Response> {
    return this.request(path, { ...config, method: "GET" });
  }

  async post(path: string, data: unknown, config?: HttpRequestConfig): Promise<Response> {
    return this.request(path, { ...config, method: "POST", body: JSON.stringify(data) });
  }

  async put(path: string, data: unknown, config?: HttpRequestConfig): Promise<Response> {
    return this.request(path, { ...config, method: "PUT", body: JSON.stringify(data) });
  }

  async patch(path: string, data: unknown, config?: HttpRequestConfig): Promise<Response> {
    return this.request(path, { ...config, method: "PATCH", body: JSON.stringify(data) });
  }

  async delete(path: string, config?: HttpRequestConfig): Promise<Response> {
    return this.request(path, { ...config, method: "DELETE" });
  }
}

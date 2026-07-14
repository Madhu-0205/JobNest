import { headers } from "next/headers";
import { RequestContext, RequestStore } from "./request-context";

/**
 * Bootstraps the RequestContext for Server Actions and API endpoints.
 * Extracts Correlation and Request IDs from incoming headers.
 */
export async function runWithRequestContext<T>(callback: () => Promise<T> | T): Promise<T> {
  const headerList = await headers();
  
  const correlationId = headerList.get("x-correlation-id") || crypto.randomUUID();
  const requestId = headerList.get("x-request-id") || crypto.randomUUID();
  const clientIp = headerList.get("x-forwarded-for")?.split(",")[0] || undefined;
  const userAgent = headerList.get("user-agent") || undefined;
  const locale = headerList.get("accept-language")?.split(",")[0] || undefined;

  const store: RequestStore = {
    requestId,
    correlationId,
    timestamp: Date.now(),
    clientIp,
    userAgent,
    locale,
  };

  return RequestContext.run(store, callback);
}

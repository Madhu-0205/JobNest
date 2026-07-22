/**
 * Centralized Domain Audit Logger.
 *
 * Provides typed, structured security, payment, AI, and administrative audit logging.
 * Automatically injects correlation_id and request_id from RequestContext.
 */

import { logger } from "@/lib/observability/logger";
import { RequestContext } from "@/lib/observability/request-context";

export type AuditDomain = "auth" | "payment" | "ai" | "admin" | "security";

export interface AuditEventOptions {
  domain: AuditDomain;
  action: string;
  actorId?: string;
  targetId?: string;
  status: "success" | "failure" | "warning";
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  /**
   * Records a domain audit event with correlation metadata.
   */
  static async logEvent(options: AuditEventOptions): Promise<void> {
    const ctx = RequestContext.getStore();
    const payload = {
      domain: options.domain,
      action: options.action,
      actor_id: options.actorId ?? ctx?.userId ?? "system",
      target_id: options.targetId,
      status: options.status,
      correlation_id: ctx?.correlationId,
      request_id: ctx?.requestId,
      client_ip: ctx?.clientIp,
      timestamp: new Date().toISOString(),
      metadata: options.metadata ?? {},
    };

    const message = `[AUDIT:${options.domain.toUpperCase()}] ${options.action} (${options.status})`;

    if (options.status === "failure") {
      logger.error(message, undefined, payload);
    } else if (options.status === "warning") {
      logger.warn(message, payload);
    } else {
      logger.info(message, payload);
    }
  }

  static async logSecurity(action: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.logEvent({ domain: "security", action, status: "warning", metadata });
  }

  static async logPayment(action: string, status: "success" | "failure", metadata?: Record<string, unknown>): Promise<void> {
    return this.logEvent({ domain: "payment", action, status, metadata });
  }

  static async logAI(action: string, status: "success" | "failure", metadata?: Record<string, unknown>): Promise<void> {
    return this.logEvent({ domain: "ai", action, status, metadata });
  }

  static async logAdmin(action: string, actorId: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.logEvent({ domain: "admin", action, actorId, status: "success", metadata });
  }
}

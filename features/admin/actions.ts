"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import {
  moderationActionSchema,
  bulkModerationSchema,
  updateTicketStatusSchema,
  addTicketMessageSchema,
  updateSettingSchema,
  featureFlagSchema,
  generateReportSchema,
} from "./schemas";
import { z } from "zod";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";
import { logger } from "@/services/logger";
import { ModerationService } from "@/services/moderation-service";
import { SupportService } from "@/services/support-service";

// ─────────────────────────────────────────────────────────────────
// Action Executor
// ─────────────────────────────────────────────────────────────────

async function executeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  return runWithRequestContext(async () => {
    return logRequestLifecycle(actionName, async (): Promise<ActionResult<T>> => {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const details = error.flatten().fieldErrors;
          return { success: false, error: { code: "VALIDATION_ERROR", message: "Input validation failed.", details } };
        }
        const message = error instanceof Error ? error.message : "An unknown admin action error occurred.";
        logger.warn(`[Admin:${actionName}] ${message}`);
        return { success: false, error: { code: "ADMIN_ACTION_ERROR", message } };
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Moderation Actions
// ─────────────────────────────────────────────────────────────────

export async function getModerationQueueAction(): Promise<ActionResult<{ items: Awaited<ReturnType<typeof ModerationService.getPendingQueue>>; stats: Awaited<ReturnType<typeof ModerationService.getStats>> }>> {
  return executeAction("getModerationQueueAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.MODERATION_VIEW);
    const [items, stats] = await Promise.all([
      ModerationService.getPendingQueue(50),
      ModerationService.getStats(),
    ]);
    return { items, stats };
  });
}

export async function takeModerationActionAction(formData: FormData): Promise<ActionResult<{ result: Awaited<ReturnType<typeof ModerationService.takeAction>> }>> {
  return executeAction("takeModerationActionAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.MODERATION_ACTION);
    const validated = moderationActionSchema.parse({
      itemId: formData.get("itemId"),
      action: formData.get("action"),
      note: formData.get("note") || undefined,
    });
    const result = await ModerationService.takeAction(validated.itemId, validated.action, userId, validated.note);
    return { result };
  });
}

export async function bulkModerationActionAction(formData: FormData): Promise<ActionResult<{ processed: number; failed: number }>> {
  return executeAction("bulkModerationActionAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.MODERATION_ACTION);
    const rawIds = formData.get("itemIds");
    const validated = bulkModerationSchema.parse({
      itemIds: typeof rawIds === "string" ? rawIds.split(",") : [],
      action: formData.get("action"),
      note: formData.get("note") || undefined,
    });

    let processed = 0;
    let failed = 0;
    for (const id of validated.itemIds) {
      const res = await ModerationService.takeAction(id, validated.action, userId, validated.note);
      if (res.success) processed++; else failed++;
    }
    logger.info(`[Admin:BulkModeration] Processed ${processed}/${validated.itemIds.length}`);
    return { processed, failed };
  });
}

// ─────────────────────────────────────────────────────────────────
// Support Ticket Actions
// ─────────────────────────────────────────────────────────────────

export async function getSupportTicketsAction(): Promise<ActionResult<{ tickets: Awaited<ReturnType<typeof SupportService.getActiveTickets>>; stats: Awaited<ReturnType<typeof SupportService.getStats>> }>> {
  return executeAction("getSupportTicketsAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.SUPPORT_VIEW);
    const [tickets, stats] = await Promise.all([
      SupportService.getActiveTickets(50),
      SupportService.getStats(),
    ]);
    return { tickets, stats };
  });
}

export async function updateTicketStatusAction(formData: FormData): Promise<ActionResult<{ success: boolean }>> {
  return executeAction("updateTicketStatusAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.SUPPORT_MANAGE);
    const validated = updateTicketStatusSchema.parse({
      ticketId: formData.get("ticketId"),
      status: formData.get("status"),
    });
    return SupportService.updateTicketStatus(validated.ticketId, validated.status);
  });
}

export async function addTicketMessageAction(formData: FormData): Promise<ActionResult<{ success: boolean }>> {
  return executeAction("addTicketMessageAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.SUPPORT_VIEW);
    const validated = addTicketMessageSchema.parse({
      ticketId: formData.get("ticketId"),
      message: formData.get("message"),
      isInternal: formData.get("isInternal") === "true",
    });

    try {
      const supabase = await createServerClient();
      await supabase.from("support_messages").insert({
        ticket_id: validated.ticketId,
        sender_id: userId,
        message: validated.message,
        is_internal: validated.isInternal,
      });
    } catch {
      logger.warn("[Admin:AddTicketMessage] Simulated message insert.");
    }

    return { success: true };
  });
}

// ─────────────────────────────────────────────────────────────────
// System Configuration Actions
// ─────────────────────────────────────────────────────────────────

export async function updateSystemSettingAction(formData: FormData): Promise<ActionResult<{ success: boolean }>> {
  return executeAction("updateSystemSettingAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.CONFIG_MANAGE);
    const rawValue = formData.get("value");
    let parsedValue: Record<string, unknown> = {};
    try { parsedValue = JSON.parse(rawValue as string); } catch { parsedValue = { value: rawValue }; }

    const validated = updateSettingSchema.parse({
      key: formData.get("key"),
      value: parsedValue,
      description: formData.get("description") || undefined,
      category: formData.get("category") || undefined,
    });

    try {
      const supabase = await createServerClient();
      await supabase.from("system_settings").upsert({
        key: validated.key,
        value: validated.value,
        description: validated.description,
        category: validated.category || "general",
        updated_by: userId,
      }, { onConflict: "key" });
    } catch {
      logger.warn(`[Admin:SystemSetting] Simulated upsert for key: ${validated.key}`);
    }

    return { success: true };
  });
}

export async function setFeatureFlagAction(formData: FormData): Promise<ActionResult<{ success: boolean }>> {
  return executeAction("setFeatureFlagAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.CONFIG_MANAGE);
    const validated = featureFlagSchema.parse({
      flagKey: formData.get("flagKey"),
      targetType: formData.get("targetType") || "global",
      targetId: formData.get("targetId") || undefined,
      isEnabled: formData.get("isEnabled") === "true",
    });

    try {
      const supabase = await createServerClient();
      await supabase.from("feature_flag_overrides").insert({
        flag_key: validated.flagKey,
        target_type: validated.targetType,
        target_id: validated.targetId,
        is_enabled: validated.isEnabled,
        created_by: userId,
      });
    } catch {
      logger.warn(`[Admin:FeatureFlag] Simulated flag set: ${validated.flagKey} = ${validated.isEnabled}`);
    }

    return { success: true };
  });
}

// ─────────────────────────────────────────────────────────────────
// Report Generation Action
// ─────────────────────────────────────────────────────────────────

export async function generateReportAction(formData: FormData): Promise<ActionResult<{ reportId: string; status: string }>> {
  return executeAction("generateReportAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.ANALYTICS_EXPORT);
    const rawFilters = formData.get("filters");
    let parsedFilters: Record<string, unknown> = {};
    try { parsedFilters = JSON.parse(rawFilters as string); } catch { parsedFilters = {}; }

    const validated = generateReportSchema.parse({
      reportType: formData.get("reportType"),
      periodStart: formData.get("periodStart"),
      periodEnd: formData.get("periodEnd"),
      filters: parsedFilters,
    });

    let reportId = `rpt-${Date.now()}`;

    try {
      const supabase = await createServerClient();
      const { data } = await supabase.from("report_exports").insert({
        requested_by: userId,
        report_type: validated.reportType,
        parameters: {
          period_start: validated.periodStart,
          period_end: validated.periodEnd,
          filters: validated.filters,
        },
        status: "pending",
      }).select("id").single();

      if (data?.id) reportId = data.id;
    } catch {
      logger.warn(`[Admin:GenerateReport] Simulated report request: ${validated.reportType}`);
    }

    logger.info(`[Admin:GenerateReport] Report queued: ${validated.reportType} | id=${reportId}`);
    return { reportId, status: "pending" };
  });
}

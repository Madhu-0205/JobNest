"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import {
  paymentIntentSchema,
  payoutRequestSchema,
  couponApplySchema
} from "./schemas";
import { z } from "zod";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";
import { logger } from "@/services/logger";
import { PaymentGatewayService } from "@/services/payment-gateway-service";
import { WalletEngine } from "@/services/wallet-engine";
import { EscrowEngine } from "@/services/escrow-engine";

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
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Input validation failed.",
              details,
            },
          };
        }

        return {
          success: false,
          error: {
            code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
            message: error instanceof Error ? error.message : "An unexpected failure occurred.",
          },
        };
      }
    });
  });
}

/**
 * Server Action: Creates a gateway payment order (Razorpay / Stripe) and registers payment.
 */
export async function initiatePaymentAction(formData: unknown): Promise<ActionResult<{ orderId: string; amount: number; paymentId: string }>> {
  return executeAction("initiatePaymentAction", async () => {
    const validated = paymentIntentSchema.parse(formData);
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);

    const { success } = await rateLimiter.check("paymentCreation", userId);
    if (!success) throw new Error("Too Many Requests. Payment initiation limit exceeded.");

    const supabase = await createServerClient();

    try {
      // 1. Check idempotency first to avoid duplicate intents
      const { data: existing } = await supabase
        .from("payments")
        .select("*")
        .eq("idempotency_key", validated.idempotencyKey)
        .maybeSingle();

      if (existing) {
        return {
          orderId: existing.gateway_order_id || "",
          amount: Number(existing.amount),
          paymentId: existing.id,
        };
      }

      // 2. Call gateway creation API adapter.
      // Thread escrow/opportunity context into Razorpay order notes so the
      // webhook handler can auto-fund the escrow after capture.
      const orderNotes: Record<string, string> = {};
      if (validated.escrowId) orderNotes["escrow_id"] = validated.escrowId;
      if (validated.opportunityId) orderNotes["opportunity_id"] = validated.opportunityId;

      const adapter = PaymentGatewayService.getAdapter(validated.gateway);
      const order = await adapter.createOrder(validated.amount, validated.currency, orderNotes);

      // 3. Log to payments table
      const { data: payment, error } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          amount: validated.amount,
          currency: validated.currency,
          gateway: validated.gateway,
          gateway_order_id: order.orderId,
          status: "pending",
          idempotency_key: validated.idempotencyKey,
        })
        .select("id")
        .single();

      if (error || !payment) throw error || new Error("Order tracking register failed.");

      return {
        orderId: order.orderId,
        amount: validated.amount,
        paymentId: payment.id,
      };
    } catch (error) {
      logger.error("Payment initiation failed:", error as Record<string, unknown>);
      throw error;
    }
  });
}

/**
 * Server Action: Requests withdrawal payouts of worker balances.
 */
export async function requestPayoutAction(formData: unknown): Promise<ActionResult<{ payoutId: string; remainingBalance: number }>> {
  return executeAction("requestPayoutAction", async () => {
    const validated = payoutRequestSchema.parse(formData);
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

    try {
      // 1. Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!wallet || Number(wallet.balance) < validated.amount) {
        throw new Error("Insufficient wallet balance for this payout request.");
      }

      // 2. Create payout record
      const { data: payout, error } = await supabase
        .from("payouts")
        .insert({
          user_id: userId,
          amount: validated.amount,
          method: validated.method,
          destination: validated.destination,
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !payout) throw error || new Error("Failed to insert payout request.");

      // 3. Debit user wallet
      const debResult = await WalletEngine.debit(
        userId,
        validated.amount,
        "payout",
        payout.id,
        `Payout demand to ${validated.method} (${validated.destination})`
      );

      return {
        payoutId: payout.id,
        remainingBalance: debResult.newBalance,
      };
    } catch (error) {
      logger.error("Payout request failed:", error as Record<string, unknown>);
      throw error;
    }
  });
}

/**
 * Server Action: Handles Payer/Mediator Escrow funds release updates.
 */
export async function manageEscrowReleaseAction(
  escrowId: string,
  amount: number,
  releaseType: "partial" | "full"
): Promise<ActionResult<{ success: boolean; netReleased: number; commission: number }>> {
  return executeAction("manageEscrowReleaseAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

    try {
      // Assert role or ownership
      const { data: escrow } = await supabase
        .from("escrows")
        .select("payer_id, payee_id")
        .eq("id", escrowId)
        .single();

      const isPayer = escrow?.payer_id === userId;
      let isMod = false;
      try {
        await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VERIFY);
        isMod = true;
      } catch {
        isMod = false;
      }

      if (!isPayer && !isMod) {
        throw new Error("Unauthorized to command escrow releases.");
      }

      logger.info(`Processing escrow release type: ${releaseType}`);
      const releaseResult = await EscrowEngine.release(escrowId, amount);
      return {
        success: releaseResult.success,
        netReleased: releaseResult.released,
        commission: releaseResult.commission,
      };
    } catch (error) {
      logger.error("Escrow release management failed:", error as Record<string, unknown>);
      throw error;
    }
  });
}

/**
 * Server Action: Applies promotional coupons and calculates offsets.
 */
export async function applyCouponAction(formData: unknown): Promise<ActionResult<{ discountValue: number; newAmount: number }>> {
  return executeAction("applyCouponAction", async () => {
    const validated = couponApplySchema.parse(formData);
    await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

    try {
      // Find coupon
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", validated.code)
        .eq("active", true)
        .single();

      if (error || !coupon) throw new Error("Coupon code is invalid or expired.");

      // Check date validity
      const now = new Date();
      if (new Date(coupon.starts_at) > now || new Date(coupon.expires_at) < now) {
        throw new Error("Coupon validity range has expired.");
      }

      // Compute real discount against the provided amount.
      // If no amount was supplied in the payload, use coupon's min_spend as baseline.
      const baseAmount = (validated as { amount?: number }).amount ?? Number(coupon.min_spend);
      const isPercent = coupon.discount_type === "percentage";

      let discountValue: number;
      if (isPercent) {
        discountValue = baseAmount * (Number(coupon.value) / 100);
        // Cap if coupon has a max_discount ceiling
        if (coupon.max_discount !== null) {
          discountValue = Math.min(discountValue, Number(coupon.max_discount));
        }
      } else {
        discountValue = Number(coupon.value);
      }

      const newAmount = Math.max(0, baseAmount - discountValue);

      return {
        discountValue,
        newAmount,
      };
    } catch (error) {
      logger.error("Apply coupon failed:", error as Record<string, unknown>);
      throw error;
    }
  });
}

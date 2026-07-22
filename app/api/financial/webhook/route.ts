import { NextRequest, NextResponse } from "next/server";
import { RazorpayAdapter } from "@/services/payment-gateway-service";
import { WalletEngine } from "@/services/wallet-engine";
import { EscrowEngine } from "@/services/escrow-engine";
import { LedgerService } from "@/services/ledger-service";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;        // in paisa
  currency: string;
  status: string;
  error_code?: string;
  error_description?: string;
  notes?: Record<string, string>;
}

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
  };
}

// ─── Webhook Handler ───────────────────────────────────────────────────────────

/**
 * POST /api/financial/webhook
 *
 * Receives Razorpay webhook events and:
 *   1. Verifies the HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
 *   2. Guards against duplicate deliveries (idempotent by gateway_payment_id).
 *   3. On payment.captured → credits user wallet + optionally funds escrow.
 *   4. On payment.failed   → marks payment as failed in the DB.
 *   5. Returns HTTP 200 for all other events (Razorpay retries on non-2xx).
 */
export async function POST(req: NextRequest) {
  // ── 1. Read raw body (must be done before any json() call) ──────────────────
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  // ── 2. Resolve webhook secret ────────────────────────────────────────────────
  const webhookSecret = process.env["RAZORPAY_WEBHOOK_SECRET"];

  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      logger.error(
        "[PaymentWebhook] RAZORPAY_WEBHOOK_SECRET is not set. Rejecting all webhook requests in production."
      );
      return NextResponse.json(
        { success: false, error: "Webhook configuration error." },
        { status: 500 }
      );
    }
    // In development, allow testing without the secret but log a loud warning.
    logger.warn(
      "[PaymentWebhook] RAZORPAY_WEBHOOK_SECRET is not set. Signature verification is DISABLED for this request. Set the variable before going to production."
    );
  }

  // ── 3. Signature verification ────────────────────────────────────────────────
  if (webhookSecret) {
    const adapter = new RazorpayAdapter();
    const isValid = adapter.verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      logger.warn(
        "[PaymentWebhook] Rejected webhook — HMAC signature mismatch.",
        { signatureReceived: signature.slice(0, 8) + "…" }
      );
      return NextResponse.json(
        { success: false, error: "Invalid signature." },
        { status: 401 }
      );
    }
  }

  // ── 4. Parse payload ─────────────────────────────────────────────────────────
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Malformed JSON payload." },
      { status: 400 }
    );
  }

  const eventType = payload.event;
  logger.info(`[PaymentWebhook] Received event: ${eventType}`);

  const supabase = await createServerClient();

  // ── 5. Route event ───────────────────────────────────────────────────────────
  try {
    if (eventType === "payment.captured") {
      await handlePaymentCaptured(supabase, payload.payload.payment.entity);
    } else if (eventType === "payment.failed") {
      await handlePaymentFailed(supabase, payload.payload.payment.entity);
    } else {
      // Acknowledge all other events without processing
      logger.info(`[PaymentWebhook] Event ${eventType} acknowledged (no action required).`);
    }
  } catch (err) {
    // Return 500 so Razorpay retries the delivery
    logger.error(
      `[PaymentWebhook] Processing error for ${eventType}: ${err instanceof Error ? err.message : String(err)}`
    );
    return NextResponse.json(
      { success: false, error: "Event processing failed — will retry." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Handles payment.captured events.
 *
 * Idempotency: checks whether this gateway_payment_id has already been
 * processed. If the payment row is already `captured`, returns early — this
 * is the safe path when Razorpay retries a delivery.
 *
 * Flow:
 *   a. Idempotency guard
 *   b. Mark payment as captured in DB
 *   c. Credit user wallet (via atomic RPC)
 *   d. Write payment ledger entry
 *   e. Auto-fund escrow if escrow_id present in order notes
 */
async function handlePaymentCaptured(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  paymentEntity: RazorpayPaymentEntity
): Promise<void> {
  const gatewayPaymentId = paymentEntity.id;
  const gatewayOrderId = paymentEntity.order_id;
  const amountInRupees = paymentEntity.amount / 100; // convert paise → rupees

  // ── a. Idempotency guard ─────────────────────────────────────────────────────
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, user_id, status")
    .eq("gateway_payment_id", gatewayPaymentId)
    .maybeSingle();

  if (existingPayment?.status === "captured") {
    logger.info(
      `[PaymentWebhook] Duplicate delivery detected for payment ${gatewayPaymentId}. ` +
        "Payment already captured — skipping to ensure idempotency."
    );
    return; // safe no-op
  }

  // ── b. Mark payment captured ──────────────────────────────────────────────────
  const { data: payment, error: updateError } = await supabase
    .from("payments")
    .update({
      status: "captured",
      gateway_payment_id: gatewayPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("gateway_order_id", gatewayOrderId)
    .select("id, user_id")
    .maybeSingle();

  if (updateError || !payment) {
    // Payment row not found — could be a webhook arriving before the order was persisted.
    // Return an error so Razorpay retries delivery.
    throw new Error(
      `Payment row for order ${gatewayOrderId} not found or update failed. ` +
        (updateError?.message ?? "")
    );
  }

  // ── c. Credit user wallet ─────────────────────────────────────────────────────
  await WalletEngine.credit(
    payment.user_id,
    amountInRupees,
    "payment",
    payment.id,
    `Deposit loaded via Razorpay — Payment Ref: ${gatewayPaymentId}`
  );

  // ── d. Record payment ledger entry ────────────────────────────────────────────
  await LedgerService.recordDoubleEntry(
    payment.id,
    { accountId: null, amount: amountInRupees, referenceType: "payment" },   // Debit Platform (cash in)
    { accountId: payment.user_id, amount: amountInRupees, referenceType: "payment" } // Credit User
  );

  logger.info(
    `[PaymentWebhook] payment.captured processed — ` +
      `user=${payment.user_id}, amount=₹${amountInRupees}, razorpay_id=${gatewayPaymentId}`
  );

  // ── e. Auto-fund escrow if applicable ─────────────────────────────────────────
  const escrowId = paymentEntity.notes?.["escrow_id"];
  if (escrowId) {
    const funded = await EscrowEngine.fundFromWallet(escrowId);
    if (funded) {
      logger.info(
        `[PaymentWebhook] Escrow ${escrowId} auto-funded after payment capture.`
      );
    } else {
      logger.warn(
        `[PaymentWebhook] Escrow ${escrowId} could not be funded — ` +
          "it may be in an incompatible state or the payer has insufficient balance."
      );
    }
  }
}

/**
 * Handles payment.failed events.
 *
 * Marks the payment row as failed and writes a ledger audit entry.
 * No wallet balance changes occur.
 */
async function handlePaymentFailed(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  paymentEntity: RazorpayPaymentEntity
): Promise<void> {
  const gatewayOrderId = paymentEntity.order_id;
  const gatewayPaymentId = paymentEntity.id;

  const { data: payment, error: updateError } = await supabase
    .from("payments")
    .update({
      status: "failed",
      gateway_payment_id: gatewayPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("gateway_order_id", gatewayOrderId)
    .select("id, user_id, amount")
    .maybeSingle();

  if (updateError) {
    throw new Error(
      `Failed to mark payment ${gatewayOrderId} as failed: ${updateError.message}`
    );
  }

  if (!payment) {
    // Row may not exist yet — log and return; Razorpay won't retry payment.failed events
    logger.warn(
      `[PaymentWebhook] payment.failed received for unknown order ${gatewayOrderId}. ` +
        "No payment row to update."
    );
    return;
  }

  // Write audit ledger entry so the failure is traceable
  await LedgerService.recordDoubleEntry(
    payment.id,
    { accountId: payment.user_id, amount: Number(payment.amount), referenceType: "payment" },
    { accountId: null,            amount: Number(payment.amount), referenceType: "payment" }
  );

  logger.info(
    `[PaymentWebhook] payment.failed recorded — ` +
      `order=${gatewayOrderId}, razorpay_id=${gatewayPaymentId}, ` +
      `error=${paymentEntity.error_code ?? "unknown"}: ${paymentEntity.error_description ?? ""}`
  );
}

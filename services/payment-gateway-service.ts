import { logger } from "@/services/logger";
import crypto from "crypto";
import Razorpay from "razorpay";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GatewayOrderDetails {
  orderId: string;
  amount: number;
  currency: string;
  gateway: "razorpay" | "stripe";
}

export interface PaymentGatewayAdapter {
  createOrder(
    amount: number,
    currency: string,
    notes?: Record<string, string>
  ): Promise<GatewayOrderDetails>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
  refundPayment(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; gatewayRefundId: string }>;
}

// ─── Razorpay Adapter ─────────────────────────────────────────────────────────

/**
 * Production Razorpay Integration Adapter.
 *
 * Uses the official `razorpay` Node SDK for:
 *   - Orders creation  (POST /v1/orders)
 *   - Payment refunds  (POST /v1/payments/:id/refund)
 *   - Webhook HMAC-SHA256 signature verification
 *
 * SDK is instantiated lazily — the adapter can be imported in test
 * environments without crashing when keys are absent. Calls will
 * throw at runtime if credentials are missing (intentional).
 */
export class RazorpayAdapter implements PaymentGatewayAdapter {
  private get client(): Razorpay {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];

    if (!keyId || !keySecret) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to use the Razorpay adapter."
      );
    }

    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  /**
   * Creates a Razorpay Order via the Orders API.
   * Amount is expected in the major currency unit (INR rupees).
   * Razorpay requires the amount in paisa (×100).
   *
   * @param notes  Optional key-value map threaded through the order
   *               (e.g. { escrow_id: "...", opportunity_id: "..." }).
   *               Razorpay passes these back in webhook payloads.
   */
  async createOrder(
    amount: number,
    currency = "INR",
    notes: Record<string, string> = {}
  ): Promise<GatewayOrderDetails> {
    const amountInPaise = Math.round(amount * 100);

    const order = await this.client.orders.create({
      amount: amountInPaise,
      currency,
      notes,
      payment_capture: true, // auto-capture
    });

    logger.info(
      `[Razorpay] Created order ${order.id} for ${amount} ${currency} (${amountInPaise} paise)`
    );

    return {
      orderId: order.id,
      amount,
      currency,
      gateway: "razorpay",
    };
  }

  /**
   * Verifies a Razorpay webhook signature using HMAC-SHA256.
   * Razorpay signs the raw request body with the webhook secret.
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      if (!signature || !secret || !payload) return false;
      const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
    } catch {
      return false;
    }
  }

  /**
   * Issues a full or partial refund via the Razorpay Payments API.
   * Amount is expected in major currency unit (INR rupees); converted to paise internally.
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; gatewayRefundId: string }> {
    const amountInPaise = Math.round(amount * 100);

    const refund = await this.client.payments.refund(paymentId, {
      amount: amountInPaise,
      notes: { reason },
    });

    logger.info(
      `[Razorpay] Refund ${refund.id} issued for payment ${paymentId}: ${amount} INR. Reason: ${reason}`
    );

    return {
      success: true,
      gatewayRefundId: refund.id,
    };
  }
}

// ─── Stripe Adapter (Fallback) ─────────────────────────────────────────────────

/**
 * Fallback Stripe Integration Adapter.
 * Signature verification is production-correct; order creation / refunds
 * remain stubs until Stripe keys are provisioned.
 */
export class StripeAdapter implements PaymentGatewayAdapter {
  async createOrder(amount: number, currency = "USD"): Promise<GatewayOrderDetails> {
    // TODO: Replace with stripe.paymentIntents.create() when Stripe is provisioned.
    const fakeOrderId = `pi_${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[Stripe] Created PaymentIntent ${fakeOrderId} for amount: ${amount} ${currency}`);
    return {
      orderId: fakeOrderId,
      amount,
      currency,
      gateway: "stripe",
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      if (!signature || !secret || !payload) return false;
      const parts = signature.split(",");
      const tPart = parts.find((p) => p.startsWith("t="));
      const v1Part = parts.find((p) => p.startsWith("v1="));
      if (!tPart || !v1Part) return false;

      const timestamp = tPart.substring(2);
      const hash = v1Part.substring(3);

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${payload}`)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(hash, "hex")
      );
    } catch {
      return false;
    }
  }

  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; gatewayRefundId: string }> {
    // TODO: Replace with stripe.refunds.create() when Stripe is provisioned.
    const fakeRefundId = `re_${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[Stripe] Refunded charge ${paymentId} for amount ${amount}. Reason: ${reason}`);
    return { success: true, gatewayRefundId: fakeRefundId };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export class PaymentGatewayService {
  static getAdapter(gateway: "razorpay" | "stripe" = "razorpay"): PaymentGatewayAdapter {
    if (gateway === "stripe") return new StripeAdapter();
    return new RazorpayAdapter();
  }
}

import { logger } from "@/services/logger";
import crypto from "crypto";

export interface GatewayOrderDetails {
  orderId: string;
  amount: number;
  currency: string;
  gateway: "razorpay" | "stripe";
}

export interface PaymentGatewayAdapter {
  createOrder(amount: number, currency: string): Promise<GatewayOrderDetails>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
  refundPayment(paymentId: string, amount: number, reason: string): Promise<{ success: boolean; gatewayRefundId: string }>;
}

/**
 * Razorpay Integration Adapter.
 * Simulates API orders generation and checksum signature calculations.
 */
export class RazorpayAdapter implements PaymentGatewayAdapter {
  async createOrder(amount: number, currency = "INR"): Promise<GatewayOrderDetails> {
    const fakeOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[Razorpay] Created order ${fakeOrderId} for amount: ${amount} ${currency}`);
    return {
      orderId: fakeOrderId,
      amount,
      currency,
      gateway: "razorpay",
    };
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      if (!signature || !secret || !payload) return false;
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(payload);
      const digest = shasum.digest("hex");
      return digest === signature;
    } catch {
      return false;
    }
  }

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<{ success: boolean; gatewayRefundId: string }> {
    const fakeRefundId = `rfnd_${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[Razorpay] Refunded payment ${paymentId} for amount ${amount} INR. Reason: ${reason}`);
    return {
      success: true,
      gatewayRefundId: fakeRefundId,
    };
  }
}

/**
 * Fallback Stripe Integration Adapter.
 */
export class StripeAdapter implements PaymentGatewayAdapter {
  async createOrder(amount: number, currency = "USD"): Promise<GatewayOrderDetails> {
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

      return expectedSignature === hash;
    } catch {
      return false;
    }
  }

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<{ success: boolean; gatewayRefundId: string }> {
    const fakeRefundId = `re_${Math.random().toString(36).substring(2, 15)}`;
    logger.info(`[Stripe] Refunded charge ${paymentId} for amount ${amount}. Reason: ${reason}`);
    return {
      success: true,
      gatewayRefundId: fakeRefundId,
    };
  }
}

export class PaymentGatewayService {
  static getAdapter(gateway: "razorpay" | "stripe" = "razorpay"): PaymentGatewayAdapter {
    if (gateway === "stripe") return new StripeAdapter();
    return new RazorpayAdapter();
  }
}

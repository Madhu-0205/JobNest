"use client";

import { useState, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GatewayPaymentConfig {
  key: string;
  amount: number;     // in paise (Razorpay native unit)
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
}

export type PaymentResult =
  | { success: true;  razorpayPaymentId: string; razorpayOrderId: string }
  | { success: false; error: string; cancelled?: boolean };

// Razorpay Checkout.js injects `window.Razorpay` — declare the minimal shape.
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
  };
}

interface RazorpayInstance {
  open(): void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * usePayments
 *
 * Orchestrates the full Razorpay Checkout flow:
 *   1. Calls POST /api/financial/payments to create a server-side order.
 *   2. Opens the Razorpay Checkout.js modal with the returned order_id.
 *   3. Returns success/failure/cancelled states from the modal callbacks.
 *
 * The wallet balance is updated asynchronously via the Razorpay webhook
 * (payment.captured event) — callers should refresh the wallet after success.
 */
export function usePayments() {
  const [loading, setLoading] = useState(false);

  /**
   * Loads Razorpay Checkout.js dynamically if not already present.
   * Returns a promise that resolves when the script is ready.
   */
  const ensureCheckoutScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay === "function") {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay Checkout.js"));
      document.body.appendChild(script);
    });
  }, []);

  /**
   * initiatePayment
   *
   * @param amount   Amount in INR (major unit). Razorpay conversion to paise is handled internally.
   * @param gateway  Payment gateway (razorpay | stripe). Defaults to razorpay.
   * @param meta     Optional display metadata and escrow context.
   */
  const initiatePayment = useCallback(
    async (
      amount: number,
      gateway: "razorpay" | "stripe" = "razorpay",
      meta?: {
        name?: string;
        description?: string;
        prefillName?: string;
        prefillEmail?: string;
        escrowId?: string;
        opportunityId?: string;
      }
    ): Promise<PaymentResult> => {
      setLoading(true);

      try {
        // ── Step 1: Create server-side order ─────────────────────────────────
        const idempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const res = await fetch("/api/financial/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            gateway,
            idempotencyKey,
            escrowId: meta?.escrowId,
            opportunityId: meta?.opportunityId,
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({})) as { error?: { message?: string } };
          return {
            success: false,
            error: errBody.error?.message ?? `Order creation failed (HTTP ${res.status})`,
          };
        }

        const data = await res.json() as {
          success: boolean;
          data?: { orderId: string; amount: number; paymentId: string };
          error?: { message?: string };
        };

        if (!data.success || !data.data) {
          return {
            success: false,
            error: data.error?.message ?? "Order creation failed.",
          };
        }

        const { orderId } = data.data;

        // ── Step 2: Open Razorpay Checkout modal ─────────────────────────────
        if (gateway === "razorpay") {
          await ensureCheckoutScript();

          const razorpayKeyId = process.env["NEXT_PUBLIC_RAZORPAY_KEY_ID"] ?? "";

          return await new Promise<PaymentResult>((resolve) => {
            const rzp = new window.Razorpay({
              key: razorpayKeyId,
              amount: Math.round(amount * 100), // paise
              currency: "INR",
              name: meta?.name ?? "JobNest",
              description: meta?.description ?? "Wallet top-up",
              order_id: orderId,
              prefill: {
                name: meta?.prefillName,
                email: meta?.prefillEmail,
              },
              theme: { color: "#d97706" }, // amber-600
              handler(response) {
                resolve({
                  success: true,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                });
              },
              modal: {
                ondismiss() {
                  resolve({ success: false, error: "Payment cancelled by user.", cancelled: true });
                },
              },
            });
            rzp.open();
          });
        }

        // ── Stripe path (stub) ───────────────────────────────────────────────
        return { success: false, error: "Stripe checkout is not yet enabled." };

      } catch (err) {
        // Network or script-load failure — always return a proper error state
        const message = err instanceof Error ? err.message : "Payment checkout failed.";
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [ensureCheckoutScript]
  );

  return { loading, initiatePayment };
}

export default usePayments;

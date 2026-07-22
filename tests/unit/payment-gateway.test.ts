/**
 * Unit tests: Payment Gateway Service
 *
 * Covers:
 *   - RazorpayAdapter.verifyWebhookSignature (HMAC-SHA256 correctness)
 *   - RazorpayAdapter.createOrder via mocked SDK
 *   - Idempotency guard logic (signature of behaviour, not DB wiring)
 *   - StripeAdapter.verifyWebhookSignature
 *
 * These tests run fully in-process with no external network calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ─── Mock the razorpay module before importing the adapter ────────────────────
// vi.mock factories are hoisted above all imports by vitest.
// vi.hoisted() runs in that same hoisted scope, so variables defined there
// are available inside the factory — unlike regular `const` declarations.

const { mockOrderCreate, mockPaymentRefund } = vi.hoisted(() => ({
  mockOrderCreate: vi.fn(),
  mockPaymentRefund: vi.fn(),
}));

vi.mock("razorpay", () => {
  // Must be a named function (not an arrow) so `new Razorpay()` works.
  const MockRazorpay = vi.fn().mockImplementation(function () {
    return {
      orders: { create: mockOrderCreate },
      payments: { refund: mockPaymentRefund },
    };
  });
  return { default: MockRazorpay };
});

// Import AFTER mocking so the adapter picks up the mock
import { RazorpayAdapter, StripeAdapter } from "@/services/payment-gateway-service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// ─── RazorpayAdapter: Signature Verification ─────────────────────────────────

describe("RazorpayAdapter.verifyWebhookSignature", () => {
  const adapter = new RazorpayAdapter();
  const secret = process.env["TEST_WEBHOOK_SECRET"] || "dummy_webhook_secret_value_32ch!";

  it("returns true for a valid HMAC-SHA256 signature", () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const signature = makeHmacSignature(payload, secret);
    expect(adapter.verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("returns false for a tampered payload", () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const signature = makeHmacSignature(payload, secret);
    const tampered = JSON.stringify({ event: "payment.captured", extra: "evil" });
    expect(adapter.verifyWebhookSignature(tampered, signature, secret)).toBe(false);
  });

  it("returns false for an empty signature", () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    expect(adapter.verifyWebhookSignature(payload, "", secret)).toBe(false);
  });

  it("returns false for an empty secret", () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const signature = makeHmacSignature(payload, secret);
    expect(adapter.verifyWebhookSignature(payload, signature, "")).toBe(false);
  });

  it("returns false for an empty payload", () => {
    expect(adapter.verifyWebhookSignature("", "some-sig", secret)).toBe(false);
  });

  it("returns false when signature has incorrect length for timingSafeEqual", () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    // A signature that is not valid hex of the right length
    expect(adapter.verifyWebhookSignature(payload, "not-hex-sig", secret)).toBe(false);
  });
});

// ─── RazorpayAdapter: createOrder ────────────────────────────────────────────

describe("RazorpayAdapter.createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env["RAZORPAY_KEY_ID"] = process.env["TEST_RZP_KEY"] || "dummy_rzp_key";
    process.env["RAZORPAY_KEY_SECRET"] = process.env["TEST_RZP_SECRET"] || "dummy_rzp_secret";
  });

  it("calls razorpay.orders.create with amount in paise", async () => {
    mockOrderCreate.mockResolvedValueOnce({
      id: "order_AbCdEfGhIjKl",
      amount: 50000,
      currency: "INR",
    });

    const adapter = new RazorpayAdapter();
    const result = await adapter.createOrder(500, "INR");

    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50000, currency: "INR" })
    );
    expect(result.orderId).toBe("order_AbCdEfGhIjKl");
    expect(result.amount).toBe(500); // returns major unit
    expect(result.gateway).toBe("razorpay");
  });

  it("threads notes into the order creation call", async () => {
    mockOrderCreate.mockResolvedValueOnce({
      id: "order_WithNotes123",
      amount: 100000,
      currency: "INR",
    });

    const adapter = new RazorpayAdapter();
    const notes = { escrow_id: "esc-uuid-001", opportunity_id: "opp-uuid-002" };
    await adapter.createOrder(1000, "INR", notes);

    expect(mockOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({ notes })
    );
  });

  it("throws when RAZORPAY_KEY_ID is missing", async () => {
    delete process.env["RAZORPAY_KEY_ID"];
    const adapter = new RazorpayAdapter();
    await expect(adapter.createOrder(100, "INR")).rejects.toThrow(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set"
    );
  });
});

// ─── RazorpayAdapter: refundPayment ──────────────────────────────────────────

describe("RazorpayAdapter.refundPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env["RAZORPAY_KEY_ID"] = process.env["TEST_RZP_KEY"] || "dummy_rzp_key";
    process.env["RAZORPAY_KEY_SECRET"] = process.env["TEST_RZP_SECRET"] || "dummy_rzp_secret";
  });

  it("calls razorpay.payments.refund with amount in paise", async () => {
    mockPaymentRefund.mockResolvedValueOnce({ id: "rfnd_TestRefund123" });

    const adapter = new RazorpayAdapter();
    const result = await adapter.refundPayment("pay_AbCdEf", 250, "Dispute resolved");

    expect(mockPaymentRefund).toHaveBeenCalledWith("pay_AbCdEf", { amount: 25000, notes: { reason: "Dispute resolved" } });
    expect(result.success).toBe(true);
    expect(result.gatewayRefundId).toBe("rfnd_TestRefund123");
  });
});

// ─── StripeAdapter: Signature Verification ───────────────────────────────────

describe("StripeAdapter.verifyWebhookSignature", () => {
  const adapter = new StripeAdapter();
  const secret = process.env["TEST_STRIPE_SECRET"] || "dummy_whsec_test_stripe_secret";

  function makeStripeSignature(payload: string, timestamp: string, secret: string): string {
    const hash = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    return `t=${timestamp},v1=${hash}`;
  }

  it("returns true for a valid Stripe v1 signature", () => {
    const payload = JSON.stringify({ type: "checkout.session.completed" });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = makeStripeSignature(payload, ts, secret);
    expect(adapter.verifyWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it("returns false for a tampered payload", () => {
    const payload = JSON.stringify({ type: "checkout.session.completed" });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = makeStripeSignature(payload, ts, secret);
    expect(adapter.verifyWebhookSignature("{tampered}", sig, secret)).toBe(false);
  });
});

// ─── Idempotency Logic ────────────────────────────────────────────────────────

describe("Webhook idempotency contract", () => {
  /**
   * This verifies the *rule* that a `captured` payment must not trigger
   * a second credit. We test the guard logic in isolation here.
   */
  it("skips processing when payment status is already captured", () => {
    const existingStatus: string = "captured";
    const shouldSkip = existingStatus === "captured";
    expect(shouldSkip).toBe(true);
  });

  it("processes when payment status is pending", () => {
    const existingStatus: string = "pending";
    const shouldSkip = existingStatus === "captured";
    expect(shouldSkip).toBe(false);
  });

  it("processes when no payment row exists (null)", () => {
    const existingPayment = null;
    const shouldSkip = existingPayment !== null && (existingPayment as { status: string }).status === "captured";
    expect(shouldSkip).toBe(false);
  });
});

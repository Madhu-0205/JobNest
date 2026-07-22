import { z } from "zod";

/**
 * Validation schema for initiating payment gateways intents.
 */
export const paymentIntentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero."),
  currency: z.string().min(3).max(10).default("INR"),
  gateway: z.enum(["razorpay", "stripe"]).default("razorpay"),
  idempotencyKey: z.string().min(10, "Secure idempotency key is required."),
  /** Optional: when set, the webhook auto-funds this escrow after payment capture. */
  escrowId: z.string().uuid().optional(),
  /** Optional: thread through for ledger notes. */
  opportunityId: z.string().uuid().optional(),
});

/**
 * Validation schema for payout bank or UPI transfer requests.
 */
export const payoutRequestSchema = z.object({
  amount: z.number().positive("Payout value must be positive."),
  method: z.enum(["bank_transfer", "upi"]),
  destination: z.string().min(5, "Destination account detail or UPI VPA is required."),
});

/**
 * Validation schema for establishing escrow contracts.
 */
export const escrowCreateSchema = z.object({
  opportunityId: z.string().uuid("Opportunity key must be a valid UUID."),
  payeeId: z.string().uuid("Payee worker key must be a valid UUID."),
  amount: z.number().positive("Escrow commitment value must be greater than zero."),
  commissionRate: z.number().min(0.00).max(1.00).default(0.05), // default 5%
});

/**
 * Validation schema for applying coupon discount codes.
 */
export const couponApplySchema = z.object({
  code: z.string().min(1, "Promo code is required.").toUpperCase(),
});

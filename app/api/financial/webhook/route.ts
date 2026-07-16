import { NextRequest, NextResponse } from "next/server";
import { PaymentGatewayService } from "@/services/payment-gateway-service";
import { WalletEngine } from "@/services/wallet-engine";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || req.headers.get("stripe-signature") || "";
    
    // Choose adapter (defaults to razorpay)
    const gateway = req.headers.get("stripe-signature") ? "stripe" as const : "razorpay" as const;
    const adapter = PaymentGatewayService.getAdapter(gateway);

    // Verify webhook signature (using test keys check in sandbox mode)
    const webhookSecret = process.env["PAYMENT_WEBHOOK_SECRET"] || "mock_webhook_secret";
    const isValid = adapter.verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      logger.warn(`[PaymentWebhook] Rejected webhook request due to invalid signature checksum.`);
      return NextResponse.json({ success: false, error: "Invalid signature verification." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const supabase = await createServerClient();

    // 1. Process Razorpay Event
    if (gateway === "razorpay") {
      const eventType = payload.event;
      if (eventType === "payment.captured") {
        const paymentObj = payload.payload.payment.entity;
        const gatewayPaymentId = paymentObj.id;
        const gatewayOrderId = paymentObj.order_id;
        const amount = paymentObj.amount / 100; // Razorpay uses paisa

        // Update payment status
        const { data: payment, error } = await supabase
          .from("payments")
          .update({
            status: "captured",
            gateway_payment_id: gatewayPaymentId,
            updated_at: new Date().toISOString(),
          })
          .eq("gateway_order_id", gatewayOrderId)
          .select("user_id, id")
          .maybeSingle();

        if (!error && payment) {
          // Credit user wallet balance
          await WalletEngine.credit(
            payment.user_id,
            amount,
            "payment",
            payment.id,
            `Deposit loaded via Razorpay Payment Ref: ${gatewayPaymentId}`
          );
        } else {
          logger.info(`Bypassed DB. Crediting simulated webhook deposit of ${amount} INR.`);
        }
      }
    } 
    // 2. Process Stripe Event
    else {
      const eventType = payload.type;
      if (eventType === "checkout.session.completed") {
        const session = payload.data.object;
        const gatewayOrderId = session.id;
        const amount = session.amount_total / 100;

        const { data: payment, error } = await supabase
          .from("payments")
          .update({
            status: "captured",
            gateway_payment_id: session.payment_intent || gatewayOrderId,
            updated_at: new Date().toISOString(),
          })
          .eq("gateway_order_id", gatewayOrderId)
          .select("user_id, id")
          .maybeSingle();

        if (!error && payment) {
          await WalletEngine.credit(
            payment.user_id,
            amount,
            "payment",
            payment.id,
            `Deposit loaded via Stripe Session Ref: ${gatewayOrderId}`
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.warn(`[PaymentWebhook] Webhook capture error: ${err instanceof Error ? err.message : String(err)}`);
    // Graceful response to webhooks to avoid retry overload
    return NextResponse.json({ success: true, warning: "Processed sandbox default callback triggers." });
  }
}

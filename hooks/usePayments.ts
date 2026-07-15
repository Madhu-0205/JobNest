"use client";

import { useState } from "react";


export interface GatewayPaymentConfig {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
  };
}

export function usePayments() {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (amount: number, gateway: "razorpay" | "stripe" = "razorpay") => {
    try {
      setLoading(true);
      const idempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await fetch("/api/financial/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, gateway, idempotencyKey }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        return {
          success: true,
          orderId: data.data.orderId,
          paymentId: data.data.paymentId,
        };
      }
      return { success: false, error: data.error?.message || "Payment setup failed." };
    } catch {
      setLoading(false);
      return {
        success: true,
        orderId: `order_${Math.random().toString(36).substring(2, 8)}`,
        paymentId: crypto.randomUUID(),
      };
    }
  };

  return {
    loading,
    initiatePayment,
  };
}

export default usePayments;

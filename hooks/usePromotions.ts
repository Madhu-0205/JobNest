"use client";

import { useState } from "react";


export interface ReferralLog {
  id: string;
  referredName: string;
  status: string;
  rewardAmount: number;
  created_at: string;
}

export function usePromotions() {
  const [referrals] = useState<ReferralLog[]>([
    {
      id: "ref1",
      referredName: "Sunil Gowda",
      status: "qualified",
      rewardAmount: 150.00,
      created_at: "2026-07-12T10:00:00.000Z",
    },
    {
      id: "ref2",
      referredName: "Deepa Nair",
      status: "pending",
      rewardAmount: 50.00,
      created_at: "2026-07-14T15:30:00.000Z",
    }
  ]);

  const applyCoupon = async (code: string) => {
    try {
      const res = await fetch("/api/financial/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, discountValue: data.data.discountValue };
      }
      return { success: false, error: data.error?.message || "Invalid coupon." };
    } catch {
      // Sandbox mocks check
      if (code === "WELCOME10") {
        return { success: true, discountValue: 10 }; // 10% discount
      }
      if (code === "FESTIVE50") {
        return { success: true, discountValue: 50 }; // 50 flat discount
      }
      return { success: false, error: "Coupon code not found." };
    }
  };

  return {
    referrals,
    applyCoupon,
  };
}

export default usePromotions;

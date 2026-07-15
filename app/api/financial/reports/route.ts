import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } }, { status: 401 });
    }

    // Dynamic reports summaries aggregation
    // 1. Sum up captured payments
    const { data: payData } = await supabase
      .from("payments")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "captured");

    const totalSpend = (payData || []).reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. Sum up commission records
    const { data: commData } = await supabase
      .from("commissions")
      .select("amount");

    const totalPlatformRevenue = (commData || []).reduce((sum, c) => sum + Number(c.amount), 0);

    // 3. Sum up completed payouts
    const { data: payoData } = await supabase
      .from("payouts")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const totalEarnings = (payoData || []).reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalSpend,
        totalEarnings,
        totalPlatformRevenue,
        currency: "INR",
        monthlyCommissionRate: 0.05,
      }
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "UNKNOWN_ERROR", message: err instanceof Error ? err.message : "Reports aggregation failed." }
    }, { status: 500 });
  }
}

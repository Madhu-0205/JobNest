import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } }, { status: 401 });
    }

    // 1. Fetch Wallet Balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // 2. Fetch Wallet Transactions History
    let transactions = [];
    if (wallet) {
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false });
      transactions = txs || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet ? Number(wallet.balance) : 0.00,
        pendingBalance: wallet ? Number(wallet.pending_balance) : 0.00,
        lockedBalance: wallet ? Number(wallet.locked_balance) : 0.00,
        currency: wallet ? wallet.currency : "INR",
        transactions,
      }
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "UNKNOWN_ERROR", message: err instanceof Error ? err.message : "Fetch wallet failed." }
    }, { status: 500 });
  }
}

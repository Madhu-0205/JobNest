"use client";

import { useState } from "react";
import { ProductShell } from "@/components/ProductShell";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import { useInvoices } from "@/hooks/useInvoices";
import { usePromotions } from "@/hooks/usePromotions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { logger } from "@/services/logger";

interface LedgerLine {
  id: string;
  accountId: string | null;
  amount: number;
  type: "debit" | "credit";
  refType: string;
  time: string;
}

export default function FinancialDashboard() {
  // Client hooks
  const wallet = useWallet();
  const escrow = useEscrow();
  const invoice = useInvoices();
  const promo = usePromotions();

  // Inputs
  const [depositAmount, setDepositAmount] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDest, setPayoutDest] = useState("");
  
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const [escrowReleaseAmount, setEscrowReleaseAmount] = useState<number>(500);

  // Dynamic simulated ledger entries feed
  const [ledgerFeed, setLedgerFeed] = useState<LedgerLine[]>([
    { id: "l1", accountId: "Platform", amount: 500.00, type: "debit", refType: "payment", time: "5 mins ago" },
    { id: "l2", accountId: "worker-profile-id", amount: 500.00, type: "credit", refType: "payment", time: "5 mins ago" },
    { id: "l3", accountId: "employer-profile-id", amount: 150.00, type: "debit", refType: "escrow_hold", time: "1 hour ago" },
    { id: "l4", accountId: "Platform", amount: 150.00, type: "credit", refType: "escrow_hold", time: "1 hour ago" },
  ]);

  // GST State
  const [gstStateCode, setGstStateCode] = useState("29"); // '29' represents local Karnataka CGST/SGST split

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    const res = await wallet.depositFunds(amt, "razorpay");
    if (res.success) {
      // Append double entries to ledger feed
      const txId = crypto.randomUUID().substring(0, 8);
      const newDebit: LedgerLine = { id: `deb_${txId}`, accountId: "Platform", amount: amt, type: "debit", refType: "payment", time: "Just now" };
      const newCredit: LedgerLine = { id: `cred_${txId}`, accountId: "worker-profile-id", amount: amt, type: "credit", refType: "payment", time: "Just now" };
      
      setLedgerFeed((prev) => [newDebit, newCredit, ...prev]);
      setDepositAmount("");
      logger.info(`[FinancialPage] Deposited simulated ${amt} INR.`);
    }
  };

  const handlePayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0 || !payoutDest.trim()) return;

    const res = await wallet.depositFunds(-amt, "razorpay"); // deduct
    if (res.success) {
      const txId = crypto.randomUUID().substring(0, 8);
      const newDebit: LedgerLine = { id: `deb_${txId}`, accountId: "worker-profile-id", amount: amt, type: "debit", refType: "payout", time: "Just now" };
      const newCredit: LedgerLine = { id: `cred_${txId}`, accountId: "Platform", amount: amt, type: "credit", refType: "payout", time: "Just now" };

      setLedgerFeed((prev) => [newDebit, newCredit, ...prev]);
      setPayoutAmount("");
      setPayoutDest("");
      logger.info(`[FinancialPage] Dispatched payout of ${amt} INR.`);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    const res = await promo.applyCoupon(couponInput);
    if (res.success) {
      setCouponMessage(`Promo applied successfully: ${res.discountValue}% discount computed.`);
    } else {
      setCouponMessage(res.error || "Promo code not found.");
    }
  };

  const handleReleaseEscrowFunds = async (escrowId: string) => {
    const rate = 0.05; // 5% platform commission
    const commission = escrowReleaseAmount * rate;
    const netRelease = escrowReleaseAmount - commission;

    const res = await escrow.releaseEscrow(escrowId, escrowReleaseAmount, "partial");
    if (res.success) {
      // Append matching double-entry ledger rows
      const txId = crypto.randomUUID().substring(0, 8);
      // Debit Payer
      const debPayer: LedgerLine = { id: `deb_${txId}_p`, accountId: "employer-profile-id", amount: escrowReleaseAmount, type: "debit", refType: "escrow_release", time: "Just now" };
      // Credit Worker
      const credWorker: LedgerLine = { id: `cred_${txId}_w`, accountId: "worker-profile-id", amount: netRelease, type: "credit", refType: "escrow_release", time: "Just now" };
      // Credit Platform Commission
      const credPlatform: LedgerLine = { id: `cred_${txId}_com`, accountId: "Platform", amount: commission, type: "credit", refType: "commission", time: "Just now" };

      setLedgerFeed((prev) => [debPayer, credWorker, credPlatform, ...prev]);
      logger.info(`[FinancialPage] Escrow released: ${netRelease} net, ${commission} commission.`);
    }
  };

  return (
    <ProductShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Wallet board & ledger audit */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Wallet Balance Board */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">My Wallet Balances</CardTitle>
              <CardDescription className="text-xs">
                Active wallet credentials and currency storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-border/40 rounded-xl p-2 bg-black/15">
                  <span className="text-[10px] text-muted-foreground block">Active</span>
                  <span className="text-lg font-bold font-mono text-amber-500">₹{wallet.balance}</span>
                </div>
                <div className="border border-border/40 rounded-xl p-2 bg-black/15">
                  <span className="text-[10px] text-muted-foreground block">Pending</span>
                  <span className="text-lg font-bold font-mono text-muted-foreground">₹{wallet.pendingBalance}</span>
                </div>
                <div className="border border-border/40 rounded-xl p-2 bg-black/15">
                  <span className="text-[10px] text-muted-foreground block">Locked</span>
                  <span className="text-lg font-bold font-mono text-amber-600">₹{wallet.lockedBalance}</span>
                </div>
              </div>

              {/* Deposit Quick Action */}
              <div className="flex flex-col gap-2 border-t border-border/10 pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground" htmlFor="deposit-amt">
                  Quick Deposit Balance (INR)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="deposit-amt"
                    placeholder="Enter deposit amount..."
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                  <Button size="sm" onClick={handleDeposit} className="bg-amber-600 hover:bg-amber-700 text-xs px-3 h-8.5">
                    Deposit
                  </Button>
                </div>
              </div>

              {/* Payout Quick Action */}
              <div className="flex flex-col gap-2 border-t border-border/10 pt-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground" htmlFor="payout-amt">
                  Request Payout / Bank Transfer
                </label>
                <div className="flex gap-2">
                  <Input
                    id="payout-amt"
                    placeholder="Amount..."
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="h-8.5 text-xs font-mono w-24"
                  />
                  <Input
                    placeholder="UPI ID or Bank Account..."
                    value={payoutDest}
                    onChange={(e) => setPayoutDest(e.target.value)}
                    className="h-8.5 text-xs flex-1"
                  />
                  <Button size="sm" onClick={handlePayout} className="bg-amber-600 hover:bg-amber-700 text-xs px-3 h-8.5">
                    Payout
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Double-Entry Ledger Immutable Audit */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-500 font-bold">Double-Entry Ledger Audit</CardTitle>
              <CardDescription className="text-xs">
                Balanced transaction logs. Total Sum offset = ₹0.00
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/35 rounded-xl border border-border/40 p-2.5 font-mono text-[9px] h-[170px] overflow-y-auto flex flex-col gap-2 text-muted-foreground">
                {ledgerFeed.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-border/10 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-semibold">{item.accountId || "Platform Account"}</span>
                      <span className="text-[8px] opacity-60">Type: {item.refType} • {item.time}</span>
                    </div>
                    <span className={`font-bold ${item.type === "credit" ? "text-emerald-500" : "text-rose-500"}`}>
                      {item.type === "credit" ? "+" : "-"}₹{item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Center column: Escrows holding controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Escrow holds mediation list */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">Escrow Holding Accounts</CardTitle>
              <CardDescription className="text-xs">
                Active deposits securely locked in escrow.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              {escrow.escrows.map((item) => (
                <div key={item.id} className="border border-border/40 rounded-xl p-3.5 bg-black/10 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-amber-500">Escrow Account #{item.id}</span>
                    <Badge variant={item.status === "disputed" ? "danger" : "warning"} className="text-[8px] font-bold">
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Held Amount</span>
                      <span className="font-bold text-lg font-mono">₹{item.amount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Platform commission (5%)</span>
                      <span className="font-mono text-muted-foreground">₹{item.commission_amount}</span>
                    </div>
                  </div>

                  {/* Partial release controls */}
                  <div className="flex flex-col gap-1.5 border-t border-border/10 pt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <label htmlFor={`release-range-${item.id}`}>Amount to Release:</label>
                      <span className="font-bold text-amber-500">₹{escrowReleaseAmount}</span>
                    </div>
                    <input
                      id={`release-range-${item.id}`}
                      type="range"
                      min="100"
                      max={item.amount}
                      step="50"
                      value={escrowReleaseAmount}
                      onChange={(e) => setEscrowReleaseAmount(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleReleaseEscrowFunds(item.id)}
                        disabled={item.status === "released"}
                        className="bg-amber-600 hover:bg-amber-700 text-[10px] h-7.5 flex-1"
                      >
                        Release Funds
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => escrow.triggerDisputeHold(item.id)}
                        disabled={item.status === "disputed" || item.status === "released"}
                        className="text-[10px] h-7.5 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 flex-1"
                      >
                        File Dispute
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

            </CardContent>
          </Card>

          {/* Coupon and rewards console */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">Coupons & Referral Rewards</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted-foreground font-semibold" htmlFor="coupon-code">
                  Apply Discount Coupon Code
                </label>
                <div className="flex gap-2">
                  <Input
                    id="coupon-code"
                    placeholder="e.g. WELCOME10, FESTIVE50"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="h-8 text-xs font-mono uppercase"
                  />
                  <Button size="sm" onClick={handleApplyCoupon} className="h-8 text-xs">
                    Apply
                  </Button>
                </div>
                {couponMessage && (
                  <span className="text-[9px] text-amber-500 italic block mt-0.5">{couponMessage}</span>
                )}
              </div>

              {/* Referrals tracker */}
              <div className="flex flex-col gap-2 border-t border-border/10 pt-3">
                <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider">
                  Referrals Program Status
                </Typography>
                <div className="flex flex-col gap-1.5">
                  {promo.referrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex justify-between items-center bg-muted/30 px-2.5 py-1.5 rounded border border-border/20 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{ref.referredName}</span>
                        <span className="text-[9px] text-muted-foreground">Joined 3 days ago</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ref.status === "qualified" ? "success" : "secondary"} className="text-[8px] font-bold">
                          {ref.status.toUpperCase()}
                        </Badge>
                        <span className="font-semibold font-mono">₹{ref.rewardAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right column: GST Tax Invoice Receipts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* GST Ready Invoice sheets previewer */}
          <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base gold-gradient-text">GST Tax Invoice Sheet</CardTitle>
              <CardDescription className="text-xs">
                Tax breakdowns, CGST, SGST, IGST subdivisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-semibold text-muted-foreground" htmlFor="state-select">
                  Billing Place / State:
                </label>
                <select
                  id="state-select"
                  value={gstStateCode}
                  onChange={(e) => setGstStateCode(e.target.value)}
                  className="bg-muted text-foreground text-xs px-2 py-1 rounded border border-border outline-none cursor-pointer"
                >
                  <option value="29">Karnataka (Local State: split CGST/SGST)</option>
                  <option value="33">Tamil Nadu (Interstate: IGST 18%)</option>
                </select>
              </div>

              {/* Receipt mockup card */}
              <div className="border border-border/50 rounded-xl p-3.5 bg-black/30 font-mono text-[10px] flex flex-col gap-2.5 text-muted-foreground">
                <div className="text-center border-b border-border/25 pb-2">
                  <span className="font-bold text-foreground text-xs block">TAX INVOICE / RECEIPT</span>
                  <span className="text-[8px]">JOBNEST V2 PRIVATE LIMITED</span>
                  <span className="text-[8px] block">GSTIN: 29AAAAA0000A1Z1</span>
                </div>

                <div className="flex justify-between">
                  <span>Invoice: INV-2026-98124</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>

                <div className="border-b border-border/20 pb-1">
                  <div className="flex justify-between font-bold text-foreground mb-1">
                    <span>Item Description</span>
                    <span>Total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Coconut Field Clearing</span>
                    <span>₹1,000.00</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-[9px] border-b border-border/20 pb-1.5">
                  <div className="flex justify-between">
                    <span>Base Subtotal</span>
                    <span>₹1,000.00</span>
                  </div>
                  
                  {gstStateCode === "29" ? (
                    <>
                      <div className="flex justify-between text-amber-500">
                        <span>CGST @ 9%</span>
                        <span>₹90.00</span>
                      </div>
                      <div className="flex justify-between text-amber-500">
                        <span>SGST @ 9%</span>
                        <span>₹90.00</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-amber-500">
                      <span>IGST @ 18%</span>
                      <span>₹180.00</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-bold text-foreground text-xs pt-1">
                  <span>Grand Total (GST Incl.)</span>
                  <span>₹1,180.00</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-border/10 pt-3">
                <Typography variant="muted" className="text-[10px] font-bold uppercase tracking-wider">
                  Invoices History Ledger
                </Typography>
                <div className="flex flex-col gap-1.5">
                  {invoice.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex justify-between items-center bg-muted/30 px-2.5 py-1.5 rounded border border-border/20 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{inv.invoice_number}</span>
                        <span className="text-[9px] text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={inv.status === "paid" ? "success" : "secondary"} className="text-[8px] font-bold">
                          {inv.status.toUpperCase()}
                        </Badge>
                        <span className="font-semibold font-mono">₹{inv.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </ProductShell>
  );
}

"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { useWallet } from "@/hooks/useWallet";
import { requestPayoutAction } from "@/features/financial/actions";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  FileText
} from "lucide-react";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

export default function WalletPage() {
  const router = useRouter();
  const { t: i18nT } = useI18n();
  const { user } = useAuth();
  const { balance, pendingBalance, lockedBalance, transactions, loading: walletLoading, error: walletError, isUnauthorized, depositFunds, refresh } = useWallet();
  
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user || isUnauthorized) {
    return (
      <ProductShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
          <Wallet className="w-12 h-12 text-muted-foreground opacity-50" />
          <Typography variant="h3" className="font-bold">Sign in to view your wallet.</Typography>
          <Typography variant="muted" className="text-sm max-w-md">
            You need to be authenticated to access your financial dashboard, view balances, and manage escrow transactions.
          </Typography>
          <Button variant="primary" onClick={() => router.push("/")} className="mt-2">
            Sign In
          </Button>
        </div>
      </ProductShell>
    );
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmt);
    if (isNaN(amt) || amt <= 0) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await depositFunds(amt, "razorpay");
    setLoading(false);

    if (result.success) {
      setSuccessMsg(`Deposit order created (ID: ${result.orderId}). Complete via gateway.`);
      setDepositAmt("");
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(result.error || "Failed to initialize deposit.");
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmt);
    if (isNaN(amt) || amt <= 0 || (balance !== null && amt > balance) || !withdrawDest.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const result = await requestPayoutAction({
      amount: amt,
      method: "bank_transfer",
      destination: withdrawDest
    });
    setLoading(false);

    if (result.success) {
      setSuccessMsg(`Successfully requested payout of ₹${amt} to ${withdrawDest}!`);
      setWithdrawAmt("");
      setWithdrawDest("");
      await refresh();
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(result.error?.message || "Failed to request payout.");
    }
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("app.escrowWalletLedger")}</Typography>
          <Typography variant="muted" className="text-xs">
            {i18nT("app.depositFundsReleaseCompletedGigEscrowsAndAudit")}
          </Typography>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {successMsg}
          </div>
        )}

        {walletError && (
          <div className="bg-rose-950/80 border border-rose-500/30 text-rose-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            Failed to load wallet data: {walletError.message}. The system is experiencing degradation. Please try again later.
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-500/30 text-rose-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Balance card */}
          <Card className="glass-card p-6 flex flex-col justify-between md:col-span-1 bg-linear-to-br from-primary/10 to-transparent border-primary/20 relative overflow-hidden">
            {walletLoading && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted uppercase font-mono tracking-wider">{i18nT("app.availableBalance")}</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-foreground">₹{balance !== null ? balance.toLocaleString() : "--"}</span>
              <span className="block text-[10px] text-muted-foreground mt-1">{i18nT("app.100LiquidIndianRupeesInr")}</span>
            </div>
            <div className="flex flex-col gap-2">
              {(pendingBalance !== null && lockedBalance !== null) && (pendingBalance > 0 || lockedBalance > 0) && (
                <div className="text-[10px] text-muted flex gap-1.5 items-center">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>₹{(pendingBalance + lockedBalance).toLocaleString()} locked in active escrows</span>
                </div>
              )}
            </div>
          </Card>

          {/* Deposit panel */}
          <Card className="glass-card p-6 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />{i18nT("app.depositWalletFunds")}
            </Typography>
            <form onSubmit={handleDeposit} className="flex flex-col gap-3">
              <Input
                label={i18nT("app.depositAmount")}
                type="number"
                required
                placeholder={i18nT("app.eg1500")}
                value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)} />
              
              <Button variant="primary" type="submit" isLoading={loading} className="w-full mt-2">
                {i18nT("app.depositViaRazorpay")}
              </Button>
            </form>
          </Card>

          {/* Payout/Withdrawal panel */}
          <Card className="glass-card p-6 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold text-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-amber-500" />{i18nT("app.instantBankPayout")}
            </Typography>
            <form onSubmit={handleWithdrawal} className="flex flex-col gap-3">
              <Input
                label={i18nT("app.withdrawAmount")}
                type="number"
                required
                max={balance !== null ? balance : undefined}
                placeholder={i18nT("app.eg500")}
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)} />
              
              <Input
                label={i18nT("app.upiIdBankAccount")}
                required
                placeholder={i18nT("app.egArunupi")}
                value={withdrawDest}
                onChange={(e) => setWithdrawDest(e.target.value)} />
              
              <Button variant="outline" type="submit" isLoading={loading} className="w-full mt-2" disabled={balance === null || parseFloat(withdrawAmt) > balance}>
                {i18nT("app.requestSettlementPayout")}
              </Button>
            </form>
          </Card>
        </div>

        {/* Ledger transaction logs */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />{i18nT("app.auditLedgerTransactions")}
          </Typography>
          
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-luxury relative">
            {walletLoading && transactions.length === 0 && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 min-h-37.5">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {transactions.length === 0 && !walletLoading ? (
              <EmptyState
                icon={<Wallet className="w-8 h-8 text-primary/60" />}
                title="No Transactions Recorded"
                description="Your deposits, withdrawals, and escrow releases will appear here in real time."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      const depositInput = document.querySelector('input[type="number"]') as HTMLInputElement;
                      depositInput?.focus();
                    }}
                  >
                    Deposit Funds
                  </Button>
                }
                className="my-4 border-none bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/30 text-muted-foreground font-semibold">
                      <th className="p-4">{i18nT("app.transactionId")}</th>
                      <th className="p-4">{i18nT("Date")}</th>
                      <th className="p-4">{i18nT("Description")}</th>
                      <th className="p-4 text-right">{i18nT("Amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">
                          {tx.id.split('-')[0]}...
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-4 font-semibold text-foreground flex flex-col gap-1">
                          <span>{tx.description || tx.category}</span>
                          <span className="text-[9px] text-muted-foreground uppercase font-mono">{tx.category}</span>
                        </td>
                        <td className={`p-4 text-right font-bold ${
                          tx.type === "credit" ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {tx.type === "credit" ? "+" : "-"} ₹{Number(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </ProductShell>
  );
}
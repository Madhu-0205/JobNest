"use client";

import { useState } from "react";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
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

export default function WalletPage() {
  const { user, updateWalletBalance, addTransaction } = useAuth();
  const [depositAmt, setDepositAmt] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawDest, setWithdrawDest] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmt);
    if (isNaN(amt) || amt <= 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateWalletBalance(amt);
      addTransaction({
        id: `tx-${Date.now()}`,
        type: "deposit",
        amount: amt,
        desc: "Simulated Razorpay Deposit",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      });
      setSuccessMsg(`Successfully deposited ₹${amt} into your wallet!`);
      setDepositAmt("");
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 1000);
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmt);
    if (isNaN(amt) || amt <= 0 || amt > user.walletBalance || !withdrawDest.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateWalletBalance(-amt);
      addTransaction({
        id: `tx-${Date.now()}`,
        type: "withdrawal",
        amount: amt,
        desc: `Transferred to UPI: ${withdrawDest}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      });
      setSuccessMsg(`Successfully withdrew ₹${amt} to ${withdrawDest}!`);
      setWithdrawAmt("");
      setWithdrawDest("");
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 1000);
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div>
          <Typography variant="h2" className="font-bold gold-gradient-text">Escrow Wallet Ledger</Typography>
          <Typography variant="muted" className="text-xs">
            Deposit funds, release completed gig escrows, and audit cryptographic double-entry ledger audits.
          </Typography>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Balance card */}
          <Card className="glass-card p-6 flex flex-col justify-between md:col-span-1 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="flex justify-between items-start">
              <span className="text-xs text-muted uppercase font-mono tracking-wider">Available Balance</span>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="my-6">
              <span className="text-4xl font-extrabold text-foreground">₹{user.walletBalance.toLocaleString()}</span>
              <span className="block text-[10px] text-muted-foreground mt-1">100% liquid Indian Rupees (INR)</span>
            </div>
            <div className="text-[10px] text-muted flex gap-1.5 items-center">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>₹1,000 additional locked in active escrows</span>
            </div>
          </Card>

          {/* Deposit panel */}
          <Card className="glass-card p-6 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Deposit Wallet Funds
            </Typography>
            <form onSubmit={handleDeposit} className="flex flex-col gap-3">
              <Input
                label="Deposit Amount (₹)"
                type="number"
                required
                placeholder="e.g. 1500"
                value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)}
              />
              <Button variant="primary" type="submit" isLoading={loading} className="w-full mt-2">
                Deposit via Razorpay
              </Button>
            </form>
          </Card>

          {/* Payout/Withdrawal panel */}
          <Card className="glass-card p-6 flex flex-col gap-4">
            <Typography variant="h3" className="font-bold text-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-amber-500" />
              Instant Bank Payout
            </Typography>
            <form onSubmit={handleWithdrawal} className="flex flex-col gap-3">
              <Input
                label="Withdraw Amount (₹)"
                type="number"
                required
                max={user.walletBalance}
                placeholder="e.g. 500"
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
              />
              <Input
                label="UPI ID / Bank Account"
                required
                placeholder="e.g. arun@upi"
                value={withdrawDest}
                onChange={(e) => setWithdrawDest(e.target.value)}
              />
              <Button variant="outline" type="submit" isLoading={loading} className="w-full mt-2" disabled={parseFloat(withdrawAmt) > user.walletBalance}>
                Request Settlement payout
              </Button>
            </form>
          </Card>
        </div>

        {/* Ledger transaction logs */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Audit Ledger Transactions
          </Typography>
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-luxury">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border/30 text-muted-foreground font-semibold">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {user.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-mono text-[10px] text-muted-foreground">{tx.id}</td>
                    <td className="p-4 text-muted-foreground">{tx.date}</td>
                    <td className="p-4 font-semibold text-foreground">{tx.desc}</td>
                    <td className={`p-4 text-right font-bold ${
                      tx.type === "deposit" ? "text-emerald-400" : tx.type === "withdrawal" ? "text-rose-400" : "text-amber-500"
                    }`}>
                      {tx.type === "deposit" ? "+" : "-" } ₹{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ProductShell>
  );
}

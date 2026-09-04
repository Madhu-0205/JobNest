import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Wallet",
  },
  description: "Secure escrow payments, wallet balance, and instant milestone payouts on JobNest.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

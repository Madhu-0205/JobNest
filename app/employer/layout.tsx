import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Hire Local Workers",
  },
  description: "Post gigs, hire verified local workers with escrow protection, and manage jobs.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

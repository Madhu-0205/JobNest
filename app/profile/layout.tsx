import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Profile",
  },
  description: "Manage your JobNest verified identity, Aadhaar KYC verification, and trust score.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

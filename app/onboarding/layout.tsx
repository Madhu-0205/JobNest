import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Onboarding",
  },
  description: "Complete your JobNest profile setup, role selection, and verification.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

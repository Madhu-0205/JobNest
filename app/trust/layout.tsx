import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Trust & Safety",
  },
  description: "Hyperlocal trust scoring, Aadhaar KYC verification, and emergency SOS safety management.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Resident Community",
  },
  description: "Connect with neighbors, find trusted local assistance, and post community tasks.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

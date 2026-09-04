import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Messages",
  },
  description: "Real-time multilingual messaging with clients, workers, and employers on JobNest.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

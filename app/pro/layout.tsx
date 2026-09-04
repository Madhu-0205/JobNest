import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Professional Network",
  },
  description: "Discover professional opportunities, connect with people and organizations, and build your professional network with JobNest.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Local Opportunities",
  },
  description: "Find nearby gigs, local jobs, trusted workers and helpful services with JobNest.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

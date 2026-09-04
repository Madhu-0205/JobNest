import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Geospatial Intelligence",
  },
  description: "Map-based labor demand, live worker clusters, and hyperlocal supply intelligence.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

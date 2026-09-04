import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Jobs",
  },
  description: "Discover jobs and opportunities matched to your skills, interests and location.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

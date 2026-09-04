import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Local Gigs & Work",
  },
  description: "Browse verified local gigs and work opportunities in your neighborhood.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

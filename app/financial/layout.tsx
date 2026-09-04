import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Financial Hub",
  },
  description: "Access micro-credit, daily earnings, and insurance backed by JobNest financial services.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

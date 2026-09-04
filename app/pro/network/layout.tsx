import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Network",
  },
  description: "Connect with professionals, follow organizations, and expand your verified career network.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

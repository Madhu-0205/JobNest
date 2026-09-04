import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Settings",
  },
  description: "Customize your notification preferences, privacy, language, and security protocols.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

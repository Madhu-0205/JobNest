import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — AI Assistant",
  },
  description: "Multilingual voice and chat AI assistant for matching, translation, and workflow support.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

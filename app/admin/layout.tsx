import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

export const metadata: Metadata = {
  title: {
    absolute: "JobNest — Administration",
  },
  description: "Platform security oversight, dispute resolution, KYC approvals, and system telemetry.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  try {
    await AuthorizationGuard.assertPermission(PERMISSIONS.ANALYTICS_VIEW);
  } catch {
    redirect("/");
  }

  return <>{children}</>;
}

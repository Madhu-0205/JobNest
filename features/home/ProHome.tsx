"use client";

import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/context";

export function ProHome() {
  const { t: i18nT } = useI18n();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <Typography variant="h1" className="font-bold">
          JobNest <span className="text-primary">Pro</span>
        </Typography>
        <Typography variant="muted" className="text-sm max-w-2xl">
          {i18nT("Welcome to the professional identity interface. This view is tailored for full-time jobs, verifiable credentials, and enterprise organizations.")}
        </Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        <Card className="p-6 flex flex-col gap-3">
          <Typography variant="h3" className="font-bold">Pro Organizations</Typography>
          <Typography variant="muted" className="text-xs">
            Manage your company profile, verifiable credentials, and unified talent pool.
          </Typography>
        </Card>
        <Card className="p-6 flex flex-col gap-3">
          <Typography variant="h3" className="font-bold">Enterprise Jobs</Typography>
          <Typography variant="muted" className="text-xs">
            Post and discover formal employment opportunities with full benefits and SLA tracking.
          </Typography>
        </Card>
        <Card className="p-6 flex flex-col gap-3">
          <Typography variant="h3" className="font-bold">Verified Talent</Typography>
          <Typography variant="muted" className="text-xs">
            Advanced skill-based matching powered by the AI trust ledger.
          </Typography>
        </Card>
      </div>
    </div>
  );
}

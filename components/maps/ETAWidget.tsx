"use client";

import { Navigation, Clock, Milestone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

interface ETAWidgetProps {
  etaMinutes: number;
  distanceRemainingMeters: number;
  speechInstruction?: string | null;
  travelMode?: "driving-car" | "foot-walking" | "cycling-regular";
}

export function ETAWidget({
  etaMinutes,
  distanceRemainingMeters,
  speechInstruction,
  travelMode = "driving-car",
}: ETAWidgetProps) {
  const distanceKm = (distanceRemainingMeters / 1000).toFixed(1);
  const formattedMode = travelMode === "driving-car" ? "Driving" : travelMode === "cycling-regular" ? "Cycling" : "Walking";

  return (
    <Card className="glass-card p-4 flex flex-col gap-2 w-full max-w-sm border border-primary/20 bg-background/90 backdrop-blur-md rounded-2xl shadow-xl">
      <div className="flex justify-between items-center border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary animate-pulse" />
          <div>
            <Typography variant="h4" className="text-sm font-bold m-0 leading-none">
              {etaMinutes} mins
            </Typography>
            <span className="text-[10px] text-muted">Arrival Estimate</span>
          </div>
        </div>
        <div className="h-6 w-px bg-border/40" />
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <div>
            <Typography variant="h4" className="text-sm font-bold m-0 leading-none">
              {distanceKm} km
            </Typography>
            <span className="text-[10px] text-muted">Distance ({formattedMode})</span>
          </div>
        </div>
      </div>

      {speechInstruction && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-2.5">
          <Milestone className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <Typography variant="p" className="text-[11px] text-foreground m-0 font-medium">
            {speechInstruction}
          </Typography>
        </div>
      )}
    </Card>
  );
}
export default ETAWidget;

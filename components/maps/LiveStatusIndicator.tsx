"use client";

import { Badge } from "@/components/ui/Badge";import { useI18n } from "@/lib/i18n/context";
import { useCurrentLocation } from "@/providers/LocationProvider";
import { Signal, ShieldAlert, WifiOff } from "lucide-react";

export function LiveStatusIndicator() {const { t: i18nT } = useI18n();
  const { accuracy, isSpoofed, isOffline, locationSource } = useCurrentLocation();

  if (isOffline) {
    return (
      <Badge variant="danger" className="flex items-center gap-1 font-mono text-[10px] bg-red-950/80 text-red-300 border-red-800">
        <WifiOff className="w-3 h-3 animate-pulse" />
        <span>{i18nT("OFFLINE CACHE")}</span>
      </Badge>);

  }

  if (isSpoofed) {
    return (
      <Badge variant="danger" className="flex items-center gap-1 font-mono text-[10px] bg-red-950/80 text-red-300 border-red-800 animate-bounce">
        <ShieldAlert className="w-3 h-3" />
        <span>{i18nT("GPS BLOCKED: SPOOFING DETECTED")}</span>
      </Badge>);

  }

  // Signal strength based on accuracy value in meters
  let signalText = "GPS LOCK";
  let signalColor = "bg-green-950/80 text-green-300 border-green-800";
  if (accuracy !== null) {
    if (accuracy > 100) {
      signalText = "POOR GPS";
      signalColor = "bg-amber-950/80 text-amber-300 border-amber-800";
    } else if (accuracy > 30) {
      signalText = "MEDIUM LOCK";
      signalColor = "bg-yellow-950/80 text-yellow-300 border-yellow-800";
    }
  } else if (locationSource === "cached" || locationSource === "manual") {
    signalText = "MANUAL ZONE";
    signalColor = "bg-primary/20 text-primary border-primary/30";
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <Badge variant="success" className={`flex items-center gap-1 font-mono text-[10px] ${signalColor}`}>
        <Signal className="w-3 h-3" />
        <span>{signalText} {accuracy ? `(${Math.round(accuracy)}m)` : ""}</span>
      </Badge>

    </div>);

}
export default LiveStatusIndicator;
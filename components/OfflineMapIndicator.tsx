"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";

interface OfflineMapIndicatorProps {
  isSimulatedOffline: boolean;
  onToggleSimulate: () => void;
}

/**
 * Enterprise Offline Storage Status Indicator.
 * - Monitors navigator.onLine state parameters
 * - Visualizes simulated map tile cache size (IndexedDB metrics)
 * - Exposes simulation controls for QA evaluation
 */
export function OfflineMapIndicator({
  isSimulatedOffline,
  onToggleSimulate,
}: OfflineMapIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheSizeMb, setCacheSizeMb] = useState(14.8); // simulated default cache

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const activeOnlineState = isOnline && !isSimulatedOffline;

  // Add random variance to simulated offline cache sizes to feel dynamic
  useEffect(() => {
    if (!activeOnlineState) return;
    const interval = setInterval(() => {
      setCacheSizeMb((prev) => Math.min(prev + parseFloat((Math.random() * 0.1).toFixed(2)), 50.0));
    }, 12000);
    return () => clearInterval(interval);
  }, [activeOnlineState]);

  return (
    <Card className="glass-panel border-border shadow-(--shadow-luxury) backdrop-blur-md">
      <CardContent className="pt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <Typography variant="h4" className="text-base font-bold">
              Map Tile Caching Engine
            </Typography>
            <Typography variant="muted" className="text-xs">
              OpenStreetMap tile caching database status
            </Typography>
          </div>
          <Badge variant={activeOnlineState ? "success" : "danger"} className="text-xs">
            {activeOnlineState ? "🟢 Connected" : "⚠️ Offline Cache"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border">
          <div>
            <Typography variant="muted" className="text-xs block">
              Cache Storage size
            </Typography>
            <Typography variant="h3" as="span" className="text-lg font-bold gold-gradient-text">
              {cacheSizeMb.toFixed(1)} MB
            </Typography>
          </div>
          <div>
            <Typography variant="muted" className="text-xs block">
              Offline Availability
            </Typography>
            <Typography variant="h3" as="span" className="text-lg font-semibold text-foreground">
              95.4% Coverage
            </Typography>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-border">
          <Typography variant="muted" className="text-xs">
            Test offline behaviors:
          </Typography>
          <button
            onClick={onToggleSimulate}
            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
              isSimulatedOffline
                ? "bg-amber-600/20 text-amber-500 border-amber-500/50"
                : "bg-muted text-foreground border-border hover:bg-muted/70"
            }`}
          >
            {isSimulatedOffline ? "Disable Offline Simulation" : "Simulate Offline"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OfflineMapIndicator;

"use client";

import { useState } from "react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useMapInstance } from "@/providers/MapProvider";
import { Button } from "@/components/ui/Button";
import { Compass, Loader2 } from "lucide-react";
import { LocationPermissionDialog } from "./LocationPermissionDialog";
import { logger } from "@/services/logger";

export function CurrentLocationButton() {
  const { latitude, longitude, permissionStatus, requestPermission } = useCurrentLocation();
  const { flyTo } = useMapInstance();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (permissionStatus === "prompt" || permissionStatus === "denied") {
      setShowPrompt(true);
      return;
    }

    if (latitude && longitude) {
      flyTo(latitude, longitude, 15);
      logger.info(`[CurrentLocationButton] Centered map on current GPS: ${latitude}, ${longitude}`);
    }
  };

  const handleGrantPermission = async () => {
    setShowPrompt(false);
    setLoading(true);
    try {
      const success = await requestPermission();
      if (success && latitude && longitude) {
        flyTo(latitude, longitude, 15);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        disabled={loading}
        className="w-10 h-10 rounded-full glass-card border border-primary/20 bg-background/90 text-primary hover:bg-primary/10 shadow-lg flex items-center justify-center transition-all duration-300"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Compass className={`w-5 h-5 ${permissionStatus === "granted" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        )}
      </Button>

      <LocationPermissionDialog
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onGrant={handleGrantPermission}
      />
    </>
  );
}
export default CurrentLocationButton;

"use client";

import { Button } from "@/components/ui/Button";
import { useMapInstance } from "@/providers/MapProvider";
import { Plus, Minus, Maximize } from "lucide-react";
export function MapControls() {
  const { map } = useMapInstance();

  const handleZoomIn = () => {
    if (!map) return;
    map.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomOut({ duration: 300 });
  };

  const handleToggleFullscreen = () => {
    const mapContainer = map?.getContainer();
    if (!mapContainer) return;
    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch((err) => {
        console.error("Fullscreen error", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex flex-col gap-2 shadow-lg">
      <div className="flex flex-col rounded-xl overflow-hidden border border-primary/20 bg-background/95 backdrop-blur-md">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="w-10 h-10 border-0 rounded-none border-b border-border/40 text-primary hover:bg-primary/5 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="w-10 h-10 border-0 rounded-none text-primary hover:bg-primary/5 flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </Button>
      </div>


      <Button
        variant="outline"
        size="icon"
        onClick={handleToggleFullscreen}
        className="hidden md:flex w-10 h-10 rounded-xl glass-card border border-primary/20 bg-background/95 text-primary hover:bg-primary/5 items-center justify-center"
      >
        <Maximize className="w-4 h-4" />
      </Button>
    </div>
  );
}
export default MapControls;

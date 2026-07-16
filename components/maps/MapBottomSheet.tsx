"use client";

import React, { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MapBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function MapBottomSheet({ isOpen, onClose, title, children }: MapBottomSheetProps) {
  const [heightState, setHeightState] = useState<"collapsed" | "half" | "expanded">("half");

  const heightMap = {
    collapsed: "80px",
    half: "320px",
    expanded: "85vh",
  };

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const offsetThreshold = 100;
    const velocityThreshold = 400;

    if (info.velocity.y > velocityThreshold || info.offset.y > offsetThreshold) {
      // Dragging down
      if (heightState === "expanded") {
        setHeightState("half");
      } else if (heightState === "half") {
        setHeightState("collapsed");
      }
    } else if (info.velocity.y < -velocityThreshold || info.offset.y < -offsetThreshold) {
      // Dragging up
      if (heightState === "collapsed") {
        setHeightState("half");
      } else if (heightState === "half") {
        setHeightState("expanded");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-primary/20 rounded-t-[24px] shadow-2xl flex flex-col pointer-events-auto"
      style={{ height: heightMap[heightState] }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
    >
      {/* Drag Handle Bar */}
      <div className="flex flex-col items-center py-2.5 cursor-grab active:cursor-grabbing border-b border-border/40 select-none">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mb-1" />
        <div className="flex justify-between items-center w-full px-6">
          <span className="text-xs font-bold font-mono tracking-wider uppercase text-muted-foreground">
            {title || "Explorer Details"}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setHeightState((prev) => (prev === "collapsed" ? "half" : prev === "half" ? "expanded" : "half"))
              }
              className="w-6 h-6 rounded-full border-0 bg-transparent text-muted-foreground flex items-center justify-center"
            >
              {heightState === "expanded" ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="w-6 h-6 rounded-full border-0 bg-transparent text-muted-foreground flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet Content scrollable */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-none">
        {children}
      </div>
    </motion.div>
  );
}
export default MapBottomSheet;

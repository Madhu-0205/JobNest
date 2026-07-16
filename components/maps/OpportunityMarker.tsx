"use client";

import { Briefcase } from "lucide-react";

interface OpportunityMarkerProps {
  title: string;
  salaryMax?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function OpportunityMarker({ title, salaryMax, isSelected = false, onClick }: OpportunityMarkerProps) {
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center cursor-pointer group transition-all duration-300 ${
        isSelected ? "scale-110 z-30" : "hover:scale-105 z-10"
      }`}
    >
      {/* Dynamic Pulse Ring */}
      <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-green-500/10 animate-pulse" />

      {/* Main pin body */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
          isSelected
            ? "bg-green-500 border-white text-white"
            : "bg-background border-green-500 hover:border-green-600 text-green-500"
        }`}
      >
        <Briefcase className="w-5 h-5" />
      </div>

      {/* Salary Indicator Tag */}
      {salaryMax && (
        <div className="absolute -top-2 bg-green-950/90 text-green-300 border border-green-800 text-[8px] font-mono font-bold px-1 rounded-md shadow-sm whitespace-nowrap">
          ₹{salaryMax}
        </div>
      )}

      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card/95 border border-green-500/20 backdrop-blur-sm text-foreground text-[9px] font-bold py-1 px-2 rounded-lg shadow-md whitespace-nowrap pointer-events-none">
        {title}
      </div>

      {/* Arrow Indicator */}
      <div
        className={`w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b transition-colors ${
          isSelected ? "bg-green-500 border-white" : "bg-background border-green-500"
        }`}
      />
    </div>
  );
}
export default OpportunityMarker;

"use client";

import { User, Award } from "lucide-react";import { useI18n } from "@/lib/i18n/context";

interface WorkerMarkerProps {
  jobTitle: string;
  experienceYears: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function WorkerMarker({ jobTitle, experienceYears, isSelected = false, onClick }: WorkerMarkerProps) {const { t: i18nT } = useI18n();
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center cursor-pointer group transition-all duration-300 ${
      isSelected ? "scale-110 z-30" : "hover:scale-105 z-10"}`
      }>
      
      {/* Dynamic Pulsing Ripple Background */}
      <div className="absolute inset-0 w-10 h-10 -m-1 rounded-full bg-primary/20 animate-ping opacity-75" />

      {/* Main Circular Marker Icon Container */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
        isSelected ?
        "bg-primary border-primary-foreground scale-105" :
        "bg-background border-primary hover:border-primary-foreground"}`
        }>
        
        <User className={`w-5 h-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
      </div>

      {/* Floating Status Star indicator */}
      {experienceYears >= 5 &&
      <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 border border-background text-[7px] text-black font-bold p-0.5 rounded-full shadow-sm">
          <Award className="w-2.5 h-2.5" />
        </div>
      }

      {/* Hover tooltip detailing category */}
      <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card/95 border border-primary/20 backdrop-blur-sm text-foreground text-[9px] font-bold py-1 px-2 rounded-lg shadow-md whitespace-nowrap pointer-events-none">
        {jobTitle} ({experienceYears}{i18nT("yrs exp)")}
      </div>

      {/* Pointer Pin arrow */}
      <div
        className={`w-1.5 h-1.5 rotate-45 -mt-0.5 border-r border-b transition-colors ${
        isSelected ? "bg-primary border-primary-foreground" : "bg-background border-primary"}`
        } />
      
    </div>);

}
export default WorkerMarker;
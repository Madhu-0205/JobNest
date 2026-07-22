"use client";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";

interface RadiusSelectorProps {
  currentRadius: number;
  onChange: (radius: number) => void;
}

const RADIUS_OPTIONS = [
  { label: "500m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "20 km", value: 20000 },
];

export function RadiusSelector({ currentRadius, onChange }: RadiusSelectorProps) {
  const { t: i18nT } = useI18n();
  return (
    <div className="flex gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none w-full max-w-md">
      {RADIUS_OPTIONS.map((opt) => {
        const isActive = currentRadius === opt.value;
        return (
          <Button
            key={opt.value}
            variant={isActive ? "primary" : "outline"}
            size="sm"
            onClick={() => onChange(opt.value)}
            className={`text-[10px] h-7 px-3 rounded-full shrink-0 font-semibold shadow-sm transition-all duration-300 ${
              isActive
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-background/90 text-foreground border-border hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {i18nT(opt.label)}
          </Button>
        );
      })}
    </div>
  );
}
export default RadiusSelector;

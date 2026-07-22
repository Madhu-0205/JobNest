"use client";

import { useState } from "react";import { useI18n } from "@/lib/i18n/context";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { geocodeAddressAction } from "@/features/geospatial/actions";
import { useMapInstance } from "@/providers/MapProvider";
import { logger } from "@/services/logger";

interface MapSearchProps {
  onSearch: (query: string, parsedRadius?: number) => void;
  onSelectCoordinates?: (lat: number, lng: number) => void;
  placeholder?: string;
}

export function MapSearch({ onSearch, onSelectCoordinates, placeholder = "Search gigs (e.g. 'electrician within 5 km')..." }: MapSearchProps) {const { t: i18nT } = useI18n();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { flyTo } = useMapInstance();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      // Natural Language parsing helper: find numeric boundaries like "within 3 km"
      let parsedRadius: number | undefined = undefined;
      const kmMatch = input.match(/within\s+(\d+)\s*km/i);
      const mMatch = input.match(/within\s+(\d+)\s*m/i);
      if (kmMatch) {
        parsedRadius = Number(kmMatch[1]) * 1000;
      } else if (mMatch) {
        parsedRadius = Number(mMatch[1]);
      }

      // Check if query is purely an address search
      if (input.toLowerCase().includes("road") || input.toLowerCase().includes("nagar") || input.toLowerCase().includes("village") || input.toLowerCase().includes("bangalore") || input.toLowerCase().includes("guntur")) {
        const res = await geocodeAddressAction({ address: input });
        if (res.success && res.data) {
          const { latitude, longitude } = res.data;
          flyTo(latitude, longitude, 14);
          if (onSelectCoordinates) {
            onSelectCoordinates(latitude, longitude);
          }
        }
      }

      onSearch(input, parsedRadius);
    } catch {
      logger.warn("[MapSearch] Geocoding query bypassed or failed, passing query to AI matching.");
      onSearch(input);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md flex items-center gap-1.5 p-1.5 rounded-2xl glass-card border border-primary/20 bg-background/95 shadow-xl">
      <div className="relative flex-1">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={i18nT(placeholder)}
          className="w-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 text-xs py-2 pl-9 pr-2 text-foreground placeholder:text-muted-foreground" />
        
        <div className="absolute left-3 top-2.5 text-muted-foreground">
          {loading ?
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> :

          <Search className="w-4 h-4" />
          }
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        size="sm"
        className="h-8 px-4 rounded-xl flex items-center gap-1 font-bold text-xs shadow-sm bg-primary text-primary-foreground hover:bg-primary/95">
        
        <Sparkles className="w-3.5 h-3.5" />
        <span>{i18nT("Ask AI")}</span>
      </Button>
    </form>);

}
export default MapSearch;
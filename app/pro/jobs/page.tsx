"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useNearbyJobs } from "@/hooks/useNearbyJobs";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Search, Loader2, Briefcase, MapPin, Building, Star, CheckCircle2 } from "lucide-react";

export default function ProJobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <ProJobsContent />
    </Suspense>
  );
}

function ProJobsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { latitude, longitude } = useCurrentLocation();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [radiusKm, setRadiusKm] = useState(searchParams.get("radius") ? Number(searchParams.get("radius")) : 50);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const targetLat = searchParams.get("lat") ? Number(searchParams.get("lat")) : (latitude || 16.3067);
  const targetLng = searchParams.get("lng") ? Number(searchParams.get("lng")) : (longitude || 80.4365);

  const { jobs: rawJobs, loading } = useNearbyJobs(targetLat, targetLng, radiusKm * 1000);

  const opportunities = useMemo(() => {
    return rawJobs.map((job, index) => {
      const type = index % 2 === 0 ? "Full-Time" : "Contract";
      return {
        ...job,
        employer: job.employerName || "TechCorp",
        type,
        rating: 4.5
      };
    });
  }, [rawJobs]);

  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return opportunities;
    const query = searchQuery.toLowerCase();
    return opportunities.filter(j => 
      j.title.toLowerCase().includes(query) || 
      (j.employer && j.employer.toLowerCase().includes(query)) ||
      (j.description && j.description.toLowerCase().includes(query))
    );
  }, [opportunities, searchQuery]);

  const handleApply = (id: string) => {
    setAppliedIds(prev => [...prev, id]);
    setSuccessMsg("Application successfully submitted!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  if (!user) return null;

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16 relative">
        
        {successMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-emerald-950/95 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Typography variant="h2" className="font-extrabold text-foreground">Professional Opportunities</Typography>
          <Typography variant="muted" className="text-sm">Discover careers tailored to your professional profile.</Typography>
        </div>

        <Card className="glass-panel border-white/10 p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by role, company, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Radius (km):</span>
            <input
              type="number"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-20 bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="glass-panel border-dashed border-white/10 text-center py-20 flex flex-col items-center gap-3">
              <Briefcase className="w-10 h-10 text-muted-foreground opacity-50" />
              <Typography variant="h4" className="font-bold">No opportunities found</Typography>
              <Typography variant="muted" className="text-sm">Try adjusting your search query or expanding the radius.</Typography>
            </Card>
          ) : (
            filteredJobs.map(job => {
              const isApplied = appliedIds.includes(job.id);
              return (
                <Card key={job.id} className="glass-panel border-white/10 hover:border-indigo-500/40 transition-colors bg-black/10">
                  <CardContent className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Typography variant="h3" className="font-bold text-lg">{job.title}</Typography>
                        <Badge variant="secondary" className="text-[10px] bg-indigo-500/20 text-indigo-300 border-indigo-500/30">{job.type}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground"><Building className="w-3.5 h-3.5" /> {job.employer}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {Math.round(job.distanceMeters / 100) / 10} km away</span>
                        <span className="flex items-center gap-1 text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /> {job.rating}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between shrink-0 gap-3 border-t sm:border-t-0 border-border/10 pt-4 sm:pt-0">
                      <span className="text-lg font-bold text-foreground font-mono whitespace-nowrap">₹{job.salaryMin} - ₹{job.salaryMax}</span>
                      <Button
                        variant={isApplied ? "outline" : "primary"}
                        className={`w-full sm:w-auto font-bold ${isApplied ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                        onClick={() => handleApply(job.id)}
                        disabled={isApplied}
                      >
                        {isApplied ? "Applied" : "Apply Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ProductShell>
  );
}

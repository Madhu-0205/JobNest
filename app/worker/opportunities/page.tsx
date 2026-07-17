"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useNearbyJobs, NearbyJob } from "@/hooks/useNearbyJobs";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Shield,
  Star,
  Bookmark,
  Search,
  SlidersHorizontal,
  List,
  Map,
  Scale,
  Calendar,
  X,
  Briefcase,
  AlertCircle,
  Loader2,
  Check,
  CheckCircle2
} from "lucide-react";

// Lazy load MapView
const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-2xl overflow-hidden border border-border/40 shadow-luxury bg-black/10 flex flex-col items-center justify-center gap-3 min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-muted-foreground">Loading active neighborhood map...</span>
      </div>
    ),
  }
);

// Static Employer Directory matching to simulate a production database query
const EMPLOYERS = [
  { name: "Suresh Woodworks", rating: 4.9, trust: 98 },
  { name: "Guntur Agricultural Coop", rating: 4.8, trust: 95 },
  { name: "Andhra Greenhouses Ltd", rating: 4.7, trust: 92 },
  { name: "Apex Electricals", rating: 4.6, trust: 94 },
  { name: "City Sanitization Corp", rating: 4.5, trust: 89 },
  { name: "Sai Plumbing Solutions", rating: 4.8, trust: 97 }
];

interface ExtendedJob extends NearbyJob {
  employer: string;
  rating: number;
  trustScore: number;
  urgency: "high" | "medium" | "low";
  duration: string;
  type: "Gig" | "Part Time" | "Full Time";
  timing: "Today" | "Tomorrow" | "Flexible";
  skillsNeeded: string[];
  category: string;
}

export default function NearbyOpportunitiesPage() {
  const { user } = useAuth();
  const { latitude, longitude } = useCurrentLocation();

  // Map vs List view mode on mobile
  const [viewMode, setViewMode] = useState<"split" | "map" | "list">("split");
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "salary" | "rating" | "trust">("distance");
  
  // Filters panel values
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTiming, setFilterTiming] = useState<string>("all");
  const [filterMinSalary] = useState<number>(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyHighTrust, setOnlyHighTrust] = useState(false);
  const [onlyAiRecommended, setOnlyAiRecommended] = useState(false);

  // Interaction States
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<ExtendedJob | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch jobs dynamically based on radius
  const { jobs: rawJobs, loading: rawLoading } = useNearbyJobs(
    latitude || 16.3067, // Default Guntur Lat
    longitude || 80.4365, // Default Guntur Lng
    radiusKm * 1000 // radius in meters
  );



  // Enrich raw database opportunities with UX metadata
  const opportunities = useMemo<ExtendedJob[]>(() => {
    return rawJobs.map((job, index) => {
      const employerInfo = EMPLOYERS[index % EMPLOYERS.length];
      const categories = ["Carpenter", "Plumber", "Electrician", "Agricultural Worker", "AC Technician"];
      const category = categories[index % categories.length];
      const types: ("Gig" | "Part Time" | "Full Time")[] = ["Gig", "Part Time", "Full Time"];
      const timings: ("Today" | "Tomorrow" | "Flexible")[] = ["Today", "Tomorrow", "Flexible"];
      const urgencies: ("high" | "medium" | "low")[] = ["high", "medium", "low"];

      return {
        ...job,
        employer: employerInfo.name,
        rating: employerInfo.rating,
        trustScore: employerInfo.trust,
        category,
        type: types[index % types.length],
        timing: timings[index % timings.length],
        urgency: urgencies[index % urgencies.length],
        duration: index % 2 === 0 ? "4 Hours" : "2 Days",
        skillsNeeded: [category, "Tools handling", "Punctual SLA"],
      };
    });
  }, [rawJobs]);

  // Actions
  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = (id: string) => {
    if (appliedIds.includes(id)) return;
    setAppliedIds((prev) => [...prev, id]);
    setSuccessMsg("Instant application sent! Keep your chat active.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        setSuccessMsg("You can compare up to 3 jobs side-by-side.");
        setTimeout(() => setSuccessMsg(null), 3000);
        return prev;
      }
      return [...prev, id];
    });
  };

  // Perform search & filters locally
  const filteredJobs = useMemo(() => {
    return opportunities.filter((job) => {
      // Natural Language Search Match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesDesc = job.description?.toLowerCase().includes(query) || false;
        const matchesEmployer = job.employer.toLowerCase().includes(query);
        const matchesCategory = job.category?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDesc && !matchesEmployer && !matchesCategory) {
          return false;
        }
      }

      // Radius check is handled directly by useNearbyJobs hook
      // Category chips filter
      if (selectedCategory !== "all" && job.category !== selectedCategory) {
        return false;
      }

      // Sidebar Filters
      if (filterType !== "all" && job.type !== filterType) return false;
      if (filterTiming !== "all" && job.timing !== filterTiming) return false;
      if (filterMinSalary > 0 && job.salaryMin < filterMinSalary) return false;
      if (onlyVerified && job.trustScore < 90) return false;
      if (onlyHighTrust && job.rating < 4.6) return false;

      // AI Matching validation
      if (onlyAiRecommended) {
        const hasMatchingSkill = user?.skills?.includes(job.category || "");
        if (!hasMatchingSkill) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "distance") return a.distanceMeters - b.distanceMeters;
      if (sortBy === "salary") return b.salaryMax - a.salaryMax;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "trust") return b.trustScore - a.trustScore;
      return 0;
    });
  }, [opportunities, searchQuery, selectedCategory, filterType, filterTiming, filterMinSalary, onlyVerified, onlyHighTrust, onlyAiRecommended, sortBy, user?.skills]);

  const comparedJobs = useMemo(() => {
    return opportunities.filter((j) => compareIds.includes(j.id));
  }, [opportunities, compareIds]);

  // Categories list based on user's skillset
  const CATEGORIES = ["Carpenter", "Plumber", "Electrician", "Agricultural Worker", "AC Technician"];

  if (!user) return null;

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16 relative">
        
        {/* ── ALERTS BANNER ────────────────────────────────────────── */}
        {successMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-emerald-950/95 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <Typography variant="h2" className="font-extrabold gold-gradient-text">Hyperlocal Neighborhood Gigs</Typography>
            <Typography variant="muted" className="text-xs">
              Discover verified customer gigs and immediate hourly jobs in your current geofence radius.
            </Typography>
          </div>

          {/* View toggle (desktop is split-screen, mobile toggles) */}
          <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-xl border border-border/40 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setViewMode("split")}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "split" ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Split Screen</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "list" ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Mode</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "map" ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map Mode</span>
            </button>
          </div>
        </div>

        {/* ── SEARCH & FILTERING BAR ─────────────────────────────────── */}
        <Card className="glass-panel border-border p-4.5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search gigs (e.g. 'Electrician near me', 'Carpentry')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/25 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sidebar toggle and Sort */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={`border text-xs py-2.5 px-4 rounded-xl cursor-pointer ${
                  showFilters ? "bg-amber-600/25 border-amber-500 text-amber-300" : "border-border/40 hover:bg-muted"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-1.5 text-amber-500" />
                <span>Filters</span>
              </Button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "distance" | "salary" | "rating" | "trust")}
                className="bg-black/25 border border-border/40 text-xs rounded-xl px-3 py-2.5 text-foreground cursor-pointer focus:outline-hidden"
              >
                <option value="distance">Sort by Distance</option>
                <option value="salary">Sort by Salary</option>
                <option value="rating">Sort by Payer Rating</option>
                <option value="trust">Sort by Trust Score</option>
              </select>
            </div>
          </div>

          {/* Category Chips Selection */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                  : "bg-black/20 text-muted-foreground border border-border/20 hover:text-foreground"
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                    : "bg-black/20 text-muted-foreground border border-border/20 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Collapsible Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 border-t border-border/20 pt-4 text-xs">
              
              {/* Radius slider */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-muted-foreground flex justify-between">
                  <span>Work Radius Limit:</span>
                  <span className="text-amber-500 font-mono font-bold">{radiusKm} Km</span>
                </span>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Job Type select */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-muted-foreground">Gig Arrangement:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-black/25 border border-border/40 rounded-lg p-2 text-foreground focus:outline-hidden"
                >
                  <option value="all">Any arrangement type</option>
                  <option value="Gig">One-day Gigs</option>
                  <option value="Part Time">Part Time contracts</option>
                  <option value="Full Time">Full Time employment</option>
                </select>
              </div>

              {/* Timing select */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-muted-foreground">Job SLA Timeline:</span>
                <select
                  value={filterTiming}
                  onChange={(e) => setFilterTiming(e.target.value)}
                  className="bg-black/25 border border-border/40 rounded-lg p-2 text-foreground focus:outline-hidden"
                >
                  <option value="all">Any start time</option>
                  <option value="Today">Immediate (Today)</option>
                  <option value="Tomorrow">Next Day (Tomorrow)</option>
                  <option value="Flexible">Flexible schedule</option>
                </select>
              </div>

              {/* Toggle switch controls */}
              <div className="flex flex-col gap-2 justify-center">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span>Verified Employers Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={onlyHighTrust}
                    onChange={(e) => setOnlyHighTrust(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span>High Trust Gigs Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={onlyAiRecommended}
                    onChange={(e) => setOnlyAiRecommended(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span className="flex items-center gap-1 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-500/20" />
                    AI Recommended (Skills Match)
                  </span>
                </label>
              </div>

            </div>
          )}
        </Card>

        {/* ── DUAL CONTENT VIEWPORT ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-[500px]">
          
          {/* MAP DISPLAY */}
          <div
            className={`transition-all duration-300 ${
              viewMode === "split" ? "lg:col-span-1 border-r border-border/10 pr-2" : viewMode === "map" ? "lg:col-span-3" : "hidden"
            }`}
          >
            <Card className="glass-panel border-border shadow-luxury overflow-hidden h-full flex flex-col min-h-[350px]">
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  Live Geofenced Gigs Radar
                </CardTitle>
                <CardDescription className="text-xs">
                  Coordinates overlay map displaying customer sites.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative">
                <MapView mode="worker" onSelectEntity={(id) => {
                  const job = opportunities.find((j) => j.id === id);
                  if (job) setSelectedJob(job);
                }} />
              </CardContent>
            </Card>
          </div>

          {/* LIST DISPLAY */}
          <div
            className={`transition-all duration-300 flex flex-col gap-4 ${
              viewMode === "split" ? "lg:col-span-2" : viewMode === "list" ? "lg:col-span-3" : "hidden"
            }`}
          >
            {rawLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                <span className="text-sm text-muted-foreground">Probing regional database for active jobs...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              /* ── EMPTY STATE ── */
              <Card className="glass-panel border-dashed border-border/40 text-center py-20 flex flex-col items-center justify-center gap-3 h-full">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <Typography variant="h3" className="font-bold text-base">No Opportunities Found Nearby</Typography>
                  <Typography variant="muted" className="text-xs max-w-sm mx-auto mt-1.5 leading-normal">
                    No active postings match your search filters in Guntur central. Expand your work radius in filters, clear your query, or register additional skills.
                  </Typography>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setRadiusKm(25);
                      setFilterType("all");
                      setFilterTiming("all");
                    }}
                    className="border border-border/40 text-xs cursor-pointer"
                  >
                    Clear Filter Rules
                  </Button>
                </div>
              </Card>
            ) : (
              /* Opportunity List feed */
              <div className="flex flex-col gap-3">
                {filteredJobs.map((job) => {
                  const isSaved = bookmarkedIds.includes(job.id);
                  const isApplied = appliedIds.includes(job.id);
                  const isCompareSelected = compareIds.includes(job.id);

                  return (
                    <div
                      key={job.id}
                      className={`glass-panel border p-4.5 rounded-2xl flex flex-col justify-between gap-4 transition-all hover:border-amber-500/40 hover:shadow-luxury cursor-pointer ${
                        isApplied ? "border-emerald-500/30 bg-emerald-950/5" : "border-border/40 bg-black/10"
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Typography variant="h4" className="font-bold text-base text-foreground">{job.title}</Typography>
                            <Badge variant="secondary" className="text-[8px] font-bold uppercase">{job.type}</Badge>
                            {job.urgency === "high" && (
                              <Badge variant="danger" className="text-[8px] bg-red-950/60 border border-red-500/30 text-red-400 font-bold">Urgent</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-semibold text-foreground">{job.employer}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-semibold text-foreground">{job.rating}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span>{Math.round(job.distanceMeters / 100) / 10} Km away</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-amber-500" />
                              <span className="font-bold text-amber-400 font-mono text-[10px]">{job.trustScore}% Trust</span>
                            </span>
                          </div>
                        </div>

                        {/* Salary and duration block */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                          <span className="text-lg font-black text-amber-500 font-mono">₹{job.salaryMin} - ₹{job.salaryMax}</span>
                          <span className="text-[10px] text-muted-foreground block">Fixed Rate • {job.duration}</span>
                        </div>
                      </div>

                      {/* AI Explain tag */}
                      <p className="bg-amber-950/15 border border-amber-500/10 rounded-xl p-2.5 text-[11px] text-amber-400 leading-normal flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          Recommended: Matches your {job.category} background. Close distance ({Math.round(job.distanceMeters / 100) / 10} Km) enables rapid arrival.
                        </span>
                      </p>

                      {/* Card actions */}
                      <div className="flex items-center justify-between border-t border-border/10 pt-3 flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1.5">
                          {job.skillsNeeded.map((sk) => (
                            <Badge key={sk} variant="secondary" className="text-[8px] px-1.5 py-0.5">{sk}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Compare selection checkbox */}
                          <label className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold border border-border/40 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isCompareSelected}
                              onChange={() => handleToggleCompare(job.id)}
                              className="accent-amber-500"
                            />
                            <span>Compare</span>
                          </label>

                          {/* Bookmark trigger */}
                          <button
                            onClick={() => handleToggleBookmark(job.id)}
                            className="p-1.5 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            aria-label="Bookmark opportunity details"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
                          </button>

                          {/* Quick Apply button */}
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isApplied}
                            onClick={() => handleApply(job.id)}
                            className={`px-4.5 cursor-pointer font-bold ${
                              isApplied
                                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                                : "bg-amber-600 hover:bg-amber-700 text-background"
                            }`}
                          >
                            {isApplied ? "Applied" : "Quick Apply"}
                          </Button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── COMPARE FLOATING BOARD ────────────────────────────────── */}
        {compareIds.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-amber-500/30 backdrop-blur-lg rounded-2xl shadow-luxury p-4.5 w-[90%] max-w-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-border/20 pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>Job Comparison Deck ({compareIds.length} of 3)</span>
              </span>
              <button
                onClick={() => setCompareIds([])}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {comparedJobs.map((cj) => (
                <div key={cj.id} className="bg-card/50 border border-border/40 rounded-xl p-2.5 text-[10px] flex flex-col justify-between gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-foreground truncate">{cj.title}</span>
                    <span className="text-muted-foreground block truncate">{cj.employer}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 bg-black/20 p-2 rounded-lg border border-border/20 font-semibold text-muted-foreground font-mono">
                    <span className="text-amber-500 font-bold">₹{cj.salaryMin} - ₹{cj.salaryMax}</span>
                    <span>{Math.round(cj.distanceMeters / 100) / 10} Km away</span>
                    <span>{cj.rating} ★ ({cj.trustScore}% Trust)</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={appliedIds.includes(cj.id)}
                    onClick={() => handleApply(cj.id)}
                    className="w-full text-[9px] py-1 cursor-pointer font-bold"
                  >
                    {appliedIds.includes(cj.id) ? "Applied" : "Apply Now"}
                  </Button>
                </div>
              ))}
              {Array.from({ length: 3 - comparedJobs.length }).map((_, idx) => (
                <div key={idx} className="border border-dashed border-border/20 rounded-xl flex items-center justify-center p-4 text-[10px] text-muted-foreground text-center">
                  Select another gig to compare
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OPPORTUNITY DETAIL DRAWER / SIDE SHEET ──────────────────── */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
            {/* Backdrop close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedJob(null)} />
            
            {/* Sheet content */}
            <div className="relative w-full max-w-lg md:max-w-md bg-zinc-950 border-l border-border/40 shadow-luxury h-full flex flex-col justify-between p-6">
              
              <div className="flex flex-col gap-5 overflow-y-auto pr-1">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedJob(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg cursor-pointer"
                  aria-label="Close detail panel"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col gap-1.5 pt-4">
                  <Badge variant="primary" className="bg-amber-500/10 border-amber-500/30 text-amber-400 self-start text-[8px] font-extrabold uppercase">
                    {selectedJob.category} Opportunity
                  </Badge>
                  <Typography variant="h3" className="font-extrabold text-lg text-foreground leading-snug">
                    {selectedJob.title}
                  </Typography>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selectedJob.employer}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="font-bold text-foreground">{selectedJob.rating}</span>
                    </span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3 bg-black/35 rounded-2xl border border-border/40 p-4 text-xs">
                  <div className="flex flex-col gap-1 pr-2 border-r border-border/20">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Estimated Payout</span>
                    <span className="text-base font-black text-amber-500 font-mono">₹{selectedJob.salaryMin} - ₹{selectedJob.salaryMax}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Work Radius</span>
                    <span className="text-base font-bold text-foreground font-mono">{Math.round(selectedJob.distanceMeters / 100) / 10} Km</span>
                  </div>
                </div>

                {/* Job Description details */}
                <div className="flex flex-col gap-2 border-b border-border/10 pb-4">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    About This Gig Arrangement
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedJob.description || "Looking for an experienced specialist to coordinate work on-site immediately. Must have own tools and be certified on the registry."}
                  </p>
                </div>

                {/* Requirement list */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Timeline & Arrangement Parameters
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary" className="px-2.5 py-1">Timeline: {selectedJob.timing}</Badge>
                    <Badge variant="secondary" className="px-2.5 py-1">Expected Duration: {selectedJob.duration}</Badge>
                    <Badge variant="secondary" className="px-2.5 py-1">Arrangement: {selectedJob.type}</Badge>
                  </div>
                </div>

                {/* AI Explanation details */}
                <Card className="bg-amber-950/10 border-amber-500/20 shadow-luxury">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      AI Matching Credentials Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-muted-foreground flex flex-col gap-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span><strong>Skills Matrix match:</strong> Category {selectedJob.category} matches your worker profile selection.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span><strong>Payer Credential:</strong> Employer has a verified Aadhaar status and {selectedJob.trustScore}% trust rating.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span><strong>Proximity factor:</strong> Job site is within your work radius preferences.</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Drawer footer actions */}
              <div className="flex items-center gap-3 border-t border-border/20 pt-4 bg-zinc-950" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleBookmark(selectedJob.id)}
                  className="flex items-center justify-center border border-border/40 hover:bg-muted p-3.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  aria-label="Bookmark opportunity details"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(selectedJob.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                </button>
                
                <Button
                  variant="primary"
                  disabled={appliedIds.includes(selectedJob.id)}
                  onClick={() => handleApply(selectedJob.id)}
                  className={`flex-1 py-3.5 cursor-pointer font-bold rounded-xl text-xs ${
                    appliedIds.includes(selectedJob.id)
                      ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-400"
                      : "bg-amber-600 hover:bg-amber-700 text-background"
                  }`}
                >
                  {appliedIds.includes(selectedJob.id) ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Application Submitted
                    </span>
                  ) : (
                    "Apply & Connect Instantly"
                  )}
                </Button>
              </div>

            </div>
          </div>
        )}

      </div>
    </ProductShell>
  );
}

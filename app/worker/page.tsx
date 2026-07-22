"use client";

import { useState, useMemo } from "react";import { useI18n } from "@/lib/i18n/context";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  MapPin,
  Wallet,
  MessageSquare,
  User,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Sun,
  Activity,
  Filter,
  Loader2,
  Star,
  Bookmark,
  CheckSquare,
  AlertCircle,
  Check } from
"lucide-react";
import { useNearbyJobs } from "@/hooks/useNearbyJobs";
import { applyOpportunityAction } from "@/features/opportunity/actions";

// Lazy load MapView
const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () =>
    <div className="w-full h-[320px] md:h-[400px] rounded-3xl overflow-hidden border border-border/40 shadow-luxury bg-black/10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-muted-foreground">Loading Guntur geofence map layers...</span>
      </div>

  }
);

interface HyperlocalJob {
  id: string;
  title: string;
  employer: string;
  distance: number; // in Km
  salary: number; // in INR
  rating: number; // employer rating
  skills: string[];
  recommendedReason: string;
  saved: boolean;
  applied: boolean;
  category: string;
}

export default function WorkerDashboardPage() {const { t: i18nT } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { latitude, longitude } = useCurrentLocation();

  // Component States
  const { jobs: fetchedJobs, loading: isNearbyLoading, error: nearbyError } = useNearbyJobs(
    latitude,
    longitude,
    15000 // 15km
  );

  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [availabilityActive, setAvailabilityActive] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLoading = isNearbyLoading;

  // Weather simulation state
  const weatherTemp = 32;
  const weatherCondition = "Sunny";

  const jobs = useMemo<HyperlocalJob[]>(() => {
    return fetchedJobs.map((j, index) => {
      const distanceKm = Number((j.distanceMeters / 1000).toFixed(1));
      const categories = ["Carpenter", "Plumber", "Electrician", "Agricultural Worker", "AC Technician"];
      const category = categories[index % categories.length];

      return {
        id: j.id,
        title: j.title,
        employer: j.district ? `${j.district} Partner` : "Local Employer",
        distance: distanceKm,
        salary: j.salaryMax || j.salaryMin || 1000,
        rating: 4.8,
        skills: [category],
        recommendedReason: `Located ${distanceKm} km away. Matches your dashboard matching preferences.`,
        saved: bookmarkedIds.includes(j.id),
        applied: appliedIds.includes(j.id),
        category: category
      };
    });
  }, [fetchedJobs, appliedIds, bookmarkedIds]);

  if (!user) return null;

  // Actions
  const handleToggleAvailability = () => {
    setAvailabilityActive(!availabilityActive);
    setSuccessMsg(
      availabilityActive ?
      "Go Offline: Your profile is temporarily hidden from nearby customers." :
      "Go Online: hyperlocals can now request your services on the live map!"
    );
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleApply = async (id: string) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    try {
      const result = await applyOpportunityAction({
        opportunityId: id,
        coverLetter: `I am interested in this position and available to start immediately.`,
        expectedSalary: Number(target.salary)
      });
      if (result.success) {
        setAppliedIds((prev) => [...prev, id]);
        setSuccessMsg("Application successfully registered on the double-entry escrow ledger!");
      } else {
        setErrorMsg(result.error?.message || "Failed to submit application.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit application.";
      setErrorMsg(message);
    } finally {
      setTimeout(() => {setSuccessMsg(null);setErrorMsg(null);}, 3500);
    }
  };

  const handleToggleSave = (id: string) => {
    setBookmarkedIds((prev) =>
    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Derived feeds
  const filteredJobs = jobs.filter((job) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "recommended") {
      // Return jobs matching at least one of the worker's skills
      return user.skills ? job.skills.some((s) => user.skills?.includes(s)) : true;
    }
    return job.category === selectedFilter;
  });

  const activeApplications = jobs.filter((j) => j.applied);

  // Skill options list
  const workerSkills = user.skills || ["Carpenter", "Plumber", "Electrician"];

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
        
        {/* ── NOTIFICATIONS BANNER ─────────────────────────────────── */}
        {successMsg &&
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          </div>
        }

        {(errorMsg || nearbyError) &&
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-red-950/90 border border-red-500/30 text-red-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg || nearbyError}</span>
            </div>
          </div>
        }

        {/* ── HERO BANNER SECTION ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center bg-linear-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="lg:col-span-2 flex items-center gap-4 md:gap-6">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-amber-500 shadow-luxury">
              <AvatarFallback className="bg-amber-500/10 text-amber-500 font-bold text-xl md:text-2xl">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="h2" className="text-xl md:text-2xl font-black text-foreground tracking-tight">{i18nT("Good Morning,")}
                  {user.name}!
                </Typography>
                <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">{i18nT("Online Pro")}

                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold text-foreground">
                    {latitude && longitude ? "Guntur (Live GPS)" : "Guntur Central"}
                  </span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>{weatherTemp}{i18nT("°C •")}{weatherCondition}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-3 bg-black/35 rounded-2xl border border-border/40 p-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-muted-foreground block tracking-wider">{i18nT("Today's Goal")}</span>
              <span className="text-lg font-bold font-mono text-amber-500">₹{user.expectedDailyEarnings || 1500}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-muted-foreground block tracking-wider">{i18nT("Hyperlocal Radius")}</span>
              <span className="text-lg font-bold font-mono text-foreground">{user.workRadius || 10}{i18nT("Km")}</span>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS BAR ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/worker/opportunities")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl text-xs py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            
            <Filter className="w-4 h-4 text-amber-500" />
            <span>{i18nT("Find Jobs")}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleToggleAvailability}
            className={`border rounded-xl text-xs py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
            availabilityActive ?
            "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40" :
            "bg-red-950/20 border-red-500/20 text-red-400 hover:bg-red-950/40"}`
            }>
            
            <Activity className="w-4 h-4" />
            <span>{availabilityActive ? "Active: Online" : "Paused: Offline"}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push("/wallet")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl text-xs py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            
            <Wallet className="w-4 h-4 text-amber-500" />
            <span>{i18nT("Open Wallet")}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push("/messages")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl text-xs py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm">
            
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span>{i18nT("Messages")}</span>
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push("/profile")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl text-xs py-3 font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm col-span-2 sm:col-span-1">
            
            <User className="w-4 h-4 text-amber-500" />
            <span>{i18nT("My Profile")}</span>
          </Button>
        </div>

        {/* ── MAIN WORKSPACE GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLUMNS: Map hero & opportunities feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Live Map Hero */}
            <Card className="glass-panel border-border shadow-luxury overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold gold-gradient-text">{i18nT("Live Neighborhood Gig Map")}</CardTitle>
                  <CardDescription className="text-xs">{i18nT("Real-time match opportunities around your current GPS coordinates.")}

                  </CardDescription>
                </div>
                <Badge variant="primary" className="text-[10px] font-bold">
                  {filteredJobs.length}{i18nT("Gigs Mapped")}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <MapView mode="worker" jobs={fetchedJobs} />
              </CardContent>
            </Card>

            {/* Hyperlocal Opportunities Feed */}
            <div id="hyperlocal-jobs-feed" className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Typography variant="h3" className="font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />{i18nT("Hyperlocal Opportunity Feed")}

                  </Typography>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedFilter === "all" ?
                    "bg-amber-600/20 text-amber-300 border-amber-500" :
                    "border-border/40 hover:bg-muted text-muted-foreground"}`
                    }>{i18nT("All Jobs")}


                  </button>
                  <button
                    onClick={() => setSelectedFilter("recommended")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedFilter === "recommended" ?
                    "bg-amber-600/20 text-amber-300 border-amber-500" :
                    "border-border/40 hover:bg-muted text-muted-foreground"}`
                    }>{i18nT("AI Suggested")}


                  </button>
                  {workerSkills.map((sk) =>
                  <button
                    key={sk}
                    onClick={() => setSelectedFilter(sk)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedFilter === sk ?
                    "bg-amber-600/20 text-amber-300 border-amber-500" :
                    "border-border/40 hover:bg-muted text-muted-foreground"}`
                    }>
                    
                      {sk}
                    </button>
                  )}
                </div>
              </div>

              {/* Skeletons Loading State */}
              {isLoading ?
              <div className="flex flex-col gap-3">
                  {Array.from({ length: 2 }).map((_, idx) =>
                <div key={idx} className="w-full h-32 rounded-2xl border border-border/40 bg-black/10 animate-pulse p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          <div className="w-48 h-4.5 bg-border/40 rounded" />
                          <div className="w-32 h-3.5 bg-border/40 rounded" />
                        </div>
                        <div className="w-16 h-6 bg-border/40 rounded" />
                      </div>
                      <div className="w-full h-8 bg-border/40 rounded-xl" />
                    </div>
                )}
                </div> :
              filteredJobs.length === 0 ? (
              /* ── EMPTY STATE ── */
              <Card className="glass-panel border-dashed border-border/40 text-center py-10 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <Typography variant="h4" className="font-bold text-sm">{i18nT("No Nearby Gigs Match Filters")}</Typography>
                    <Typography variant="muted" className="text-xs max-w-sm mx-auto mt-1 leading-normal">{i18nT("Update your skills directory or expand your hyperlocal work radius in settings to find more customer gigs.")}

                  </Typography>
                  </div>
                  <Button
                  variant="ghost"
                  onClick={() => {setSelectedFilter("all");}}
                  className="border border-border/40 text-xs mt-1 cursor-pointer">{i18nT("Reset Filter")}


                </Button>
                </Card>) : (

              /* Gigs Card Feed */
              <div className="flex flex-col gap-3">
                  {filteredJobs.map((job) =>
                <div
                  key={job.id}
                  onClick={() => router.push(`/worker/opportunities/${job.id}`)}
                  className={`glass-panel border p-4.5 rounded-2xl flex flex-col justify-between gap-4 transition-all hover:border-amber-500/40 hover:shadow-luxury cursor-pointer ${
                  job.applied ? "border-emerald-500/30 bg-emerald-950/5" : "border-border/40 bg-black/10"}`
                  }>
                  
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Typography variant="h4" className="font-bold text-base text-foreground">{job.title}</Typography>
                            {user.skills?.includes(job.category) &&
                        <Badge variant="primary" className="text-[8px] font-bold bg-amber-500/10 border-amber-500/30 text-amber-400">{i18nT("Match")}</Badge>
                        }
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span>{job.employer}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="font-semibold text-foreground">{job.rating}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span>{job.distance}{i18nT("Km away")}</span>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                          <span className="text-lg font-black text-amber-500 font-mono">₹{job.salary}</span>
                          <span className="text-[10px] text-muted-foreground">{i18nT("Fixed Hyperlocal SLA")}</span>
                        </div>
                      </div>

                      {/* AI Explain why matches */}
                      <p className="bg-amber-950/15 border border-amber-500/10 rounded-xl p-2.5 text-[11px] text-amber-400 leading-normal flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                        <span>{job.recommendedReason}</span>
                      </p>

                      <div className="flex items-center justify-between border-t border-border/10 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.map((s) =>
                      <Badge key={s} variant="secondary" className="text-[9px] px-2 py-0.5">{s}</Badge>
                      )}
                        </div>
                        
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                        onClick={() => handleToggleSave(job.id)}
                        className="p-2 rounded-lg border border-border/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        aria-label={i18nT("Save this gig for later reference")}>
                        
                            <Bookmark className={`w-4 h-4 ${job.saved ? "fill-amber-500 text-amber-500" : ""}`} />
                          </button>
                          
                          <Button
                        variant="primary"
                        size="sm"
                        disabled={job.applied}
                        onClick={() => handleApply(job.id)}
                        className={`px-4.5 cursor-pointer font-bold ${
                        job.applied ?
                        "bg-emerald-950/60 border-emerald-500/30 text-emerald-400" :
                        "bg-amber-600 hover:bg-amber-700 text-background"}`
                        }>
                        
                            {job.applied ?
                        <span className="flex items-center gap-1 text-xs">
                                <Check className="w-3.5 h-3.5" />{i18nT("Applied")}

                        </span> :

                        "Apply & Chat"
                        }
                          </Button>
                        </div>
                      </div>
                    </div>
                )}
                </div>)
              }
            </div>
          </div>

          {/* RIGHT COLUMN: Wallet summary, Trust score, applications, messages */}
          <div className="flex flex-col gap-6">
            
            {/* Wallet Summary */}
            <Card className="glass-panel border-border shadow-luxury">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold gold-gradient-text">{i18nT("My Wallet Vault")}</CardTitle>
                  <CardDescription className="text-xs">{i18nT("Hyperlocal double-entry currency ledgers.")}</CardDescription>
                </div>
                <Wallet className="w-5 h-5 text-amber-500" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="bg-black/25 rounded-2xl border border-border/40 p-4 text-center">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">{i18nT("Active Credentials Balance")}</span>
                  <span className="text-2xl font-black text-amber-500 font-mono">₹{user.walletBalance}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-border/10 pt-3">
                  <span className="text-muted-foreground">{i18nT("Expected payout rate:")}</span>
                  <span className="font-bold text-foreground">₹{user.expectedDailyEarnings || 1200}{i18nT("/day")}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/wallet")}
                  className="w-full border border-border/40 text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer mt-1">
                  
                  <span>{i18nT("Deposit / Settlement Payouts")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>

            {/* Trust Score & Aadhaar badge */}
            <Card className="glass-panel border-border shadow-luxury">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold gold-gradient-text">{i18nT("Trust Score Registry")}</CardTitle>
                  <CardDescription className="text-xs">{i18nT("Dynamic credentials status.")}</CardDescription>
                </div>
                <Shield className="w-5 h-5 text-amber-500" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground font-mono">96%</span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{i18nT("Hyperlocal Score")}</span>
                  </div>
                  <Badge variant={user.kycStatus === "verified" ? "success" : "warning"} className="text-[10px]">
                    {user.kycStatus === "verified" ? "KYC Approved" : "Verification Pending"}
                  </Badge>
                </div>
                
                {user.kycStatus === "verified" ?
                <p className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5 leading-normal flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{i18nT("Your Aadhaar card has been cryptographically validated on the trust ledger. Verification badge is active.")}</span>
                  </p> :

                <p className="text-[11px] text-amber-400 bg-amber-950/20 border border-amber-500/20 rounded-xl p-2.5 leading-normal flex items-start gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{i18nT("Aadhaar validation pending. Please ensure your ID upload matches your profile name exactly to unlock verification badges.")}</span>
                  </p>
                }
              </CardContent>
            </Card>

            {/* Active Applications */}
            <Card className="glass-panel border-border shadow-luxury">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-500" />{i18nT("Active Applications")}

                </CardTitle>
                <CardDescription className="text-xs">{i18nT("Jobs you applied for in the Guntur area.")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {activeApplications.length === 0 ? (
                /* Applications Empty State */
                <div className="text-center py-4 border border-dashed border-border/40 rounded-xl bg-black/5">
                    <span className="text-xs text-muted-foreground block">{i18nT("No active applications")}</span>
                    <button
                    onClick={() => handleApply("job-1")}
                    className="text-[10px] text-amber-500 font-bold mt-1.5 hover:underline cursor-pointer">{i18nT("Quick Apply to Suresh K. (Carpenter)")}


                  </button>
                  </div>) :

                activeApplications.map((app) =>
                <div key={app.id} className="border border-border/40 rounded-xl p-3 bg-black/15 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">{app.title}</span>
                        <Badge variant="secondary" className="text-[8px] font-bold">{i18nT("In Review")}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/10 pt-2 mt-1">
                        <span>{i18nT("Payer:")}{app.employer.split(" ")[0]}</span>
                        <span className="font-black text-amber-500 font-mono">₹{app.salary}</span>
                      </div>
                    </div>
                )
                }
              </CardContent>
            </Card>

            {/* Recent Messages */}
            <Card className="glass-panel border-border shadow-luxury">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-500" />{i18nT("Hyperlocal Chat Logs")}

                </CardTitle>
                <CardDescription className="text-xs">{i18nT("Direct messages on Guntur active threads.")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div
                  onClick={() => router.push("/messages")}
                  className="border border-border/40 hover:border-amber-500/30 rounded-xl p-3 bg-black/15 cursor-pointer flex flex-col gap-1 transition-all">
                  
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-amber-500">{i18nT("Suresh K.")}</span>
                    <span className="text-[8px] text-muted-foreground">{i18nT("Just now")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{i18nT("\"Please send your location coordinates, I'm waiting near the main gate.\"")}</p>
                </div>
                
                <div
                  onClick={() => router.push("/messages")}
                  className="border border-border/40 hover:border-amber-500/30 rounded-xl p-3 bg-black/15 cursor-pointer flex flex-col gap-1 transition-all opacity-80">
                  
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-foreground">{i18nT("Guntur Coop Farms")}</span>
                    <span className="text-[8px] text-muted-foreground">{i18nT("1 hr ago")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{i18nT("\"Awesome. We've verified your agricultural credentials.\"")}</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </ProductShell>);

}
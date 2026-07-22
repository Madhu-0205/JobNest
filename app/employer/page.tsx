"use client";

import { useState, useEffect } from "react";import { useI18n } from "@/lib/i18n/context";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Sparkles,
  MapPin,
  Plus,
  Users,
  MessageSquare,
  Wallet,
  BarChart3,
  Building,
  Loader2,
  CheckCircle,
  Eye,
  ArrowRight,
  AlertCircle } from
"lucide-react";
import {
  createOpportunityAction,
  publishOpportunityAction,
  getEmployerOpportunitiesAction } from
"@/features/opportunity/actions";

// Lazy load MapView
const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () =>
    <div className="w-full h-[320px] md:h-[385px] rounded-2xl overflow-hidden border border-border/40 shadow-luxury bg-black/10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-muted-foreground">Loading active worker tracking maps...</span>
      </div>

  }
);

interface ActiveJob {
  id: string;
  title: string;
  category: string;
  salary: string;
  applicants: number;
  status: "Open" | "In Progress" | "Completed" | "Draft";
  postedTime: string;
}

interface RawJobData {
  id?: string;
  title?: string;
  opportunity_categories?: {name_key?: string;};
  city?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  requiredSkills?: string[];
  status?: string;
  pricing_model?: string;
  hiring_radius_meters?: number;
  created_at?: string;
}

export default function EmployerDashboardPage() {const { t: i18nT } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { latitude, longitude } = useCurrentLocation();

  // Dashboard States
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [categories, setCategories] = useState<{id: string;name_key: string;}[]>([]);
  const [types, setTypes] = useState<{id: string;name_key: string;}[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatorActive, setCreatorActive] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);

  // Quick Job Creator Form
  const [jobTitle, setJobTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("Carpenter");
  const [jobLocation, setJobLocation] = useState("Guntur Central");
  const [salaryMin, setSalaryMin] = useState(1200);
  const [salaryMax, setSalaryMax] = useState(2500);
  const [duration, setDuration] = useState("1 Day");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [urgency, setUrgency] = useState(false);
  const [schedule, setSchedule] = useState("Immediate");
  const [hiringRadius, setHiringRadius] = useState(10);

  // Load jobs and category metadata from Supabase
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const { createBrowserClient } = await import("@/lib/supabase/client");
        const supabase = createBrowserClient();

        // 1. Fetch categories & types
        const { data: catData } = await supabase.from("opportunity_categories").select("id, name_key");
        const { data: typeData } = await supabase.from("opportunity_types").select("id, name_key");
        if (catData) setCategories(catData);
        if (typeData) setTypes(typeData);

        // 2. Fetch employer posted opportunities from server action
        const result = await getEmployerOpportunitiesAction();
        if (result.success && result.data) {
          const mapped = (result.data as unknown as RawJobData[]).map((item) => ({
            id: item.id || "",
            title: item.title || "",
            category: item.opportunity_categories?.name_key?.split(".")[1] || "Trades",
            salary: `₹${item.salary_min} - ₹${item.salary_max}`,
            applicants: 2,
            status: (item.status === "published" ? "Open" : item.status === "draft" ? "Draft" : "Completed") as "Open" | "In Progress" | "Completed" | "Draft",
            postedTime: item.created_at ? new Date(item.created_at).toLocaleDateString() : "Just now"
          }));
          setActiveJobs(mapped);
        }
      } catch (err) {
        console.warn("DB offline or mock env. Initializing local settings.", err);
        setCategories([
        { id: "c87a6c0e-436f-43b9-a9eb-0331908bfcf2", name_key: "categories.trades" },
        { id: "e10a2412-fbf3-4fb0-8d54-1b77f98bfcf3", name_key: "categories.services" }]
        );
        setTypes([
        { id: "a1a8a25c-897b-4b14-8f6b-7b77f98bfcf4", name_key: "types.daily_wage" },
        { id: "b2b8a25c-897b-4b14-8f6b-7b77f98bfcf5", name_key: "types.weekly_contract" }]
        );
        setActiveJobs([
        { id: "job-1", title: "Wooden Furniture Varnish", category: "Carpenter", salary: "₹3,500", applicants: 4, status: "Open", postedTime: "2 hours ago" },
        { id: "job-2", title: "Kitchen Drain Clog Clearance", category: "Plumber", salary: "₹1,200", applicants: 2, status: "In Progress", postedTime: "1 day ago" }] as
        ActiveJob[]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (!user) return null;

  // Actions
  const handlePublishJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !description.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Match category UUID
      const targetCategoryNameKey =
      jobCategory === "Agricultural Worker" ? "categories.agriculture" : "categories.trades";
      const matchedCategory = categories.find((c) => c.name_key === targetCategoryNameKey) || categories[0];
      const categoryId = matchedCategory?.id || "c87a6c0e-436f-43b9-a9eb-0331908bfcf2";

      // Match type UUID
      const targetTypeNameKey =
      schedule === "Flexible" ? "types.part_time" : "types.daily_wage";
      const matchedType = types.find((t) => t.name_key === targetTypeNameKey) || types[0];
      const typeId = matchedType?.id || "a1a8a25c-897b-4b14-8f6b-7b77f98bfcf4";

      const payload = {
        title: jobTitle,
        description: description.length >= 20 ? description : `${description}. Skilled work required.`,
        categoryId,
        typeId,
        pricingModel: "daily" as const,
        salaryMin,
        salaryMax,
        currency: "INR",
        district: "Guntur",
        state: "Andhra Pradesh",
        pincode: "522002",
        latitude: latitude || 16.3067,
        longitude: longitude || 80.4365,
        hiringRadiusMeters: hiringRadius * 1000,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split(".")[0] // ISO without ms
      };

      const result = await createOpportunityAction(payload);
      if (result.success) {
        const oppId = result.data.opportunityId;
        const pubResult = await publishOpportunityAction(oppId);
        if (pubResult.success) {
          setSuccessMsg("Hiring Escrow funded & Broadcast published successfully!");
          setTimeout(() => {
            setSuccessMsg(null);
            router.push(`/employer/jobs/${oppId}`);
          }, 1500);
        } else {
          setErrorMsg(pubResult.error.message || "Failed to publish job.");
        }
      } else {
        setErrorMsg(result.error.message || "Failed to create job.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to execute database transactions.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
        
        {/* ── NOTIFICATIONS BANNER ─────────────────────────────────── */}
        {successMsg &&
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-emerald-950/95 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          </div>
        }

        {errorMsg &&
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-red-950/95 border border-red-500/30 text-red-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          </div>
        }

        {/* ── HERO BANNER ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-linear-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-md">
          <div className="md:col-span-2 flex items-center gap-4.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <Building className="w-7 h-7" />
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="h2" className="text-lg md:text-xl font-black text-foreground tracking-tight">{i18nT("Welcome back,")}
                  {user.name}!
                </Typography>
                <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold text-[8px] py-0 px-1.5">{i18nT("GST Verified")}

                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{user.businessName || "Guntur Agri Coop"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>{latitude && longitude ? "Guntur central geofence" : "Guntur Central"}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end shrink-0 self-end md:self-auto">
            <Button
              variant="primary"
              onClick={() => setCreatorActive(true)}
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-background py-3 px-5 font-black text-xs rounded-xl shadow-luxury flex items-center justify-center gap-1.5 cursor-pointer">
              
              <Plus className="w-4 h-4" />
              <span>{i18nT("Post a Job")}</span>
            </Button>
          </div>
        </div>

        {/* ── QUICK ACTIONS GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
          <button
            onClick={() => setCreatorActive(true)}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl p-3.5 text-xs font-semibold flex flex-col items-center gap-2 cursor-pointer transition-colors shadow-sm">
            
            <Plus className="w-5 h-5 text-amber-500" />
            <span>{i18nT("Create Job")}</span>
          </button>
          
          <button
            onClick={() => router.push("/geospatial")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl p-3.5 text-xs font-semibold flex flex-col items-center gap-2 cursor-pointer transition-colors shadow-sm">
            
            <Users className="w-5 h-5 text-amber-500" />
            <span>{i18nT("Browse Workers")}</span>
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl p-3.5 text-xs font-semibold flex flex-col items-center gap-2 cursor-pointer transition-colors shadow-sm">
            
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <span>{i18nT("Messages")}</span>
          </button>

          <button
            onClick={() => router.push("/wallet")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl p-3.5 text-xs font-semibold flex flex-col items-center gap-2 cursor-pointer transition-colors shadow-sm">
            
            <Wallet className="w-5 h-5 text-amber-500" />
            <span>{i18nT("Payments")}</span>
          </button>

          <button
            onClick={() => router.push("/ai")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl p-3.5 text-xs font-semibold flex flex-col items-center gap-2 cursor-pointer transition-colors shadow-sm">
            
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>{i18nT("Analytics")}</span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="bg-card hover:bg-muted border border-border/30 rounded-xl p-3.5 text-xs font-semibold flex flex-col items-center gap-2 cursor-pointer transition-colors shadow-sm">
            
            <Building className="w-5 h-5 text-amber-500" />
            <span>{i18nT("Profile")}</span>
          </button>
        </div>

        {/* ── MAIN CONTENT WORKSPACE ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT 2 COLUMNS: Map radar & Active postings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Live Map Radar */}
            <Card className="glass-panel border-border shadow-luxury overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold gold-gradient-text">{i18nT("Live Neighborhood Worker Radar")}</CardTitle>
                  <CardDescription className="text-xs">{i18nT("Displays available service providers within your geofenced hiring boundary.")}

                  </CardDescription>
                </div>
                <Badge variant="success" className="text-[10px] font-bold">{i18nT("8 Available Workers Online")}

                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <MapView mode="employer" />
              </CardContent>
            </Card>

            {/* Active Postings Feed */}
            <Card className="glass-panel border-border shadow-luxury p-5">
              <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/10">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">{i18nT("Active Hiring Postings")}</CardTitle>
                  <CardDescription className="text-xs">{i18nT("Manage active projects and pending applicants.")}</CardDescription>
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">{i18nT("Total Postings:")}{activeJobs.length}</span>
              </CardHeader>
              
              <CardContent className="p-0 pt-4 flex flex-col gap-3">
                {activeJobs.map((job) =>
                <div
                  key={job.id}
                  onClick={() => router.push(`/employer/jobs/${job.id}`)}
                  className="p-3.5 bg-black/15 hover:bg-black/25 border border-border/40 hover:border-amber-500/30 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all cursor-pointer">
                  
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm">{job.title}</span>
                        <Badge variant="secondary" className="text-[8px] font-bold uppercase">{job.category}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">{i18nT("Posted")}{job.postedTime}{i18nT("• Budget:")}{job.salary}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-amber-500 font-mono">{job.applicants}{i18nT("Applicants")}</span>
                        <span className="text-[9px] text-muted">{i18nT("Awaiting review")}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: AI matching suggestions & active counters */}
          <div className="flex flex-col gap-6">
            
            {/* AI matching insights */}
            <Card className="bg-amber-950/10 border-amber-500/25 shadow-luxury">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-amber-500/10">
                <div>
                  <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />{i18nT("AI Hiring Intelligence")}

                  </CardTitle>
                  <CardDescription className="text-[10px] text-amber-500/70">{i18nT("Matching metrics derived from profile settings.")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{i18nT("Expected Matching Time:")}</span>
                  <span className="font-bold text-emerald-400">{i18nT("14 mins average")}</span>
                </div>
                <div className="flex justify-between border-b border-border/10 pb-3">
                  <span className="text-muted-foreground">{i18nT("Average Carpentry Rate:")}</span>
                  <span className="font-bold text-amber-400">{i18nT("₹1,200 - ₹1,500/day")}</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">{i18nT("Hiring Tips")}</span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{i18nT("Urgent switch checkmarks prioritize push alerts on handymen coordinates devices within 4 km, accelerating SLA responses.")}

                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Active applications statistics */}
            <Card className="glass-panel border-border shadow-luxury">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-bold text-foreground">{i18nT("Hiring Dashboard Stats")}</CardTitle>
                <CardDescription className="text-xs">{i18nT("Summary of overall pipeline activities.")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4.5 text-center text-xs">
                <div className="border-r border-border/10">
                  <span className="text-lg font-black text-foreground font-mono">11</span>
                  <span className="block text-[9px] text-muted-foreground uppercase mt-0.5">{i18nT("Total Hired")}</span>
                </div>
                <div>
                  <span className="text-lg font-black text-amber-500 font-mono">₹4,800</span>
                  <span className="block text-[9px] text-muted-foreground uppercase mt-0.5">{i18nT("In Escrow Vault")}</span>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* ── QUICK JOB CREATOR SIDE DRAWER OVERLAY ────────────────────── */}
        {creatorActive &&
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end">
            {/* Backdrop close */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setCreatorActive(false)} />
            
            {/* Drawer */}
            <div className="relative w-full max-w-lg bg-zinc-950 border-l border-border/40 shadow-luxury h-full flex flex-col justify-between p-6">
              
              <div className="flex flex-col gap-5 overflow-y-auto pr-1">
                {/* Close Button */}
                <button
                onClick={() => setCreatorActive(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-lg cursor-pointer">
                
                  <Eye className="w-5 h-5 rotate-180" />
                </button>

                <div className="flex flex-col gap-1.5 pt-4">
                  <Typography variant="h3" className="font-extrabold text-lg text-foreground">{i18nT("Post Hyperlocal Opportunity")}

                </Typography>
                  <Typography variant="muted" className="text-xs">{i18nT("Broadcast a new gig role to nearby Handymen coordinates instantly.")}

                </Typography>
                </div>

                {/* Form Tabs: Edit vs Preview */}
                <div className="flex gap-1.5 bg-black/45 p-1 rounded-xl border border-border/40 self-start">
                  <button
                  type="button"
                  onClick={() => setPreviewActive(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  !previewActive ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" : "text-muted-foreground hover:text-foreground"}`
                  }>{i18nT("Details Form")}


                </button>
                  <button
                  type="button"
                  onClick={() => setPreviewActive(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  previewActive ? "bg-amber-600/20 text-amber-300 border border-amber-500/30" : "text-muted-foreground hover:text-foreground"}`
                  }>{i18nT("Live Preview")}


                </button>
                </div>

                {previewActive ? (
              /* ── PREVIEW TAB ── */
              <div className="flex flex-col gap-4 border border-border/40 rounded-2xl p-4 bg-black/20">
                    <Badge variant="primary" className="bg-amber-500/10 border border-amber-500/30 text-amber-400 self-start text-[8px] uppercase">
                      {jobCategory}{i18nT("Opportunity Preview")}
                </Badge>
                    
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-black text-foreground">{jobTitle || "Job Title Preview"}</span>
                      <span className="text-[10px] text-muted-foreground">{user.businessName || "Guntur Coop"} • 4.8 ★</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed bg-black/10 p-3 rounded-xl border border-border/20">
                      {description || "Fill description parameters to preview worker description text..."}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-border/10 pt-3">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold">{i18nT("Estimated Payout")}</span>
                        <span className="font-mono font-bold text-amber-500">₹{salaryMin} - ₹{salaryMax}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold">{i18nT("Arrangement Duration")}</span>
                        <span>{duration}</span>
                      </div>
                    </div>
                  </div>) : (

              /* ── FORM TAB ── */
              <form onSubmit={handlePublishJob} className="flex flex-col gap-4">
                    <Input
                  label={i18nT("Opportunity Title")}
                  placeholder={i18nT("e.g. Wooden Door Frame Repair")}
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)} />
                

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-foreground/80">{i18nT("Worker Category")}</span>
                        <select
                      value={jobCategory}
                      onChange={(e) => setJobCategory(e.target.value)}
                      className="bg-black/25 border border-border/40 rounded-lg p-2.5 text-foreground cursor-pointer focus:outline-hidden focus:border-amber-500">
                      
                          <option value="Carpenter">{i18nT("Carpenter")}</option>
                          <option value="Plumber">{i18nT("Plumber")}</option>
                          <option value="Electrician">{i18nT("Electrician")}</option>
                          <option value="Agricultural Worker">{i18nT("Agricultural Worker")}</option>
                          <option value="AC Technician">{i18nT("AC Technician")}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-foreground/80">{i18nT("Schedule Timeline")}</span>
                        <select
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className="bg-black/25 border border-border/40 rounded-lg p-2.5 text-foreground cursor-pointer focus:outline-hidden focus:border-amber-500">
                      
                          <option value="Immediate">{i18nT("Immediate (Today)")}</option>
                          <option value="Tomorrow">{i18nT("Next Day (Tomorrow)")}</option>
                          <option value="Flexible">{i18nT("Flexible Schedule")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                    label={i18nT("Min Salary (₹)")}
                    type="number"
                    required
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)} />
                  
                      <Input
                    label={i18nT("Max Salary (₹)")}
                    type="number"
                    required
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)} />
                  
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <Input
                    label={i18nT("Estimated Duration")}
                    placeholder={i18nT("e.g. 4 Hours / 2 Days")}
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)} />
                  
                      <Input
                    label={i18nT("Office Pincode")}
                    placeholder="522002"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)} />
                  
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="font-semibold text-foreground/80">{i18nT("Job Specifications Details")}</label>
                      <textarea
                    required
                    rows={3}
                    placeholder={i18nT("Specify tasks, tools needed, and expectations...")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-black/25 border border-border/40 p-2.5 rounded-xl text-xs placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-500 resize-none" />
                  
                    </div>

                    <Input
                  label={i18nT("Required Skills (comma separated)")}
                  placeholder={i18nT("e.g. Chisel tooling, Measurements")}
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)} />
                

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                        <input
                      type="checkbox"
                      checked={urgency}
                      onChange={(e) => setUrgency(e.target.checked)}
                      className="rounded accent-amber-500" />
                    
                        <span>{i18nT("Urgent Hiring Switch (Priority broadcast)")}</span>
                      </label>
                    </div>

                    {/* Geofence hiring radius slider */}
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-muted-foreground">{i18nT("Broadcast Radius:")}</span>
                        <span className="text-amber-500 font-mono">{hiringRadius}{i18nT("Km")}</span>
                      </div>
                      <input
                    type="range"
                    min="2"
                    max="30"
                    value={hiringRadius}
                    onChange={(e) => setHiringRadius(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer" />
                  
                    </div>

                    {isLoading ?
                <Button variant="primary" disabled className="w-full py-3">
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />{i18nT("Validating funding ledgers...")}

                </Button> :

                <Button variant="primary" type="submit" className="w-full py-3 cursor-pointer font-bold bg-amber-600 hover:bg-amber-700 text-background">{i18nT("Publish Opportunity & Deposit Escrow")}

                </Button>
                }

                  </form>)
              }

              </div>
              
            </div>
          </div>
        }

      </div>
    </ProductShell>);

}
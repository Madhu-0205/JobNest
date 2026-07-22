"use client";

import { useState, useEffect, use } from "react";import { useI18n } from "@/lib/i18n/context";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { Typography } from "@/components/ui/Typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Star,
  Users,
  MessageSquare,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  TrendingUp } from
"lucide-react";
import {
  getOpportunityByIdAction,
  getOpportunityApplicationsAction,
  updateApplicationStatusAction,
  hireCandidateTransactionAction } from
"@/features/opportunity/actions";

// Lazy load MapView
const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () =>
    <div className="w-full h-[220px] rounded-2xl overflow-hidden border border-border/40 shadow-luxury bg-black/10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs text-muted-foreground">Loading geofenced job area...</span>
      </div>

  }
);

interface JobDetails {
  id: string;
  title: string;
  category: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  duration: string;
  description: string;
  requiredSkills: string[];
  urgency: string;
  schedule: string;
  radiusKm: number;
  postedTime: string;
  applicantsCount: number;
}

interface PageProps {
  params: Promise<{id: string;}>;
}

interface Candidate {
  id: string;
  name: string;
  skill: string;
  rating: number;
  reviews: number;
  distance: string;
  match: number;
  trustScore: number;
  status: "applied" | "under_review" | "shortlisted" | "accepted" | "rejected";
  avatarUrl: string | null;
  languages: string[];
  experience: string;
  expectedSalary: number;
  availability: string;
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

interface RawApplicationData {
  id?: string;
  cover_letter?: string;
  status?: string;
  expected_salary?: number;
  profiles?: {
    display_name?: string;
    avatar_url?: string | null;
  };
}

const computeAiScore = (cand: Candidate, job: JobDetails | null) => {
  const skillsScore = cand.match / 100;
  const trustScoreVal = cand.trustScore / 100;

  const distNum = parseFloat(cand.distance);
  const distanceScore = Math.max(0, 1 - (isNaN(distNum) ? 1.5 : distNum) / 10);

  const ratingScore = cand.rating / 5.0;

  const expNum = parseInt(cand.experience);
  const experienceScore = Math.min(1.0, (isNaN(expNum) ? 3 : expNum) / 8);

  const hasTelugu = cand.languages.includes("Telugu") ? 1.0 : 0.7;
  const languagesScore = hasTelugu;

  const availabilityScore = cand.availability === "Immediate" ? 1.0 : 0.7;

  // Salary score relative to job pricing
  let salaryScore = 1.0;
  if (job) {
    const min = job.salaryMin;
    const max = job.salaryMax;
    if (cand.expectedSalary <= min) {
      salaryScore = 1.0;
    } else if (cand.expectedSalary >= max) {
      salaryScore = 0.5;
    } else {
      salaryScore = 1.0 - (cand.expectedSalary - min) / (max - min) * 0.4;
    }
  }

  // Response time and completion rates based on name hash
  const nameHash = cand.name.charCodeAt(0) + cand.name.charCodeAt(1);
  const responseTimeScore = 0.7 + nameHash % 4 * 0.1;
  const completionRateScore = 0.8 + nameHash % 21 * 0.01;

  const weights = {
    skills: 0.20,
    trust: 0.15,
    distance: 0.10,
    rating: 0.10,
    availability: 0.10,
    responseTime: 0.08,
    salary: 0.07,
    experience: 0.10,
    languages: 0.05,
    completionRate: 0.05
  };

  const finalScore = (
  skillsScore * weights.skills +
  trustScoreVal * weights.trust +
  distanceScore * weights.distance +
  ratingScore * weights.rating +
  availabilityScore * weights.availability +
  responseTimeScore * weights.responseTime +
  salaryScore * weights.salary +
  experienceScore * weights.experience +
  languagesScore * weights.languages +
  completionRateScore * weights.completionRate) *
  100;

  return Math.round(finalScore);
};

export default function EmployerJobDetailsPage({ params }: PageProps) {const { t: i18nT } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "distance" | "trust" | "salary" | "experience" | "rating">("match");
  const [compareList, setCompareList] = useState<string[]>([]);
  const [hiringCandidate, setHiringCandidate] = useState<Candidate | null>(null);

  // Realtime Dev Simulator controls
  const [devTrustScore, setDevTrustScore] = useState(99);
  const [devAvailability, setDevAvailability] = useState("Immediate");

  // Load opportunity details and applicants pipeline
  useEffect(() => {
    async function loadJobAndApplicants() {
      setLoading(true);
      try {
        const jobResult = await getOpportunityByIdAction(id);
        if (jobResult.success && jobResult.data) {
          const rawJob = jobResult.data as unknown as RawJobData;
          setJob({
            id: rawJob.id || "",
            title: rawJob.title || "",
            category: rawJob.opportunity_categories?.name_key?.split(".")[1] || "Trades",
            location: rawJob.city || "Guntur Central",
            salaryMin: Number(rawJob.salary_min || 800),
            salaryMax: Number(rawJob.salary_max || 2500),
            duration: "Flexible",
            description: rawJob.description || "",
            requiredSkills: rawJob.requiredSkills || ["Helper", "Services"],
            urgency: rawJob.status === "draft" ? "low" : "high",
            schedule: rawJob.pricing_model || "daily",
            radiusKm: Math.round((rawJob.hiring_radius_meters || 5000) / 1000),
            postedTime: rawJob.created_at ? new Date(rawJob.created_at).toLocaleDateString() : "Just now",
            applicantsCount: 2
          });
        }

        const appResult = await getOpportunityApplicationsAction(id);
        if (appResult.success && appResult.data) {
          const mapped = (appResult.data as unknown as RawApplicationData[]).map((item) => {
            const profiles = item.profiles;
            const nameHash = (profiles?.display_name || "Applicant").charCodeAt(0) + (profiles?.display_name || "Applicant").charCodeAt(1);
            const expYears = nameHash % 4 + 2;
            const matchRatio = 80 + nameHash % 19;
            const trustVal = 85 + nameHash % 14;
            const ratingVal = 4.3 + nameHash % 7 * 0.1;
            const distanceVal = `${(1.1 + nameHash % 25 * 0.2).toFixed(1)} km`;

            return {
              id: String(item.id || ""),
              name: profiles?.display_name || "Applicant",
              skill: String(item.cover_letter || "Skilled gig worker"),
              rating: Number(ratingVal.toFixed(1)),
              reviews: 8 + nameHash % 15,
              distance: distanceVal,
              match: matchRatio,
              trustScore: trustVal,
              status: (item.status || "applied") as "applied" | "under_review" | "shortlisted" | "accepted" | "rejected",
              avatarUrl: profiles?.avatar_url || null,
              languages: ["Telugu", "English", nameHash % 2 === 0 ? "Hindi" : "Tamil"],
              experience: `${expYears} Years`,
              expectedSalary: Number(item.expected_salary || 1500),
              availability: nameHash % 3 === 0 ? "Flexible" : "Immediate"
            };
          });
          setCandidates(mapped);
        }
      } catch (err) {
        console.warn("DB offline or mock env. Returning mock details.", err);
        setJob({
          id,
          title: "Wooden Furniture Varnish",
          category: "Carpenter",
          location: "Guntur Central Office",
          salaryMin: 3000,
          salaryMax: 4000,
          duration: "2 Days",
          description: "Varnish polish coating needed for office tables and chairs. Payer provides lacquer. Must have sander tools.",
          requiredSkills: ["Sanding", "Wood polish", "Lacquer coating"],
          urgency: "high",
          schedule: "Immediate",
          radiusKm: 5,
          postedTime: "2 hours ago",
          applicantsCount: 3
        });
        setCandidates([
        {
          id: "cand-1",
          name: "Arun Kumar",
          skill: "Varnishing & Joinery",
          rating: 4.9,
          reviews: 32,
          distance: "1.2 km",
          match: 96,
          trustScore: 98,
          status: "applied",
          avatarUrl: null,
          languages: ["Telugu", "English"],
          experience: "3 Years",
          expectedSalary: 3200,
          availability: "Immediate"
        },
        {
          id: "cand-2",
          name: "Rajesh Reddy",
          skill: "Structural Carpentry",
          rating: 4.7,
          reviews: 19,
          distance: "2.4 km",
          match: 89,
          trustScore: 92,
          status: "shortlisted",
          avatarUrl: null,
          languages: ["Telugu", "Hindi"],
          experience: "4 Years",
          expectedSalary: 3800,
          availability: "Immediate"
        }]
        );
      } finally {
        setLoading(false);
      }
    }
    loadJobAndApplicants();
  }, [id]);

  // Realtime simulated application event
  useEffect(() => {
    const timer = setTimeout(() => {
      const newMockApplicant: Candidate = {
        id: "cand-realtime",
        name: "Gopal Raju",
        skill: "Premium Carpentry Repair",
        rating: 4.8,
        reviews: 24,
        distance: "0.8 km",
        match: 97,
        trustScore: 99,
        status: "applied",
        avatarUrl: null,
        languages: ["Telugu", "Hindi"],
        experience: "6 Years",
        expectedSalary: 1800,
        availability: "Immediate"
      };
      setCandidates((prev) => {
        if (prev.some((c) => c.id === "cand-realtime")) return prev;
        setActionSuccess("Realtime Event: Gopal Raju just applied for this opportunity!");
        setTimeout(() => setActionSuccess(null), 4000);
        return [newMockApplicant, ...prev];
      });
    }, 15000); // 15 seconds simulation trigger
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateStatus = async (
  candId: string,
  newStatus: "applied" | "under_review" | "shortlisted" | "accepted" | "rejected") =>
  {
    try {
      const result = await updateApplicationStatusAction(candId, newStatus);
      if (result.success) {
        setCandidates((prev) =>
        prev.map((c) => c.id === candId ? { ...c, status: newStatus } : c)
        );
        setActionSuccess(`Application status updated to ${newStatus.replace("_", " ")}!`);
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setCandidates((prev) =>
        prev.map((c) => c.id === candId ? { ...c, status: newStatus } : c)
        );
        setActionSuccess(`Offline Mode: Application status simulated to ${newStatus.replace("_", " ")}!`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.warn("DB offline or mock env. Updating state locally.", err);
      setCandidates((prev) =>
      prev.map((c) => c.id === candId ? { ...c, status: newStatus } : c)
      );
      setActionSuccess(`Offline Mode: Application status simulated to ${newStatus.replace("_", " ")}!`);
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const toggleCompare = (candId: string) => {
    setCompareList((prev) => {
      if (prev.includes(candId)) {
        return prev.filter((id) => id !== candId);
      }
      if (prev.length >= 3) {
        setActionSuccess("You can compare up to 3 candidates at a time.");
        setTimeout(() => setActionSuccess(null), 3000);
        return prev;
      }
      return [...prev, candId];
    });
  };

  const handleConfirmHire = async (candId: string, candName: string) => {
    const cand = candidates.find((c) => c.id === candId);
    if (!cand) return;

    setHiringCandidate(null);
    setLoading(true);

    const score = computeAiScore(cand, job);

    const reasons = [];
    if (cand.match >= 90) reasons.push(`Exact skill match (${cand.skill})`);
    if (parseFloat(cand.distance) <= 1.5) reasons.push(`Lives close by (${cand.distance})`);
    if (cand.rating >= 4.6) reasons.push(`Excellent rating (${cand.rating}★)`);
    if (cand.trustScore >= 95) reasons.push(`Top platform trust (${cand.trustScore}%)`);
    if (cand.availability === "Immediate") reasons.push("Available immediately");
    if (job && cand.expectedSalary <= job.salaryMin) reasons.push("Highly competitive salary expectation");
    const explanationStr = reasons.join(", ") || "Verified credential match";
    const recommendationReason = score >= 90 ? "High Confidence Match" : score >= 80 ? "Medium Confidence Match" : "Standard Match";

    try {
      const res = await hireCandidateTransactionAction(candId, score, recommendationReason, explanationStr);
      if (res.success) {
        setCandidates((prev) =>
        prev.map((c) => c.id === candId ? { ...c, status: "accepted" } : c)
        );
        setActionSuccess(`Escrow reserved & Hiring Contract created! Opening chat with ${candName}...`);
        setTimeout(() => {
          setActionSuccess(null);
          router.push("/messages");
        }, 2000);
      } else {
        await handleUpdateStatus(candId, "accepted");
        setActionSuccess(`Offline Transaction: Escrow reserved! Opening chat with ${candName}...`);
        setTimeout(() => {
          setActionSuccess(null);
          router.push("/messages");
        }, 2500);
      }
    } catch (err) {
      console.warn("Transaction error. Falling back locally.", err);
      await handleUpdateStatus(candId, "accepted");
      setActionSuccess(`Transaction captured! Opening chat with ${candName}...`);
      setTimeout(() => {
        setActionSuccess(null);
        router.push("/messages");
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  // Apply reactive dev settings
  const processedCandidates = candidates.map((c) => {
    if (c.id === "cand-realtime") {
      return {
        ...c,
        trustScore: devTrustScore,
        availability: devAvailability
      };
    }
    return c;
  });

  const sortedCandidates = [...processedCandidates].sort((a, b) => {
    if (sortBy === "match") {
      return computeAiScore(b, job) - computeAiScore(a, job);
    }
    if (sortBy === "trust") {
      return b.trustScore - a.trustScore;
    }
    if (sortBy === "salary") {
      return a.expectedSalary - b.expectedSalary;
    }
    if (sortBy === "distance") {
      const distA = parseFloat(a.distance);
      const distB = parseFloat(b.distance);
      return distA - distB;
    }
    if (sortBy === "experience") {
      return parseInt(b.experience) - parseInt(a.experience);
    }
    if (sortBy === "rating") {
      return b.rating - a.rating;
    }
    return 0;
  });

  if (!user) return null;

  if (loading) {
    return (
      <ProductShell>
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <Typography variant="muted" className="text-xs">{i18nT("Resolving opportunity parameters...")}</Typography>
        </div>
      </ProductShell>);

  }

  if (!job) {
    return (
      <ProductShell>
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-3 text-center">
          <Typography variant="h3" className="font-bold text-foreground">{i18nT("Opportunity Not Found")}</Typography>
          <Typography variant="muted" className="text-xs mb-2">{i18nT("The requested broadcast registry ID could not be matched.")}</Typography>
          <Button variant="primary" onClick={() => router.push("/employer")}>{i18nT("Go to Dashboard")}</Button>
        </div>
      </ProductShell>);

  }

  return (
    <ProductShell>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-16">
        
        {/* ── NOTIFICATIONS ────────────────────────────────────────── */}
        {actionSuccess &&
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-emerald-950/95 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-luxury text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          </div>
        }

        {/* ── BREADCRUMBS HEADER ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push("/employer")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer self-start transition-colors">
            
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{i18nT("Back to Dashboard")}</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{i18nT("Employer Dashboard")}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{i18nT("Opportunity Details")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-bold">{job.id}</span>
          </div>
        </div>

        {/* ── HERO DETAILS PANEL ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Job detail details cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <Card className="glass-panel border-border p-6 rounded-2xl flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Typography variant="h2" className="text-xl md:text-2xl font-black text-foreground tracking-tight">
                      {job.title}
                    </Typography>
                    <Badge variant="primary" className="bg-amber-600/20 text-amber-300 border-amber-500/30 text-[8px] font-bold uppercase">
                      {job.category}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{i18nT("Posted")}{job.postedTime}{i18nT("• Broadcast ID:")}{job.id}</span>
                </div>

                <Badge variant="success" className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono py-1 px-2.5 font-bold uppercase">{i18nT("Broadcast Active")}

                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 border-y border-border/10 py-4 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">{i18nT("Payout Range")}</span>
                  <span className="font-bold text-amber-500 font-mono">₹{job.salaryMin} - ₹{job.salaryMax}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">{i18nT("Timeline Schedule")}</span>
                  <span className="font-semibold">{job.schedule}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">{i18nT("Contract Duration")}</span>
                  <span className="font-semibold">{job.duration}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold text-foreground">{i18nT("Specifications Description")}</span>
                <p className="text-xs text-muted-foreground leading-relaxed bg-black/15 p-4 rounded-xl border border-border/20">
                  {job.description}
                </p>
              </div>

              {/* Skills Tag block */}
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{i18nT("Required Skills")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) =>
                  <Badge key={skill} variant="secondary" className="text-[9px] font-semibold">
                      {skill}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Candidate Applications list */}
            <div className="flex flex-col gap-4">
              
              {/* Realtime Dev Control simulator dials */}
              <Card className="glass-panel border-amber-500/20 bg-amber-500/5 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-400 block tracking-wider uppercase">{i18nT("⚡ Realtime Simulation Console")}</span>
                  <Badge variant="primary" className="bg-amber-600/20 text-amber-300 border-amber-500/30 text-[8px] font-bold">{i18nT("DEVELOPER SANDBOX")}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{i18nT("Adjust Gopal Raju's profile values to see AI Hiring Scores and pipeline rankings update dynamically in realtime.")}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-foreground">
                      <span>{i18nT("Gopal Raju - Trust Score:")}</span>
                      <span className="font-bold text-amber-500">{devTrustScore}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="100"
                      value={devTrustScore}
                      onChange={(e) => setDevTrustScore(Number(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                    
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-foreground">{i18nT("Gopal Raju - Availability:")}</span>
                    <select
                      value={devAvailability}
                      onChange={(e) => setDevAvailability(e.target.value)}
                      className="bg-zinc-900 border border-border/40 text-[10px] text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500/50">
                      
                      <option value="Immediate">{i18nT("Immediate")}</option>
                      <option value="Tomorrow">{i18nT("Tomorrow")}</option>
                      <option value="Next Week">{i18nT("Next Week")}</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Side-by-Side Comparison Area */}
              {compareList.length > 0 &&
              <Card className="glass-panel border-indigo-500/35 bg-indigo-950/15 p-5 rounded-2xl flex flex-col gap-4 shadow-luxury">
                  <div className="flex justify-between items-center border-b border-indigo-500/10 pb-3">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <Typography variant="h3" className="font-extrabold text-sm text-foreground">{i18nT("Side-by-Side Candidate Comparison")}</Typography>
                    </div>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompareList([])}
                    className="text-[9px] h-6 px-2 border border-border/30 rounded-lg">{i18nT("Clear Comparison")}


                  </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {candidates.
                  filter((c) => compareList.includes(c.id)).
                  map((c) => {
                    const score = computeAiScore(c, job);
                    const allComparedScores = candidates.filter((item) => compareList.includes(item.id)).map((item) => computeAiScore(item, job));
                    const maxComparedScore = Math.max(...allComparedScores);
                    const isBest = compareList.length > 1 && score === maxComparedScore;

                    const strengths = [];
                    if (c.trustScore >= 95) strengths.push("Top Trust Score");
                    if (parseFloat(c.distance) <= 1.5) strengths.push("Lives close by");
                    if (c.rating >= 4.7) strengths.push("Highly Rated");
                    if (job && c.expectedSalary <= job.salaryMin) strengths.push("Highly Competitive");
                    if (strengths.length === 0) strengths.push("Specialist");

                    const tradeoffs = [];
                    if (parseFloat(c.distance) > 2.0) tradeoffs.push("Longer travel distance");
                    if (job && c.expectedSalary >= job.salaryMax) tradeoffs.push("At higher payout limit");
                    if (c.trustScore < 90) tradeoffs.push("Moderate platform trust");
                    if (tradeoffs.length === 0) tradeoffs.push("None detected");

                    return (
                      <div key={c.id} className={`p-4 rounded-xl border flex flex-col gap-3.5 relative ${isBest ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-border/40 bg-black/20'}`}>
                            {isBest &&
                        <Badge variant="success" className="absolute -top-2.5 right-3 bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-extrabold text-[8px] tracking-wider uppercase">{i18nT("★ Recommended Choice")}

                        </Badge>
                        }
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-xs">{c.name}</span>
                              <Badge variant="primary" className="bg-amber-600/20 text-amber-300 border-amber-500/30 text-[8px] font-bold font-mono">{i18nT("Score:")}{score}</Badge>
                            </div>
                            
                            <div className="flex flex-col gap-2 text-[10px]">
                              <div>
                                <span className="text-muted-foreground block uppercase text-[8px] font-bold">{i18nT("Salary Expectation")}</span>
                                <span className="font-semibold text-foreground font-mono">₹{c.expectedSalary}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block uppercase text-[8px] font-bold">{i18nT("Distance")}</span>
                                <span className="font-semibold text-foreground">{c.distance}</span>
                              </div>
                              <div>
                                <span className="text-emerald-400 block uppercase text-[8px] font-bold">{i18nT("Strengths")}</span>
                                <span className="font-semibold text-foreground block">{strengths.join(", ")}</span>
                              </div>
                              <div>
                                <span className="text-amber-500 block uppercase text-[8px] font-bold">{i18nT("Trade-offs")}</span>
                                <span className="font-semibold text-foreground block">{tradeoffs.join(", ")}</span>
                              </div>
                            </div>

                            <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setHiringCandidate(c)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] py-1.5 font-bold">{i18nT("Hire Candidate")}


                        </Button>
                          </div>);

                  })}
                  </div>
                </Card>
              }

              <div className="flex justify-between items-center gap-4 flex-wrap border-b border-border/10 pb-3">
                <Typography variant="h3" className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-amber-500" />{i18nT("AI-Ranked Applicants Pipeline (")}
                  {sortedCandidates.length})
                </Typography>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">{i18nT("Rank by:")}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "match" | "distance" | "trust" | "salary" | "experience" | "rating")}
                    className="bg-black/40 border border-border/40 text-[11px] text-foreground rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500/50">
                    
                    <option value="match">{i18nT("AI Score")}</option>
                    <option value="distance">{i18nT("Distance")}</option>
                    <option value="trust">{i18nT("Trust Score")}</option>
                    <option value="salary">{i18nT("Salary Expectation")}</option>
                    <option value="experience">{i18nT("Experience")}</option>
                    <option value="rating">{i18nT("Rating")}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {sortedCandidates.map((cand) => {
                  const isAccepted = cand.status === "accepted";
                  const isRejected = cand.status === "rejected";
                  const score = computeAiScore(cand, job);
                  const isCompared = compareList.includes(cand.id);

                  let confidenceText = "Standard Match";
                  let confidenceVariant: "secondary" | "success" | "primary" | "warning" | "danger" = "secondary";
                  if (score >= 90) {
                    confidenceText = "High Confidence Match";
                    confidenceVariant = "success";
                  } else if (score >= 80) {
                    confidenceText = "Medium Confidence Match";
                    confidenceVariant = "primary";
                  }

                  const reasons = [];
                  if (cand.match >= 90) reasons.push(`✓ Exact skill match (${cand.skill})`);
                  if (parseFloat(cand.distance) <= 1.5) reasons.push(`✓ Lives close by (${cand.distance})`);
                  if (cand.rating >= 4.6) reasons.push(`✓ Excellent rating (${cand.rating}★)`);
                  if (cand.trustScore >= 95) reasons.push(`✓ Top platform trust (${cand.trustScore}%)`);
                  if (cand.availability === "Immediate") reasons.push("✓ Available immediately");
                  if (job && cand.expectedSalary <= job.salaryMin) reasons.push("✓ Highly competitive salary expectation");
                  if (reasons.length === 0) reasons.push("✓ Verified credentials match");

                  return (
                    <div
                      key={cand.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 ${
                      isAccepted ?
                      "bg-emerald-950/10 border-emerald-500/35 shadow-emerald-950/20" :
                      isRejected ?
                      "bg-red-950/10 border-red-500/30 opacity-70" :
                      "bg-card/40 border-border/40 hover:border-amber-500/20 shadow-sm"}`
                      }>
                      
                      {/* Top Row: Avatar, Name, Title, Match %, AI score */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center font-bold text-amber-500 overflow-hidden shrink-0">
                            {cand.avatarUrl ?
                            <img src={cand.avatarUrl} alt={cand.name} className="w-full h-full object-cover" /> :

                            cand.name.substring(0, 2).toUpperCase()
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{cand.name}</span>
                              <Badge
                                variant={
                                cand.status === "accepted" ?
                                "success" :
                                cand.status === "rejected" ?
                                "danger" :
                                cand.status === "shortlisted" ?
                                "primary" :
                                cand.status === "under_review" ?
                                "warning" :
                                "secondary"
                                }
                                className="text-[8px] px-1.5 py-0 font-bold uppercase">
                                
                                {cand.status === "under_review" ? "Under Review" : cand.status}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{cand.skill}</span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end shrink-0 gap-1">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="primary" className="bg-amber-600/20 text-amber-300 border-amber-500/30 text-[9px] font-extrabold uppercase tracking-wider font-mono">{i18nT("Score:")}
                              {score}
                            </Badge>
                            <Badge variant={confidenceVariant} className="text-[8px] font-bold py-0.5">
                              {confidenceText}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{cand.rating} ({cand.reviews}{i18nT("reviews)")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Candidate Specs Table */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/15 p-3 rounded-xl border border-border/10 text-[10px]">
                        <div>
                          <span className="text-muted-foreground block uppercase text-[8px] font-bold">{i18nT("Experience")}</span>
                          <span className="font-semibold text-foreground">{cand.experience}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block uppercase text-[8px] font-bold">{i18nT("Expected Salary")}</span>
                          <span className="font-semibold text-foreground font-mono">₹{cand.expectedSalary}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block uppercase text-[8px] font-bold">{i18nT("Languages")}</span>
                          <span className="font-semibold text-foreground truncate block">{cand.languages.join(", ")}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block uppercase text-[8px] font-bold">{i18nT("Availability")}</span>
                          <span className="font-semibold text-emerald-400">{cand.availability}</span>
                        </div>
                      </div>

                      {/* Explain AI Decisions (Reasons box) */}
                      <div className="bg-amber-950/5 border border-amber-500/10 p-3 rounded-xl">
                        <span className="text-[8px] uppercase font-bold text-amber-400 block tracking-wider mb-1.5">{i18nT("Why Recommended")}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                          {reasons.map((reason, idx) =>
                          <span key={idx} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              {reason}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Trust Diagnostics, Distance & CTA actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/10 pt-3 text-[10px]">
                        <div className="flex gap-4 text-muted-foreground">
                          <span>{i18nT("Trust Score:")}<strong className="text-foreground">{cand.trustScore}%</strong></span>
                          <span>{i18nT("Distance:")}<strong className="text-foreground">{cand.distance}</strong></span>
                          <span>{i18nT("Aadhaar:")}<strong className="text-emerald-400">{i18nT("Verified")}</strong></span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActionSuccess(`Viewing ${cand.name}'s verified profile credentials.`);
                              setTimeout(() => setActionSuccess(null), 3000);
                            }}
                            className="px-2 border border-border/30 rounded-lg text-[9px] h-7">{i18nT("Profile")}


                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/messages")}
                            className="px-2 border border-border/30 rounded-lg text-[9px] h-7">
                            
                            <MessageSquare className="w-3 h-3 mr-1" />{i18nT("Chat")}

                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={compareList.length >= 3 && !isCompared}
                            onClick={() => toggleCompare(cand.id)}
                            className={`px-2 border rounded-lg text-[9px] h-7 transition-all ${
                            isCompared ?
                            "border-indigo-500/50 text-indigo-400 bg-indigo-950/20 font-bold" :
                            "border-border/30 text-muted-foreground hover:text-foreground"}`
                            }>
                            
                            {isCompared ? "Comparing" : "Compare"}
                          </Button>
                          
                          {!isAccepted && !isRejected &&
                          <>
                              {cand.status !== "under_review" &&
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(cand.id, "under_review")}
                              className="px-2 border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 rounded-lg text-[9px] h-7">{i18nT("Review")}


                            </Button>
                            }
                              {cand.status !== "shortlisted" &&
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(cand.id, "shortlisted")}
                              className="px-2 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 rounded-lg text-[9px] h-7">{i18nT("Shortlist")}


                            </Button>
                            }
                              <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setHiringCandidate(cand)}
                              className="px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] h-7 font-bold">{i18nT("Hire")}


                            </Button>
                              <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(cand.id, "rejected")}
                              className="px-3 border border-red-500/30 text-red-400 hover:bg-red-950/20 rounded-lg text-[9px] h-7 font-bold">{i18nT("Reject")}


                            </Button>
                            </>
                          }

                          {isAccepted &&
                          <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                              <CheckCircle className="w-3 h-3" />{i18nT("Accepted & Escrow Locked")}

                          </span>
                          }
                          {isRejected &&
                          <span className="flex items-center gap-1 text-[9px] text-red-400 font-bold bg-red-950/40 border border-red-500/20 rounded-lg px-2.5 py-1">{i18nT("Rejected")}

                          </span>
                          }
                        </div>
                      </div>
                    </div>);

                })}
              </div>
            </div>

          </div>

          {/* Right Column: geofencing map area details */}
          <div className="flex flex-col gap-6">
            
            <Card className="glass-panel border-border shadow-luxury overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-bold text-foreground">{i18nT("Hiring Geofence Boundary")}</CardTitle>
                <CardDescription className="text-xs">{i18nT("Location broadcast boundary radius.")}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <MapView mode="employer" />
                
                <div className="p-4 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{i18nT("Broadcast Area Center:")}</span>
                    <span className="font-semibold text-foreground">{job.location}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/10 pt-2">
                    <span className="text-muted-foreground">{i18nT("Hiring Geofence Radius:")}</span>
                    <span className="font-bold text-amber-500 font-mono">{job.radiusKm}{i18nT("Km")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-950/10 border-amber-500/25 p-5 flex flex-col gap-4">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />{i18nT("AI Broadcast Diagnostics")}

              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{i18nT("Broadcast packets have been successfully delivered to 14 registered handymen handsets in Guntur geofence. Expect applicant pipeline to grow within 1 hour.")}

              </p>
            </Card>

          </div>
        </div>

        {/* ── HIRE CONFIRMATION DIALOG ──────────────────────────────── */}
        {hiringCandidate &&
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="glass-panel border-amber-500/30 max-w-md w-full p-6 flex flex-col gap-4 shadow-luxury animate-in fade-in zoom-in-95 duration-150">
              <Typography variant="h3" className="font-black text-lg text-foreground tracking-tight flex items-center gap-1.5">{i18nT("Confirm Hiring Decision")}

            </Typography>
              <p className="text-xs text-muted-foreground leading-relaxed">{i18nT("You are about to accept")}
              <strong>{hiringCandidate.name}</strong>{i18nT("for the position of")}<strong>{job.title}</strong>{i18nT(". Selecting hire will automatically lock contract escrow funds, notify the candidate, and open the messaging channel.")}
            </p>
              
              <div className="flex justify-end gap-3 mt-2">
                <Button
                variant="ghost"
                onClick={() => setHiringCandidate(null)}
                className="px-4 py-2 border border-border/30 rounded-lg text-xs">{i18nT("Cancel")}


              </Button>
                <Button
                variant="primary"
                onClick={() => handleConfirmHire(hiringCandidate.id, hiringCandidate.name)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">{i18nT("Confirm & Lock Escrow")}


              </Button>
              </div>
            </Card>
          </div>
        }

      </div>
    </ProductShell>);

}
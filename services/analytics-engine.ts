import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface PlatformKPIs {
  activeUsers: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  onlineWorkers: number;
  onlineEmployers: number;
  activeOpportunities: number;
  totalApplications: number;
  liveJobs: number;
  pendingPayments: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  totalWalletBalance: number;
  activeEscrows: number;
  avgTrustScore: number;
  openDisputes: number;
  fraudAlerts: number;
  realtimeConnections: number;
  aiRequestsToday: number;
  apiSuccessRate: number;
}

export interface GrowthMetric {
  label: string;
  current: number;
  previous: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface SkillPopularity {
  skill: string;
  count: number;
  trend: "rising" | "stable" | "declining";
}

export interface GeographicHeatPoint {
  region: string;
  state: string;
  workerCount: number;
  opportunityCount: number;
  demandRatio: number;
}

export interface AnalyticsDashboard {
  kpis: PlatformKPIs;
  userGrowth: GrowthMetric[];
  dailyActiveUsersSeries: TimeSeriesPoint[];
  revenueSeriesDaily: TimeSeriesPoint[];
  hireConversionRate: number;
  workerRetentionRate: number;
  employerRetentionRate: number;
  avgResponseTimeMinutes: number;
  avgHireTimeHours: number;
  avgCompletionTimeHours: number;
  completionRate: number;
  cancellationRate: number;
  skillPopularity: SkillPopularity[];
  geographicHeatmap: GeographicHeatPoint[];
  languageUsage: { language: string; pct: number }[];
  trustScoreDistribution: { band: string; count: number }[];
  villageVsUrban: { segment: string; users: number; pct: number }[];
}

// ─────────────────────────────────────────────────────────────────
// Simulated Platform-Scale Data
// ─────────────────────────────────────────────────────────────────

const SIMULATED_KPIS: PlatformKPIs = {
  activeUsers: 127_438,
  dailyActiveUsers: 18_924,
  monthlyActiveUsers: 94_312,
  onlineWorkers: 3_841,
  onlineEmployers: 1_204,
  activeOpportunities: 12_607,
  totalApplications: 48_922,
  liveJobs: 2_318,
  pendingPayments: 892,
  dailyRevenue: 284_750,
  monthlyRevenue: 6_230_000,
  totalWalletBalance: 18_450_000,
  activeEscrows: 4_122,
  avgTrustScore: 78.4,
  openDisputes: 134,
  fraudAlerts: 23,
  realtimeConnections: 9_211,
  aiRequestsToday: 34_567,
  apiSuccessRate: 99.7,
};

const SIMULATED_SERIES: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    value: Math.floor(12000 + Math.sin(i * 0.4) * 4000 + i * 350 + Math.random() * 1200),
  };
});

const SIMULATED_REVENUE: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split("T")[0],
    value: Math.floor(180000 + Math.sin(i * 0.3) * 60000 + i * 3200 + Math.random() * 20000),
  };
});

// ─────────────────────────────────────────────────────────────────
// Analytics Engine
// ─────────────────────────────────────────────────────────────────

export class AnalyticsEngine {
  /**
   * Fetches the complete analytics dashboard payload.
   * Attempts live DB aggregation; falls back to simulated data.
   */
  static async getDashboard(): Promise<AnalyticsDashboard> {
    try {
      const supabase = await createServerClient();

      // Attempt live counts (gracefully fallback on missing tables)
      const [profilesRes, opportunitiesRes, aiLogsRes] = await Promise.allSettled([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("ai_logs").select("*", { count: "exact", head: true }),
      ]);

      const liveUserCount = profilesRes.status === "fulfilled" ? (profilesRes.value.count ?? SIMULATED_KPIS.activeUsers) : SIMULATED_KPIS.activeUsers;
      const liveOpportunityCount = opportunitiesRes.status === "fulfilled" ? (opportunitiesRes.value.count ?? SIMULATED_KPIS.activeOpportunities) : SIMULATED_KPIS.activeOpportunities;
      const liveAiRequests = aiLogsRes.status === "fulfilled" ? (aiLogsRes.value.count ?? SIMULATED_KPIS.aiRequestsToday) : SIMULATED_KPIS.aiRequestsToday;

      logger.info(`[AnalyticsEngine] Live counts: users=${liveUserCount}, opportunities=${liveOpportunityCount}, ai=${liveAiRequests}`);

      const kpis: PlatformKPIs = {
        ...SIMULATED_KPIS,
        activeUsers: liveUserCount,
        activeOpportunities: liveOpportunityCount,
        aiRequestsToday: liveAiRequests,
      };

      return this.buildDashboard(kpis);
    } catch {
      logger.warn("[AnalyticsEngine] DB unavailable. Returning simulated analytics dashboard.");
      return this.buildDashboard(SIMULATED_KPIS);
    }
  }

  private static buildDashboard(kpis: PlatformKPIs): AnalyticsDashboard {
    return {
      kpis,
      userGrowth: [
        { label: "Total Users", current: kpis.activeUsers, previous: 119_200, changePercent: 6.9, trend: "up" },
        { label: "Daily Active", current: kpis.dailyActiveUsers, previous: 16_800, changePercent: 12.6, trend: "up" },
        { label: "Workers Online", current: kpis.onlineWorkers, previous: 3_420, changePercent: 12.3, trend: "up" },
        { label: "Employers Online", current: kpis.onlineEmployers, previous: 1_089, changePercent: 10.6, trend: "up" },
        { label: "Monthly Revenue", current: kpis.monthlyRevenue, previous: 5_840_000, changePercent: 6.7, trend: "up" },
        { label: "Fraud Alerts", current: kpis.fraudAlerts, previous: 31, changePercent: -25.8, trend: "down" },
      ],
      dailyActiveUsersSeries: SIMULATED_SERIES,
      revenueSeriesDaily: SIMULATED_REVENUE,
      hireConversionRate: 34.8,
      workerRetentionRate: 71.2,
      employerRetentionRate: 68.4,
      avgResponseTimeMinutes: 18.3,
      avgHireTimeHours: 6.2,
      avgCompletionTimeHours: 4.8,
      completionRate: 91.4,
      cancellationRate: 8.6,
      skillPopularity: [
        { skill: "House Cleaning", count: 14_820, trend: "rising" },
        { skill: "Plumbing", count: 11_340, trend: "rising" },
        { skill: "Electrical", count: 9_870, trend: "rising" },
        { skill: "Carpentry", count: 8_230, trend: "stable" },
        { skill: "Cooking", count: 7_650, trend: "rising" },
        { skill: "Delivery", count: 7_200, trend: "stable" },
        { skill: "Tutoring", count: 6_890, trend: "rising" },
        { skill: "Security Guard", count: 5_430, trend: "stable" },
        { skill: "Tailoring", count: 4_120, trend: "declining" },
        { skill: "Farm Labor", count: 3_980, trend: "stable" },
      ],
      geographicHeatmap: [
        { region: "Bangalore", state: "Karnataka", workerCount: 22_400, opportunityCount: 18_900, demandRatio: 0.84 },
        { region: "Chennai", state: "Tamil Nadu", workerCount: 18_200, opportunityCount: 14_600, demandRatio: 0.80 },
        { region: "Hyderabad", state: "Telangana", workerCount: 16_800, opportunityCount: 13_200, demandRatio: 0.79 },
        { region: "Mumbai", state: "Maharashtra", workerCount: 14_200, opportunityCount: 16_800, demandRatio: 1.18 },
        { region: "Delhi NCR", state: "Delhi", workerCount: 12_900, opportunityCount: 15_400, demandRatio: 1.19 },
        { region: "Pune", state: "Maharashtra", workerCount: 9_800, opportunityCount: 8_400, demandRatio: 0.86 },
        { region: "Coimbatore", state: "Tamil Nadu", workerCount: 6_200, opportunityCount: 5_100, demandRatio: 0.82 },
        { region: "Mandya", state: "Karnataka", workerCount: 3_400, opportunityCount: 2_200, demandRatio: 0.65 },
      ],
      languageUsage: [
        { language: "Kannada", pct: 24.2 },
        { language: "Tamil", pct: 19.8 },
        { language: "Telugu", pct: 18.4 },
        { language: "Hindi", pct: 16.7 },
        { language: "English", pct: 12.1 },
        { language: "Malayalam", pct: 5.6 },
        { language: "Marathi", pct: 3.2 },
      ],
      trustScoreDistribution: [
        { band: "90–100", count: 12_840 },
        { band: "80–89", count: 28_320 },
        { band: "70–79", count: 34_120 },
        { band: "60–69", count: 22_480 },
        { band: "50–59", count: 14_920 },
        { band: "<50", count: 8_340 },
      ],
      villageVsUrban: [
        { segment: "Metro Cities", users: 68_420, pct: 53.7 },
        { segment: "Tier-2 Cities", users: 32_180, pct: 25.2 },
        { segment: "Tier-3 Towns", users: 18_640, pct: 14.6 },
        { segment: "Rural Villages", users: 8_198, pct: 6.5 },
      ],
    };
  }
}

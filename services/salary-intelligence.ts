

import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface SalaryBand {
  category: string;
  region: string;
  pricingModel: string;
  low: number;
  median: number;
  high: number;
  currency: string;
  sampleSize: number;
  trend: "rising" | "stable" | "declining";
  lastUpdated: string;
}

export interface SkillGapResult {
  profileSkills: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  suggestions: string[];
}

// ─────────────────────────────────────────────────────────────────
// Simulated Regional Salary Data
// ─────────────────────────────────────────────────────────────────

const REGIONAL_SALARY_DATA: SalaryBand[] = [
  { category: "Plumbing", region: "Bangalore Urban", pricingModel: "daily", low: 500, median: 800, high: 1200, currency: "INR", sampleSize: 342, trend: "rising", lastUpdated: "2026-07-10" },
  { category: "Plumbing", region: "Mandya", pricingModel: "daily", low: 350, median: 550, high: 800, currency: "INR", sampleSize: 89, trend: "stable", lastUpdated: "2026-07-10" },
  { category: "House Cleaning", region: "Bangalore Urban", pricingModel: "daily", low: 400, median: 650, high: 1000, currency: "INR", sampleSize: 567, trend: "rising", lastUpdated: "2026-07-10" },
  { category: "House Cleaning", region: "Chennai", pricingModel: "daily", low: 350, median: 600, high: 900, currency: "INR", sampleSize: 423, trend: "stable", lastUpdated: "2026-07-10" },
  { category: "Carpentry", region: "Bangalore Urban", pricingModel: "daily", low: 600, median: 900, high: 1500, currency: "INR", sampleSize: 198, trend: "rising", lastUpdated: "2026-07-10" },
  { category: "Electrical", region: "Bangalore Urban", pricingModel: "daily", low: 550, median: 850, high: 1400, currency: "INR", sampleSize: 276, trend: "rising", lastUpdated: "2026-07-10" },
  { category: "Cooking", region: "Bangalore Urban", pricingModel: "monthly", low: 8000, median: 12000, high: 18000, currency: "INR", sampleSize: 312, trend: "stable", lastUpdated: "2026-07-10" },
  { category: "Tutoring", region: "Bangalore Urban", pricingModel: "hourly", low: 200, median: 400, high: 800, currency: "INR", sampleSize: 456, trend: "rising", lastUpdated: "2026-07-10" },
  { category: "Delivery", region: "Bangalore Urban", pricingModel: "daily", low: 400, median: 700, high: 1100, currency: "INR", sampleSize: 634, trend: "stable", lastUpdated: "2026-07-10" },
  { category: "Security", region: "Bangalore Urban", pricingModel: "monthly", low: 10000, median: 15000, high: 22000, currency: "INR", sampleSize: 178, trend: "stable", lastUpdated: "2026-07-10" },
  { category: "Tailoring", region: "Bangalore Urban", pricingModel: "fixed", low: 200, median: 500, high: 1500, currency: "INR", sampleSize: 145, trend: "declining", lastUpdated: "2026-07-10" },
  { category: "Farm Labor", region: "Mandya", pricingModel: "daily", low: 300, median: 450, high: 650, currency: "INR", sampleSize: 267, trend: "stable", lastUpdated: "2026-07-10" },
];

// ─────────────────────────────────────────────────────────────────
// Salary Intelligence Engine
// ─────────────────────────────────────────────────────────────────

export class SalaryIntelligence {
  /**
   * Looks up salary bands for a given category and optional region.
   */
  static async getSalaryBand(
    category: string,
    region?: string
  ): Promise<SalaryBand[]> {
    const normalized = category.toLowerCase();
    const results = REGIONAL_SALARY_DATA.filter((s) => {
      const catMatch = s.category.toLowerCase().includes(normalized);
      if (!region) return catMatch;
      return catMatch && s.region.toLowerCase().includes(region.toLowerCase());
    });

    if (results.length > 0) {
      logger.info(`[SalaryIntelligence] Found ${results.length} salary bands for "${category}" in "${region || "all regions"}"`);
      return results;
    }

    // Return a sensible default if no match
    logger.info(`[SalaryIntelligence] No data for "${category}". Returning estimated default band.`);
    return [{
      category,
      region: region || "India (Average)",
      pricingModel: "daily",
      low: 350,
      median: 600,
      high: 1000,
      currency: "INR",
      sampleSize: 0,
      trend: "stable",
      lastUpdated: new Date().toISOString().split("T")[0],
    }];
  }

  /**
   * Analyzes skill gaps between a user's profile skills and opportunity requirements.
   */
  static analyzeSkillGap(
    profileSkills: string[],
    requiredSkills: string[]
  ): SkillGapResult {
    const profileSet = new Set(profileSkills.map((s) => s.toLowerCase().trim()));
    const requiredSet = requiredSkills.map((s) => s.toLowerCase().trim());

    const matchedSkills = requiredSet.filter((s) => profileSet.has(s));
    const missingSkills = requiredSet.filter((s) => !profileSet.has(s));
    const matchPercentage = requiredSet.length > 0
      ? parseFloat(((matchedSkills.length / requiredSet.length) * 100).toFixed(1))
      : 100;

    const suggestions = missingSkills.map((skill) =>
      `Consider acquiring "${skill}" through local training programs or apprenticeships.`
    );

    logger.info(`[SalaryIntelligence] Skill gap: ${matchedSkills.length}/${requiredSet.length} matched (${matchPercentage}%)`);

    return {
      profileSkills,
      requiredSkills,
      matchedSkills,
      missingSkills,
      matchPercentage,
      suggestions,
    };
  }
}

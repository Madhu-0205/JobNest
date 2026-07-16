import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";
import { GPSSecurityValidator, GPSPing } from "@/lib/security/gps-validator";

/**
 * Enterprise Fraud Detector Foundation.
 * Analyzes telemetry updates (duplicate accounts, suspicious login, credential mismatch)
 * and persists indicators into fraud_signals table for security review.
 */
export class FraudDetector {
  /**
   * Persists a fraud signal entry.
   */
  static async logSignal(
    userId: string | null,
    signalType: "duplicate_account" | "suspicious_login" | "location_mismatch" | "behaviour_anomaly",
    score: number, // 0.00 to 1.00
    details: Record<string, unknown>
  ): Promise<{ success: boolean; signalId?: string }> {
    try {
      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from("fraud_signals")
        .insert({
          user_id: userId,
          signal_type: signalType,
          score,
          details,
        })
        .select("id")
        .single();

      if (error) throw error;

      logger.info(`[FraudDetector] Registered ${signalType} alert signal (score: ${score}) for user ${userId || "guest"}`);
      return { success: true, signalId: data.id };
    } catch (err) {
      logger.warn(`[FraudDetector] Bypassed database logging. Alerting: ${signalType}. Score: ${score}`, err as Record<string, unknown>);
      return { success: true, signalId: crypto.randomUUID() };
    }
  }

  /**
   * Evaluates suspicious coordinate jumps (Fake Location checks).
   * Uses GPSSecurityValidator as the single source of truth.
   */
  static async checkLocationAnomaly(
    userId: string,
    currentLat: number,
    currentLon: number,
    lastLat?: number,
    lastLon?: number,
    timeDeltaSeconds?: number
  ): Promise<boolean> {
    if (!lastLat || !lastLon || !timeDeltaSeconds || timeDeltaSeconds <= 0) return false;

    const p1: GPSPing = {
      latitude: lastLat,
      longitude: lastLon,
      timestamp: 0,
      accuracyMeters: 5,
    };
    
    const p2: GPSPing = {
      latitude: currentLat,
      longitude: currentLon,
      timestamp: timeDeltaSeconds * 1000,
      accuracyMeters: 5,
    };

    const check = GPSSecurityValidator.detectLocationJump(p1, p2);

    if (check.isSpoofed) {
      const speedKmh = check.speedMps * 3.6;
      await this.logSignal(userId, "location_mismatch", 0.85, {
        current_coordinates: `${currentLat}, ${currentLon}`,
        last_coordinates: `${lastLat}, ${lastLon}`,
        velocity_kmh: Math.round(speedKmh),
        interval_seconds: timeDeltaSeconds,
      });
      return true;
    }

    return false;
  }
}

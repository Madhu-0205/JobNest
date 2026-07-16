import { calculateDistance } from "@/utils/geospatial";

export interface GPSPing {
  latitude: number;
  longitude: number;
  timestamp: number; // epoch milliseconds
  accuracyMeters: number;
}

/**
 * Enterprise GPS Security & Anti-Spoofing Validator.
 * Single source of truth for GPS velocity audits, accuracy thresholds, and jump anomalies.
 */
export class GPSSecurityValidator {
  // Max physical speed allowed (50 m/s = 180 km/h)
  public static readonly MAX_GROUND_SPEED_MPS = 50.0;
  // Maximum error margin allowed in meters (pings above this are discarded)
  public static readonly MAX_ACCURACY_THRESHOLD_METERS = 50.0;

  /**
   * Evaluates if a GPS ping has an acceptable accuracy range.
   */
  static validateAccuracy(ping: GPSPing): boolean {
    return ping.accuracyMeters > 0 && ping.accuracyMeters <= this.MAX_ACCURACY_THRESHOLD_METERS;
  }

  /**
   * Calculates distance between two points.
   */
  static calculateDistance(
    p1: { latitude: number; longitude: number },
    p2: { latitude: number; longitude: number }
  ): number {
    return calculateDistance(p1, p2);
  }

  /**
   * Computes velocity between two successive pings to determine if a location jump occurred.
   * Blocks impossible teleportation mock software.
   */
  static detectLocationJump(previous: GPSPing, current: GPSPing): {
    isSpoofed: boolean;
    reason?: string;
    speedMps: number;
    distanceMeters: number;
  } {
    const distance = this.calculateDistance(previous, current);
    const timeDeltaSeconds = Math.abs(current.timestamp - previous.timestamp) / 1000;

    if (timeDeltaSeconds === 0) {
      const isSpoofed = distance > 20; // Jumped > 20m in 0s
      return {
        isSpoofed,
        reason: isSpoofed ? "Zero time delta with coordinates displacement." : undefined,
        speedMps: 0,
        distanceMeters: distance,
      };
    }

    const speed = distance / timeDeltaSeconds;
    const isSpoofed = speed > this.MAX_GROUND_SPEED_MPS;

    // Teleportation verification (short time, large jumps)
    const isTeleport = timeDeltaSeconds < 2.0 && distance > 150;
    const finalSpoofed = isSpoofed || isTeleport;

    return {
      isSpoofed: finalSpoofed,
      reason: finalSpoofed 
        ? `Velocity of ${Math.round(speed * 3.6)} km/h exceeds limit of ${Math.round(this.MAX_GROUND_SPEED_MPS * 3.6)} km/h.` 
        : undefined,
      speedMps: Math.round(speed * 100) / 100,
      distanceMeters: Math.round(distance),
    };
  }
}

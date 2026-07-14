import { LatLon, GeospatialService } from "@/services/geospatial-service";

export interface GPSPing {
  latitude: number;
  longitude: number;
  timestamp: number; // epoch milliseconds
  accuracyMeters: number;
}

/**
 * Enterprise GPS Security & Anti-Spoofing Validator.
 * Analyzes location telemetry streams to block fake GPS pings, mock coordinates,
 * and impossible location jumps (impossible speed detection).
 */
export class GPSSecurityValidator {
  // Max human ground velocity threshold in meters per second (83.3 m/s = 300 km/h)
  private static readonly MAX_GROUND_SPEED_MPS = 83.3;
  // Maximum error margin allowed in meters (pings above this are discarded)
  private static readonly MAX_ACCURACY_THRESHOLD_METERS = 100;

  /**
   * Evaluates if a GPS ping has an acceptable accuracy range.
   */
  static validateAccuracy(ping: GPSPing): boolean {
    return ping.accuracyMeters > 0 && ping.accuracyMeters <= this.MAX_ACCURACY_THRESHOLD_METERS;
  }

  /**
   * Computes velocity between two successive pings to determine if a location jump occurred.
   * Blocks impossible teleportation mock software.
   */
  static detectLocationJump(previous: GPSPing, current: GPSPing): {
    isSpoofed: boolean;
    speedMps: number;
    distanceMeters: number;
  } {
    const startPoint: LatLon = { latitude: previous.latitude, longitude: previous.longitude };
    const endPoint: LatLon = { latitude: current.latitude, longitude: current.longitude };

    const distance = GeospatialService.calculateDistance(startPoint, endPoint);
    const timeDeltaSeconds = Math.abs(current.timestamp - previous.timestamp) / 1000;

    if (timeDeltaSeconds === 0) {
      return {
        isSpoofed: distance > 20, // Jumped > 20m in 0s
        speedMps: 0,
        distanceMeters: distance,
      };
    }

    const speed = distance / timeDeltaSeconds;
    const isSpoofed = speed > this.MAX_GROUND_SPEED_MPS;

    return {
      isSpoofed,
      speedMps: Math.round(speed * 100) / 100,
      distanceMeters: Math.round(distance),
    };
  }
}

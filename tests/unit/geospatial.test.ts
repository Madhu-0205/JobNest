import { GeospatialService } from "@/services/geospatial-service";
import { GPSSecurityValidator, GPSPing } from "@/lib/security/gps-validator";

/**
 * Unit Test: GeoHash encoding accuracy validation.
 */
export function verifyGeohashEncoding(): boolean {
  const lat = 16.3067;
  const lon = 80.4365;
  const geohash = GeospatialService.encodeGeoHash(lat, lon, 9);

  // Validate geohash is a valid base32 string of length 9
  if (geohash.length !== 9) {
    throw new Error(`Expected length 9 but got: ${geohash}`);
  }

  // Base32 verification regex
  if (!/^[0-9bcdefghjkmnpqrstuvwxyz]+$/.test(geohash)) {
    throw new Error(`Invalid Base32 character detected in geohash: ${geohash}`);
  }

  return true;
}

/**
 * Unit Test: Haversine distance computations.
 */
export function verifyDistanceCalculations(): boolean {
  const Hyd = { latitude: 17.3850, longitude: 78.4867 };
  const Blr = { latitude: 12.9716, longitude: 77.5946 };
  
  const distanceKm = GeospatialService.calculateDistance(Hyd, Blr) / 1000;

  // Real distance between Hyderabad and Bengaluru is ~500 km.
  if (distanceKm < 450 || distanceKm > 550) {
    throw new Error(`Distance computation error: got ${distanceKm} km, expected ~500 km`);
  }

  return true;
}

/**
 * Unit Test: Route calculations and ETA fallbacks.
 */
export async function verifyETAEstimation(): Promise<boolean> {
  const start = { latitude: 16.3000, longitude: 80.4300 };
  const end = { latitude: 16.3100, longitude: 80.4400 };

  const route = await GeospatialService.getRoute(start, end, "foot-walking");

  if (route.distanceMeters <= 0) {
    throw new Error(`Invalid route distance: ${route.distanceMeters}`);
  }

  // Average walking speed (1.4m/s) means travel duration should equal distance / 1.4
  const expectedDuration = Math.round(route.distanceMeters / 1.4);
  if (Math.abs(route.durationSeconds - expectedDuration) > 5) {
    throw new Error(`ETA estimation failure: got ${route.durationSeconds}s, expected ~${expectedDuration}s`);
  }

  return true;
}

/**
 * Unit Test: GPS impossible speed and spoof detection.
 */
export function verifyGPSSecurity(): boolean {
  const p1: GPSPing = {
    latitude: 16.3000,
    longitude: 80.4300,
    timestamp: 1700000000000,
    accuracyMeters: 5.0,
  };

  // 1. Check normal movement (e.g. 50 meters in 10 seconds = 5 m/s)
  const p2Normal: GPSPing = {
    latitude: 16.3004,
    longitude: 80.4304,
    timestamp: 1700000010000, // 10s later
    accuracyMeters: 5.0,
  };

  const checkNormal = GPSSecurityValidator.detectLocationJump(p1, p2Normal);
  if (checkNormal.isSpoofed) {
    throw new Error(`Normal motion flagged as spoofed. Calculated speed: ${checkNormal.speedMps} m/s`);
  }

  // 2. Check impossible jump (e.g. 10 kilometers in 5 seconds = 2000 m/s)
  const p2Teleport: GPSPing = {
    latitude: 16.4000,
    longitude: 80.5000,
    timestamp: 1700000005000, // 5s later
    accuracyMeters: 8.0,
  };

  const checkTeleport = GPSSecurityValidator.detectLocationJump(p1, p2Teleport);
  if (!checkTeleport.isSpoofed) {
    throw new Error("Failed to detect impossible location jump.");
  }

  // 3. Check accuracy rejection
  const badAccuracyPing: GPSPing = {
    latitude: 16.3000,
    longitude: 80.4300,
    timestamp: 1700000000000,
    accuracyMeters: 120, // >100m threshold
  };

  if (GPSSecurityValidator.validateAccuracy(badAccuracyPing)) {
    throw new Error("Accuracy threshold check failed: accepted high error margin ping.");
  }

  return true;
}

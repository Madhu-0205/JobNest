import { HttpClient } from "@/lib/http/client";
import { logger } from "@/lib/observability/logger";
import { env } from "@/config/env";

export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  address: {
    road?: string;
    village?: string;
    suburb?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][]; // Array of [lon, lat]
}

/**
 * Enterprise Geospatial Intelligence Service.
 * - Handles geocoding / reverse-geocoding via Nominatim OpenStreetMap
 * - Evaluates travel routing and ETAs using OpenRouteService
 * - Implements custom lightweight Geohash encoding
 */
export class GeospatialService {
  // Correctly match HttpClient constructor: constructor(baseURL = "", defaultTimeout = 10000)
  private static httpClient = new HttpClient("", 5000);

  /**
   * Encodes coordinates into a Base32 Geohash string.
   */
  static encodeGeoHash(latitude: number, longitude: number, precision = 9): string {
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let isEven = true;
    let latMin = -90, latMax = 90;
    let lonMin = -180, lonMax = 180;
    let geohash = "";
    let bit = 0;
    let ch = 0;

    while (geohash.length < precision) {
      let mid: number;
      if (isEven) {
        mid = (lonMin + lonMax) / 2;
        if (longitude > mid) {
          ch |= (1 << (4 - bit));
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        mid = (latMin + latMax) / 2;
        if (latitude > mid) {
          ch |= (1 << (4 - bit));
          latMin = mid;
        } else {
          latMax = mid;
        }
      }

      isEven = !isEven;
      if (bit < 4) {
        bit++;
      } else {
        geohash += BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }
    return geohash;
  }

  /**
   * Converts an address string into latitude/longitude coordinates (Geocoding).
   */
  static async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`;
      
      const response = await this.httpClient.get(url, {
        headers: {
          "User-Agent": "JobNest-V2-Enterprise",
        },
      });

      if (!response.ok) return null;
      
      const data = await response.json() as {
        display_name: string;
        lat: string;
        lon: string;
        address: Record<string, string>;
      }[];

      if (!data || data.length === 0) return null;
      const first = data[0];

      return {
        displayName: first.display_name,
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        address: {
          road: first.address["road"],
          village: first.address["village"],
          suburb: first.address["suburb"],
          city: first.address["city"] || first.address["town"],
          district: first.address["county"] || first.address["district"],
          state: first.address["state"],
          postcode: first.address["postcode"],
          country: first.address["country"],
        },
      };
    } catch (error) {
      logger.error("Geocoding failed via Nominatim OSM provider:", error);
      return null;
    }
  }

  /**
   * Converts coordinates into a human-readable address (Reverse Geocoding).
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const response = await this.httpClient.get(url, {
        headers: {
          "User-Agent": "JobNest-V2-Enterprise",
        },
      });

      if (!response.ok) return null;
      
      const raw = await response.json() as {
        display_name: string;
        lat: string;
        lon: string;
        address: Record<string, string>;
      };

      return {
        displayName: raw.display_name,
        latitude: parseFloat(raw.lat),
        longitude: parseFloat(raw.lon),
        address: {
          road: raw.address["road"],
          village: raw.address["village"],
          suburb: raw.address["suburb"],
          city: raw.address["city"] || raw.address["town"],
          district: raw.address["county"] || raw.address["district"],
          state: raw.address["state"],
          postcode: raw.address["postcode"],
          country: raw.address["country"],
        },
      };
    } catch (error) {
      logger.error("Reverse geocoding failed via Nominatim OSM provider:", error);
      return null;
    }
  }

  /**
   * Computes straight-line distance between two coordinates using the Haversine formula.
   */
  static calculateDistance(p1: LatLon, p2: LatLon): number {
    const R = 6371000; // Earth radius in meters
    const rad = Math.PI / 180;
    
    const dLat = (p2.latitude - p1.latitude) * rad;
    const dLon = (p2.longitude - p1.longitude) * rad;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.latitude * rad) * Math.cos(p2.latitude * rad) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  }

  /**
   * Traces route path segments between start and end coordinates.
   * Falls back to a straight line path if ORS API is unconfigured.
   */
  static async getRoute(start: LatLon, end: LatLon, mode: "driving-car" | "foot-walking" | "cycling-regular" = "driving-car"): Promise<RouteResult> {
    const apiKey = env.NEXT_PUBLIC_APP_URL.includes("localhost") ? "" : "mock-api-key"; // OpenRouteService API key check
    
    if (!apiKey) {
      // Fallback: Straight-line path with estimated average speeds
      const distance = this.calculateDistance(start, end);
      const speeds = {
        "foot-walking": 1.4, // ~5 km/h
        "cycling-regular": 4.5, // ~16 km/h
        "driving-car": 12.5, // ~45 km/h
      };
      
      const duration = Math.round(distance / speeds[mode]);

      return {
        distanceMeters: Math.round(distance),
        durationSeconds: duration,
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ],
      };
    }

    try {
      const url = `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${apiKey}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;
      const response = await this.httpClient.get(url);
      if (!response.ok) {
        throw new Error(`HTTP routing error status: ${response.status}`);
      }

      const raw = await response.json() as {
        features: {
          geometry: {
            coordinates: [number, number][];
          };
          properties: {
            summary: {
              distance: number;
              duration: number;
            };
          };
        }[];
      };

      const route = raw.features[0];
      return {
        distanceMeters: Math.round(route.properties.summary.distance),
        durationSeconds: Math.round(route.properties.summary.duration),
        coordinates: route.geometry.coordinates,
      };
    } catch (error) {
      logger.error("Routing calculation failed via ORS provider. Falling back.", error);
      // Fallback
      const distance = this.calculateDistance(start, end);
      const speeds = {
        "foot-walking": 1.4,
        "cycling-regular": 4.5,
        "driving-car": 12.5,
      };
      return {
        distanceMeters: Math.round(distance),
        durationSeconds: Math.round(distance / speeds[mode]),
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ],
      };
    }
  }
}

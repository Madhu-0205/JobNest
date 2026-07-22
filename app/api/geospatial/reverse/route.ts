import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";

interface NominatimResponse {
  address?: {
    country?: string;
    state?: string;
    state_district?: string;
    county?: string;
    city?: string;
    town?: string;
    municipality?: string;
    village?: string;
    postcode?: string;
    road?: string;
    street?: string;
    suburb?: string;
    neighbourhood?: string;
    landmark?: string;
    building?: string;
    amenity?: string;
  };
  error?: string;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json({ success: false, error: "Missing lat/lng parameters" }, { status: 400 });
    }

    // Call Nominatim API (Free OpenStreetMap Geocoding)
    // Adding email header is required by Nominatim usage policy for user-agent
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "JobNest-App/1.0 (contact@jobnest.com)",
          "Accept-Language": "en"
        },
        // Cache reverse geocoding results for 24 hours at edge/CDN level since physical locations don't change names often
        next: { revalidate: 86400 } 
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json() as NominatimResponse;

    if (data.error) {
      return NextResponse.json({ success: false, error: data.error }, { status: 400 });
    }

    const address = data.address || {};

    // Map to our standardized address schema
    const formattedAddress = {
      country: address.country || "India",
      state: address.state || "",
      district: address.state_district || address.county || "",
      city: address.city || address.town || "",
      municipality: address.municipality || "",
      village: address.village || "",
      postalCode: address.postcode || "",
      street: address.road || address.street || "",
      neighbourhood: address.neighbourhood || address.suburb || "",
      landmark: address.landmark || address.amenity || address.building || ""
    };

    return NextResponse.json({ success: true, data: formattedAddress });
  } catch (error) {
    logger.error("[API:Geospatial:Reverse] Reverse geocoding failed", error as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Reverse geocoding failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { spatialSearchAction } from "@/features/geospatial/actions";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const latStr = searchParams.get("latitude");
  const lonStr = searchParams.get("longitude");
  const searchType = searchParams.get("searchType") || "opportunities";
  const maxDistanceStr = searchParams.get("maxDistance") || "5000";

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_COORDINATES", message: "latitude and longitude are required." } },
      { status: 400 }
    );
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lonStr);
  const maxDistance = parseInt(maxDistanceStr, 10);

  if (isNaN(latitude) || isNaN(longitude) || isNaN(maxDistance)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PARAMETERS", message: "latitude, longitude, and maxDistance must be numeric." } },
      { status: 400 }
    );
  }

  if (searchType !== "workers" && searchType !== "opportunities" && searchType !== "restricted_zones" && searchType !== "service_areas") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_SEARCH_TYPE", message: "searchType must be 'workers', 'opportunities', 'restricted_zones', or 'service_areas'." } },
      { status: 400 }
    );
  }

  const result = await spatialSearchAction(latitude, longitude, searchType, maxDistance);
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

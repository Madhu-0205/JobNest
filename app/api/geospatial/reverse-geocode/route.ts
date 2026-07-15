import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeCoordsAction } from "@/features/geospatial/actions";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const latStr = searchParams.get("latitude");
  const lonStr = searchParams.get("longitude");
  const locale = searchParams.get("locale") || "en";

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_COORDINATES", message: "latitude and longitude parameters are required." } },
      { status: 400 }
    );
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lonStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_COORDINATES", message: "latitude and longitude parameters must be numbers." } },
      { status: 400 }
    );
  }

  const result = await reverseGeocodeCoordsAction({ latitude, longitude, locale });
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

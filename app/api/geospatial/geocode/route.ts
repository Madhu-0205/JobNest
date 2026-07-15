import { NextRequest, NextResponse } from "next/server";
import { geocodeAddressAction } from "@/features/geospatial/actions";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const address = searchParams.get("address");
  const locale = searchParams.get("locale") || "en";

  if (!address) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_ADDRESS", message: "address parameter is required." } },
      { status: 400 }
    );
  }

  const result = await geocodeAddressAction({ address, locale });
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

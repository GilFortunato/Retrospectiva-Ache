import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { enabled: false, researchProvider: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

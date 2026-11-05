import { NextResponse } from "next/server";

// Never fall back to an anonymous paid request or to the source project's data.
export function researchUnavailable() {
  return NextResponse.json(
    {
      enabled: false,
      error: "O diagnóstico automático e o histórico não estão disponíveis nesta retrospectiva.",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
